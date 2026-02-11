const express = require('express');
const router = express.Router();
const db = require('./database');
const { encrypt, decrypt, hash, maskCardNumber } = require('./crypto');
const {
    sanitizeString,
    validateAmount,
    validateDate,
    validateCardExpiry,
    validateCardBrand,
    validateCurrency,
    validateTransactionType,
    validateFrequency,
    validatePaymentStatus,
    validateLastFour,
    validateId,
    validateBudgetCategory,
    validateBudgetPeriod
} = require('./validator');

// Get Card Details (for current user)
router.get('/card', (req, res) => {
    const userId = req.session.userId;
    const sql = "SELECT * FROM cards WHERE user_id = ? LIMIT 1";
    db.get(sql, [userId], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!row) {
            res.json({ holderName: 'New User', lastFour: '0000', expiry: '', balance: 0, currency: 'USD', brand: 'visa' });
            return;
        }
        const card = {
            id: row.id,
            holderName: row.holder_name,
            lastFour: row.number,
            expiry: row.expiry || '',
            balance: row.balance,
            currency: row.currency,
            brand: row.brand,
            isDefault: row.is_default === 1
        };
        res.json(card);
    });
});

// Get All Cards for user
router.get('/cards', (req, res) => {
    const userId = req.session.userId;
    const sql = "SELECT * FROM cards WHERE user_id = ? ORDER BY is_default DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const cards = (rows || []).map(row => ({
            id: row.id,
            holderName: row.holder_name,
            lastFour: row.number,
            expiry: row.expiry || '',
            balance: row.balance,
            currency: row.currency,
            brand: row.brand,
            isDefault: row.is_default === 1
        }));
        res.json(cards);
    });
});

