const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const db = require('./database');
const apiRoutes = require('./routes');
const auth = require('./auth');
const { sanitizeString, validateEmail } = require('./validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting map for login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// ===== SECURITY MIDDLEWARE =====

// Helmet: comprehensive security headers (replaces manual headers)
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for inline scripts/styles
    crossOriginEmbedderPolicy: false
}));

// HTTP Parameter Pollution protection
app.use(hpp());

// Body size limit (prevent payload attacks)
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10kb' }));

// Global API rate limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: 'Too many authentication attempts. Please try again later.' }
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// Session configuration with enhanced security
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production-' + Date.now(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevent XSS access to cookie
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict' // CSRF protection
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// ===== CSRF TOKEN SYSTEM =====
// Generate CSRF token for each session
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    next();
});

// Endpoint to get CSRF token (frontend calls this)
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.session.csrfToken });
});

// CSRF validation for state-changing requests
app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.path.startsWith('/api/')) {
        // Skip CSRF check for login/register/auto-login (pre-session routes)
        const skipPaths = ['/api/login', '/api/register', '/api/auto-login'];
        if (skipPaths.includes(req.path)) {
            return next();
        }
        const token = req.headers['x-csrf-token'];
        if (!token || token !== req.session.csrfToken) {
            return res.status(403).json({ error: 'Invalid or missing CSRF token' });
        }
    }
    next();
});

// Auth routes (public)
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Strong password validation
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one number' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return res.status(400).json({ error: 'Password must contain at least one special character (!@#$%^&*...)' });
    }

    try {
        const existingUser = await auth.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const passwordHash = await auth.hashPassword(password);
        const user = await auth.createUser(email, passwordHash, name);

        req.session.userId = user.id;
        res.json({ message: 'Registration successful', user: { id: user.id, email: user.email, name: user.name } });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    const attemptKey = `${email.toLowerCase()}_${clientIP}`;

    // Check for rate limiting
    const attempts = loginAttempts.get(attemptKey);
    if (attempts && attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const timeSinceLock = Date.now() - attempts.lastAttempt;
        if (timeSinceLock < LOCKOUT_TIME) {
            const remainingTime = Math.ceil((LOCKOUT_TIME - timeSinceLock) / 60000);
            return res.status(429).json({
                error: `Too many login attempts. Please try again in ${remainingTime} minutes.`
            });
        } else {
            // Reset after lockout period
            loginAttempts.delete(attemptKey);
        }
    }

    try {
        const user = await auth.findUserByEmail(email);
        if (!user) {
            // Track failed attempt
            trackLoginAttempt(attemptKey);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await auth.comparePassword(password, user.password_hash);
        if (!isValid) {
            // Track failed attempt
            trackLoginAttempt(attemptKey);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Successful login - clear attempts
        loginAttempts.delete(attemptKey);

        // Regenerate session ID on login to prevent session fixation
        req.session.regenerate(async (err) => {
            if (err) {
                console.error('Session regeneration error:', err);
            }
            req.session.userId = user.id;
            // Generate new CSRF token for the regenerated session
            req.session.csrfToken = crypto.randomBytes(32).toString('hex');

            let rememberToken = null;

            // Extend session and generate token if Remember Me is checked
            if (rememberMe) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
                try {
                    rememberToken = await generateRememberToken(user.id);
                } catch (err) {
                    console.error('Error generating remember token:', err);
                }
            }

            res.json({
                message: 'Login successful',
                user: { id: user.id, email: user.email, name: user.name },
                rememberToken, // Will be null if not checked
                csrfToken: req.session.csrfToken // Send new CSRF token after session regeneration
            });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Helper function to track login attempts
function trackLoginAttempt(key) {
    const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(key, attempts);
}

// Helper function to generate remember token
function generateRememberToken(userId) {
    return new Promise((resolve, reject) => {
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

        // Delete old tokens for this user first
        db.run('DELETE FROM remember_tokens WHERE user_id = ?', [userId], (err) => {
            if (err) console.error('Error deleting old tokens:', err);

            // Insert new token
            db.run(
                'INSERT INTO remember_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [userId, token, expiresAt],
                function (err) {
                    if (err) reject(err);
                    else resolve(token);
                }
            );
        });
    });
}

// Auto-login with remember token
app.post('/api/auto-login', async (req, res) => {
    const { rememberToken } = req.body;

    if (!rememberToken) {
        return res.status(400).json({ error: 'No token provided' });
    }

    db.get(
        'SELECT rt.user_id, rt.expires_at, u.email, u.name FROM remember_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = ?',
        [rememberToken],
        (err, row) => {
            if (err) {
                console.error('Auto-login error:', err);
                return res.status(500).json({ error: 'Auto-login failed' });
            }

            if (!row) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            // Check if token is expired
            if (new Date(row.expires_at) < new Date()) {
                // Delete expired token
                db.run('DELETE FROM remember_tokens WHERE token = ?', [rememberToken]);
                return res.status(401).json({ error: 'Token expired' });
            }

            // Valid token - create session
            req.session.regenerate((err) => {
                if (err) {
                    console.error('Session regeneration error:', err);
                }
                req.session.userId = row.user_id;
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
                res.json({
                    message: 'Auto-login successful',
                    user: { id: row.user_id, email: row.email, name: row.name }
                });
            });
        }
    );
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

app.get('/api/me', (req, res) => {
    if (req.session && req.session.userId) {
        auth.findUserById(req.session.userId)
            .then(user => {
                if (user) {
                    res.json({ user });
                } else {
                    res.status(401).json({ error: 'Not authenticated' });
                }
            })
            .catch(() => res.status(401).json({ error: 'Not authenticated' }));
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Protected API Routes
app.use('/api', auth.requireAuth, apiRoutes);

// Serve login page for unauthenticated requests
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
