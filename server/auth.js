const bcrypt = require('bcryptjs');
const db = require('./database');

const auth = {
    // Hash password
    hashPassword: async (password) => {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    },

    // Compare password with hash
    comparePassword: async (password, hash) => {
        return await bcrypt.compare(password, hash);
    },

    // Create a new user
    createUser: (email, passwordHash, name) => {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)';
            db.run(sql, [email.toLowerCase(), passwordHash, name], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, email, name });
                }
            });
        });
    },

    // Find user by email
    findUserByEmail: (email) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE email = ?';
            db.get(sql, [email.toLowerCase()], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Find user by ID
    findUserById: (id) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT id, email, name, created_at FROM users WHERE id = ?';
            db.get(sql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Middleware to check if user is authenticated
    requireAuth: (req, res, next) => {
        if (req.session && req.session.userId) {
            next();
        } else {
            res.status(401).json({ error: 'Unauthorized. Please login.' });
        }
    }
};

module.exports = auth;