// Add New Card
router.post('/cards', (req, res) => {
    const userId = req.session.userId;
    const { holderName, lastFour, expiry, balance, currency, brand } = req.body;
    const id = 'card_' + Date.now();

    // Validate all inputs
    const lastFourResult = validateLastFour(lastFour);
    if (!lastFourResult.valid) return res.status(400).json({ error: lastFourResult.error });

    const expiryResult = validateCardExpiry(expiry);
    if (!expiryResult.valid) return res.status(400).json({ error: expiryResult.error });

    const currencyResult = validateCurrency(currency);
    if (!currencyResult.valid) return res.status(400).json({ error: currencyResult.error });

    const brandResult = validateCardBrand(brand);
    if (!brandResult.valid) return res.status(400).json({ error: brandResult.error });

    const balanceResult = validateAmount(balance, { min: 0, max: 10000000, allowNegative: false });
    const safeBalance = balanceResult.valid ? balanceResult.value : 0;

    const safeName = sanitizeString(holderName, 100);
    if (!safeName) return res.status(400).json({ error: 'Cardholder name is required' });

    // Check if user has other cards, make this default if first
    db.get("SELECT COUNT(*) as count FROM cards WHERE user_id = ?", [userId], (err, row) => {
        const isDefault = row && row.count === 0 ? 1 : 0;

        const sql = `INSERT INTO cards 
            (id, user_id, holder_name, number, expiry, balance, currency, brand, is_default) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(sql, [
            id, userId, safeName, lastFourResult.value,
            expiryResult.value, safeBalance, currencyResult.value, brandResult.value,
            isDefault
        ], function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({ message: "Card added", id: id });
        });
    });
});


// Update Card Details
router.post('/card', (req, res) => {
    const userId = req.session.userId;
    const { id, holderName, lastFour, expiry, currency, brand } = req.body;

    // Validate ID
    const idResult = validateId(id || 'card_123');
    const cardId = idResult.valid ? idResult.value : 'card_123';

    // Validate all inputs
    const lastFourResult = validateLastFour(lastFour);
    if (!lastFourResult.valid) return res.status(400).json({ error: lastFourResult.error });

    const expiryResult = validateCardExpiry(expiry);
    if (!expiryResult.valid) return res.status(400).json({ error: expiryResult.error });

    const currencyResult = validateCurrency(currency);
    if (!currencyResult.valid) return res.status(400).json({ error: currencyResult.error });

    const brandResult = validateCardBrand(brand);
    if (!brandResult.valid) return res.status(400).json({ error: brandResult.error });

    const safeName = sanitizeString(holderName, 100);
    if (!safeName) return res.status(400).json({ error: 'Cardholder name is required' });

    const sql = `UPDATE cards SET 
        holder_name = ?, number = ?, expiry = ?, currency = ?, brand = ?
        WHERE id = ? AND user_id = ?`;

    db.run(sql, [
        safeName, lastFourResult.value, expiryResult.value, currencyResult.value, brandResult.value,
        cardId, userId
    ], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ message: "Card updated", changes: this.changes });
    });
});

// Delete Card
router.delete('/cards/:id', (req, res) => {
    const userId = req.session.userId;

    // Validate ID
    const idResult = validateId(req.params.id);
    if (!idResult.valid) return res.status(400).json({ error: idResult.error });

    const sql = "DELETE FROM cards WHERE id = ? AND user_id = ?";
    db.run(sql, [idResult.value, userId], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ message: "Card deleted", changes: this.changes });
    });
});

// Set Default Card
router.post('/cards/default', (req, res) => {
    const userId = req.session.userId;
    const { cardId } = req.body;

    // Validate ID
    const idResult = validateId(cardId);
    if (!idResult.valid) return res.status(400).json({ error: idResult.error });

    // First, unset all cards as default for this user
    db.run("UPDATE cards SET is_default = 0 WHERE user_id = ?", [userId], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        // Then set the selected card as default
        db.run("UPDATE cards SET is_default = 1 WHERE id = ? AND user_id = ?", [idResult.value, userId], function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({ message: "Default card updated", cardId: idResult.value });
        });
    });
});

// Get Transactions for user
router.get('/transactions', (req, res) => {
    const userId = req.session.userId;
    const sql = "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows || []);
    });
});

// Add Transaction
router.post('/transactions', (req, res) => {
    const userId = req.session.userId;
    const { title, date, amount, type, icon, cardId } = req.body;

    // Validate title
    const safeTitle = sanitizeString(title, 200);
    if (!safeTitle) return res.status(400).json({ error: 'Transaction title is required' });

    // Validate amount
    const amountResult = validateAmount(amount);
    if (!amountResult.valid) return res.status(400).json({ error: amountResult.error });

    // Validate date
    const dateResult = validateDate(date);
    if (!dateResult.valid) return res.status(400).json({ error: dateResult.error });

    // Validate type
    const typeResult = validateTransactionType(type);
    if (!typeResult.valid) return res.status(400).json({ error: typeResult.error });

    // Sanitize icon
    const safeIcon = sanitizeString(icon, 50) || 'circle';

    // Validate cardId if provided
    let safeCardId = null;
    if (cardId) {
        const cardIdResult = validateId(cardId);
        if (!cardIdResult.valid) return res.status(400).json({ error: 'Invalid card ID' });
        safeCardId = cardIdResult.value;
    }

    const sql = "INSERT INTO transactions (user_id, card_id, title, date, amount, type, icon) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.run(sql, [userId, safeCardId, safeTitle, dateResult.value, amountResult.value, typeResult.value, safeIcon], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        // Update card balance
        if (safeCardId) {
            const balanceSql = "UPDATE cards SET balance = balance + ? WHERE id = ? AND user_id = ?";
            db.run(balanceSql, [amountResult.value, safeCardId, userId], (err) => {
                if (err) console.error("Failed to update balance", err);
            });
        }

        res.json({ message: "Transaction added", id: this.lastID, title: safeTitle, date: dateResult.value, amount: amountResult.value, type: typeResult.value, icon: safeIcon });
    });
});

// Get Payment History for user
router.get('/payments', (req, res) => {
    const userId = req.session.userId;
    const sql = "SELECT * FROM payments WHERE user_id = ? ORDER BY date DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json(rows || []);
    });
});

// Add Payment
router.post('/payments', (req, res) => {
    const userId = req.session.userId;
    const { cardId, amount, recipient, date, status } = req.body;
    const reference = 'PAY-' + Date.now().toString(36).toUpperCase();

    // Validate amount
    const amountResult = validateAmount(amount, { min: 0.01, max: 1000000, allowNegative: false });
    if (!amountResult.valid) return res.status(400).json({ error: amountResult.error });

    // Sanitize recipient
    const safeRecipient = sanitizeString(recipient, 200);
    if (!safeRecipient) return res.status(400).json({ error: 'Recipient is required' });

    // Validate date
    const dateResult = validateDate(date);
    if (!dateResult.valid) return res.status(400).json({ error: dateResult.error });

    // Validate status
    const statusResult = validatePaymentStatus(status);
    if (!statusResult.valid) return res.status(400).json({ error: statusResult.error });

    // Validate cardId
    let safeCardId = null;
    if (cardId) {
        const cardIdResult = validateId(cardId);
        if (!cardIdResult.valid) return res.status(400).json({ error: 'Invalid card ID' });
        safeCardId = cardIdResult.value;
    }

    const sql = "INSERT INTO payments (user_id, card_id, amount, recipient, date, status, reference) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.run(sql, [userId, safeCardId, amountResult.value, safeRecipient, dateResult.value, statusResult.value, reference], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ message: "Payment recorded", id: this.lastID, reference });
    });
});

// Send Money / Transfer
router.post('/transfer', (req, res) => {
    const userId = req.session.userId;
    const { cardId, recipientName, recipientContact, amount, note } = req.body;

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (!transferAmount || transferAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a valid amount' });
    }
    if (transferAmount > 50000) {
        return res.status(400).json({ error: 'Transfer amount cannot exceed $50,000' });
    }

    // Sanitize inputs
    const safeName = sanitizeString(recipientName, 200);
    if (!safeName) return res.status(400).json({ error: 'Recipient name is required' });
    const safeContact = sanitizeString(recipientContact, 200);
    const safeNote = sanitizeString(note, 500);

    // Validate cardId
    const cardIdResult = validateId(cardId);
    if (!cardIdResult.valid) return res.status(400).json({ error: 'Invalid card ID' });

    // Check if card exists and has sufficient balance
    db.get("SELECT * FROM cards WHERE id = ? AND user_id = ?", [cardIdResult.value, userId], (err, card) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        if (card.balance < transferAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const reference = 'TRF-' + Date.now().toString(36).toUpperCase();
        const today = new Date().toISOString().split('T')[0];
        const transactionTitle = `Transfer to ${safeName}` + (safeNote ? ` - ${safeNote}` : '');

        // Deduct from card balance
        db.run("UPDATE cards SET balance = balance - ? WHERE id = ? AND user_id = ?",
            [transferAmount, cardIdResult.value, userId], function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update balance' });
                }

                // Record as payment
                db.run(
                    "INSERT INTO payments (user_id, card_id, amount, recipient, date, status, reference) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [userId, cardIdResult.value, transferAmount, safeName, today, 'completed', reference],
                    function (err) {
                        if (err) console.error('Failed to record payment:', err);
                    }
                );

                // Record as transaction
                db.run(
                    "INSERT INTO transactions (user_id, card_id, title, date, amount, type, icon) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [userId, cardIdResult.value, transactionTitle, today, -transferAmount, 'transfer', 'send'],
                    function (err) {
                        if (err) {
                            console.error('Failed to record transaction:', err);
                        }
                    }
                );

                res.json({
                    message: 'Transfer successful!',
                    reference,
                    amount: transferAmount,
                    recipient: safeName,
                    newBalance: (card.balance - transferAmount).toFixed(2)
                });
            }
        );
    });
});


// Get Analytics
router.get('/analytics', (req, res) => {
    const userId = req.session.userId;

    // Get all transactions for analytics
    const sql = "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC";
    db.all(sql, [userId], (err, transactions) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Calculate today's spending
        const todaySpending = (transactions || [])
            .filter(t => t.date === today && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Calculate this week's spending
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekSpending = (transactions || [])
            .filter(t => {
                const date = new Date(t.date);
                return date >= weekAgo && date <= now && t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Calculate this month's spending
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthSpending = (transactions || [])
            .filter(t => {
                const date = new Date(t.date);
                return date >= monthStart && t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Calculate last month's spending for comparison
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthSpending = (transactions || [])
            .filter(t => {
                const date = new Date(t.date);
                return date >= lastMonthStart && date <= lastMonthEnd && t.amount < 0;
            })
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Category breakdown
        const categories = {};
        (transactions || []).filter(t => t.amount < 0).forEach(t => {
            const cat = t.type || 'other';
            categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
        });

        // Daily trend for the last 7 days
        const dailyTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const total = (transactions || [])
                .filter(t => t.date === dateStr && t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            dailyTrend.push({
                date: dateStr,
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                amount: total
            });
        }

        // Find biggest expense
        const expenses = (transactions || []).filter(t => t.amount < 0);
        const biggestExpense = expenses.length > 0
            ? expenses.reduce((max, t) => Math.abs(t.amount) > Math.abs(max.amount) ? t : max)
            : null;

        res.json({
            todaySpending,
            weekSpending,
            monthSpending,
            lastMonthSpending,
            monthChange: lastMonthSpending > 0
                ? ((monthSpending - lastMonthSpending) / lastMonthSpending * 100).toFixed(1)
                : 0,
            categories,
            dailyTrend,
            biggestExpense: biggestExpense ? {
                title: biggestExpense.title,
                amount: Math.abs(biggestExpense.amount),
                date: biggestExpense.date
            } : null,
            totalTransactions: (transactions || []).length
        });
    });
});

// ===== RECURRING TRANSACTIONS =====
router.get('/recurring', (req, res) => {
    const userId = req.session.userId;
    const sql = "SELECT * FROM recurring_transactions WHERE user_id = ?";
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows || []);
    });
});

router.post('/recurring', (req, res) => {
    const userId = req.session.userId;
    const { title, amount, type, frequency, next_due_date, icon } = req.body;

    // Validate title
    const safeTitle = sanitizeString(title, 200);
    if (!safeTitle) return res.status(400).json({ error: 'Title is required' });

    // Validate amount
    const amountResult = validateAmount(amount);
    if (!amountResult.valid) return res.status(400).json({ error: amountResult.error });

    // Validate type
    const typeResult = validateTransactionType(type);
    if (!typeResult.valid) return res.status(400).json({ error: typeResult.error });

    // Validate frequency
    const freqResult = validateFrequency(frequency);
    if (!freqResult.valid) return res.status(400).json({ error: freqResult.error });

    // Validate next due date
    const dateResult = validateDate(next_due_date);
    if (!dateResult.valid) return res.status(400).json({ error: dateResult.error });

    // Sanitize icon
    const safeIcon = sanitizeString(icon, 50) || 'circle';

    const sql = `INSERT INTO recurring_transactions 
        (user_id, title, amount, type, frequency, next_due_date, icon) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [userId, safeTitle, amountResult.value, typeResult.value, freqResult.value, dateResult.value, safeIcon], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, message: "Recurring transaction added" });
    });
});

