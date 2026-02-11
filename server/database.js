const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../credit-card.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDatabase();
    }
});

function initDatabase() {
    db.serialize(() => {
        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Cards Table (linked to users)
        db.run(`CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            holder_name TEXT,
            number TEXT,
            expiry TEXT,
            cvv TEXT,
            balance REAL DEFAULT 0,
            currency TEXT DEFAULT 'USD',
            brand TEXT DEFAULT 'visa',
            billing_street TEXT,
            billing_city TEXT,
            billing_zip TEXT,
            billing_country TEXT,
            is_default INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Create Transactions Table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            card_id TEXT,
            title TEXT,
            date TEXT,
            amount REAL,
            type TEXT,
            icon TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Create Payments Table
        db.run(`CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            card_id TEXT,
            amount REAL,
            recipient TEXT,
            date TEXT,
            status TEXT,
            reference TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (card_id) REFERENCES cards(id)
        )`);

        // Create Recurring Transactions Table
        db.run(`CREATE TABLE IF NOT EXISTS recurring_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            amount REAL,
            type TEXT,
            frequency TEXT,
            next_due_date TEXT,
            icon TEXT,
            active INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Create Budget Goals Table
        db.run(`CREATE TABLE IF NOT EXISTS budget_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT,
            amount_limit REAL,
            period TEXT DEFAULT 'monthly',
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, category)
        )`);

        // Create Remember Tokens Table for auto-login
        db.run(`CREATE TABLE IF NOT EXISTS remember_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`, () => {
            console.log('Database initialized');
            // Check if demo user exists, if not create demo data
            seedDemoData();
        });
    });
}

async function seedDemoData() {
    // Check if demo user already exists
    db.get("SELECT id FROM users WHERE email = ?", ['demo@example.com'], async (err, row) => {
        if (row) {
            console.log('Demo data already exists');
            return;
        }

        console.log('Creating demo data...');

        // Create demo user with password: demo123
        const passwordHash = await bcrypt.hash('demo123', 10);

        db.run(
            "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
            ['demo@example.com', passwordHash, 'Demo User'],
            function (err) {
                if (err) {
                    console.error('Error creating demo user:', err);
                    return;
                }

                const userId = this.lastID;
                console.log(`Created demo user with ID: ${userId}`);

                // Add demo cards
                const cards = [
                    { id: 'card_demo_1', name: 'My Personal Visa', lastFour: '4532', expiry: '12/26', brand: 'visa', currency: 'USD', balance: 2450.00, isDefault: 1 },
                    { id: 'card_demo_2', name: 'Business Mastercard', lastFour: '8721', expiry: '08/25', brand: 'mastercard', currency: 'USD', balance: 5200.50, isDefault: 0 },
                    { id: 'card_demo_3', name: 'Travel Rewards Card', lastFour: '3344', expiry: '03/27', brand: 'amex', currency: 'USD', balance: 1875.25, isDefault: 0 }
                ];

                cards.forEach(card => {
                    db.run(
                        "INSERT INTO cards (id, user_id, holder_name, number, expiry, balance, currency, brand, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [card.id, userId, card.name, card.lastFour, card.expiry, card.balance, card.currency, card.brand, card.isDefault]
                    );
                });

                // Add demo transactions
                const today = new Date();
                const transactions = [
                    { title: 'Amazon Purchase', amount: -89.99, type: 'shopping', icon: 'shopping-bag', daysAgo: 0 },
                    { title: 'Starbucks Coffee', amount: -5.45, type: 'food', icon: 'coffee', daysAgo: 1 },
                    { title: 'Netflix Subscription', amount: -15.99, type: 'subscription', icon: 'tv', daysAgo: 2 },
                    { title: 'Uber Ride', amount: -24.50, type: 'transport', icon: 'car', daysAgo: 3 },
                    { title: 'Grocery Store', amount: -156.78, type: 'food', icon: 'shopping-cart', daysAgo: 4 },
                    { title: 'Payment Received', amount: 500.00, type: 'income', icon: 'dollar-sign', daysAgo: 5 },
                    { title: 'Restaurant Dinner', amount: -65.00, type: 'food', icon: 'utensils', daysAgo: 6 },
                    { title: 'Gas Station', amount: -45.00, type: 'transport', icon: 'fuel', daysAgo: 7 },
                    { title: 'Spotify Premium', amount: -9.99, type: 'subscription', icon: 'music', daysAgo: 8 },
                    { title: 'Online Shopping', amount: -120.00, type: 'shopping', icon: 'package', daysAgo: 10 }
                ];

                transactions.forEach(tx => {
                    const date = new Date(today);
                    date.setDate(date.getDate() - tx.daysAgo);
                    db.run(
                        "INSERT INTO transactions (user_id, card_id, title, date, amount, type, icon) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [userId, 'card_demo_1', tx.title, date.toISOString().split('T')[0], tx.amount, tx.type, tx.icon]
                    );
                });

                // Add demo recurring transactions
                const recurring = [
                    { title: 'Netflix', amount: 15.99, type: 'subscription', frequency: 'monthly', icon: 'tv' },
                    { title: 'Gym Membership', amount: 49.99, type: 'subscription', frequency: 'monthly', icon: 'dumbbell' },
                    { title: 'Salary', amount: 5000.00, type: 'income', frequency: 'monthly', icon: 'briefcase' }
                ];

                recurring.forEach(rec => {
                    const nextDue = new Date(today);
                    nextDue.setDate(nextDue.getDate() + 15);
                    db.run(
                        "INSERT INTO recurring_transactions (user_id, title, amount, type, frequency, next_due_date, icon) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [userId, rec.title, rec.amount, rec.type, rec.frequency, nextDue.toISOString().split('T')[0], rec.icon]
                    );
                });

                // Add demo budget goals
                const budgets = [
                    { category: 'food', amount_limit: 500 },
                    { category: 'shopping', amount_limit: 300 },
                    { category: 'transport', amount_limit: 200 },
                    { category: 'subscription', amount_limit: 100 }
                ];

                budgets.forEach(budget => {
                    db.run(
                        "INSERT INTO budget_goals (user_id, category, amount_limit) VALUES (?, ?, ?)",
                        [userId, budget.category, budget.amount_limit]
                    );
                });

                console.log('✅ Demo data created successfully!');
                console.log('📧 Login with: demo@example.com / demo123');
            }
        );
    });
}

module.exports = db;