router.delete('/recurring/:id', (req, res) => {
    const userId = req.session.userId;

    // Validate ID
    const idResult = validateId(req.params.id);
    if (!idResult.valid) return res.status(400).json({ error: idResult.error });

    const sql = "DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?";
    db.run(sql, [idResult.value, userId], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Recurring transaction deleted", changes: this.changes });
    });
});

// ===== BUDGET GOALS =====
router.get('/budgets', (req, res) => {
    const userId = req.session.userId;
    const sql = "SELECT * FROM budget_goals WHERE user_id = ?";
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows || []);
    });
});

router.post('/budgets', (req, res) => {
    const userId = req.session.userId;
    const { category, amount_limit, period } = req.body;

    // Validate category
    const catResult = validateBudgetCategory(category);
    if (!catResult.valid) return res.status(400).json({ error: catResult.error });

    // Validate amount limit
    const amountResult = validateAmount(amount_limit, { min: 1, max: 10000000, allowNegative: false });
    if (!amountResult.valid) return res.status(400).json({ error: amountResult.error });

    // Validate period
    const periodResult = validateBudgetPeriod(period);
    if (!periodResult.valid) return res.status(400).json({ error: periodResult.error });

    // Upsert budget goal
    const sql = `INSERT INTO budget_goals (user_id, category, amount_limit, period) 
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(user_id, category) 
                 DO UPDATE SET amount_limit = excluded.amount_limit`;

    db.run(sql, [userId, catResult.value, amountResult.value, periodResult.value], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Budget goal set" });
    });
});

module.exports = router;
