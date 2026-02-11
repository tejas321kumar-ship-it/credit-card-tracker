/**
 * Centralized Input Validation & Sanitization Module
 * Provides reusable validators for all API routes
 */

// ===== SANITIZATION =====

/**
 * Sanitize a string: trim whitespace, strip HTML tags, enforce max length
 */
function sanitizeString(str, maxLen = 255) {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/<[^>]*>/g, '')           // Strip HTML tags
        .replace(/[<>]/g, '')              // Remove remaining angle brackets
        .replace(/javascript:/gi, '')       // Remove JS protocol
        .replace(/on\w+\s*=/gi, '')         // Remove event handlers
        .substring(0, maxLen);
}

/**
 * Sanitize and validate an email address
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }
    const sanitized = email.trim().toLowerCase().substring(0, 254);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
        return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true, value: sanitized };
}

/**
 * Validate a monetary amount
 */
function validateAmount(amount, { min = -1000000, max = 1000000, allowNegative = true } = {}) {
    const num = parseFloat(amount);
    if (isNaN(num)) {
        return { valid: false, error: 'Amount must be a valid number' };
    }
    if (!allowNegative && num < 0) {
        return { valid: false, error: 'Amount cannot be negative' };
    }
    if (num < min || num > max) {
        return { valid: false, error: `Amount must be between ${min} and ${max}` };
    }
    // Max 2 decimal places
    const rounded = Math.round(num * 100) / 100;
    return { valid: true, value: rounded };
}

/**
 * Validate a date string (YYYY-MM-DD format)
 */
function validateDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        return { valid: false, error: 'Date is required' };
    }
    const trimmed = dateStr.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(trimmed)) {
        return { valid: false, error: 'Date must be in YYYY-MM-DD format' };
    }
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
        return { valid: false, error: 'Invalid date' };
    }
    return { valid: true, value: trimmed };
}

/**
 * Validate card expiry (MM/YY format)
 */
function validateCardExpiry(expiry) {
    if (!expiry || typeof expiry !== 'string') {
        return { valid: true, value: '' }; // Optional field
    }
    const trimmed = expiry.trim();
    if (trimmed === '') return { valid: true, value: '' };

    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(trimmed)) {
        return { valid: false, error: 'Expiry must be in MM/YY format' };
    }
    return { valid: true, value: trimmed };
}

/**
 * Validate card brand against whitelist
 */
const ALLOWED_BRANDS = ['visa', 'mastercard', 'amex', 'discover', 'rupay', 'jcb', 'diners', 'unionpay'];

function validateCardBrand(brand) {
    if (!brand || typeof brand !== 'string') {
        return { valid: true, value: 'visa' }; // Default
    }
    const lower = brand.trim().toLowerCase();
    if (!ALLOWED_BRANDS.includes(lower)) {
        return { valid: false, error: `Card brand must be one of: ${ALLOWED_BRANDS.join(', ')}` };
    }
    return { valid: true, value: lower };
}

/**
 * Validate currency against whitelist
 */
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'SGD'];

function validateCurrency(currency) {
    if (!currency || typeof currency !== 'string') {
        return { valid: true, value: 'USD' }; // Default
    }
    const upper = currency.trim().toUpperCase();
    if (!ALLOWED_CURRENCIES.includes(upper)) {
        return { valid: false, error: `Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}` };
    }
    return { valid: true, value: upper };
}

/**
 * Validate transaction type against whitelist
 */
const ALLOWED_TRANSACTION_TYPES = [
    'grocery', 'food', 'transport', 'entertainment', 'shopping',
    'bills', 'health', 'education', 'travel', 'subscription',
    'salary', 'freelance', 'investment', 'transfer', 'other'
];

function validateTransactionType(type) {
    if (!type || typeof type !== 'string') {
        return { valid: true, value: 'other' }; // Default
    }
    const lower = type.trim().toLowerCase();
    if (!ALLOWED_TRANSACTION_TYPES.includes(lower)) {
        return { valid: false, error: `Transaction type must be one of: ${ALLOWED_TRANSACTION_TYPES.join(', ')}` };
    }
    return { valid: true, value: lower };
}

/**
 * Validate recurring frequency type
 */
const ALLOWED_FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

function validateFrequency(freq) {
    if (!freq || typeof freq !== 'string') {
        return { valid: true, value: 'monthly' };
    }
    const lower = freq.trim().toLowerCase();
    if (!ALLOWED_FREQUENCIES.includes(lower)) {
        return { valid: false, error: `Frequency must be one of: ${ALLOWED_FREQUENCIES.join(', ')}` };
    }
    return { valid: true, value: lower };
}

/**
 * Validate payment status
 */
const ALLOWED_STATUSES = ['pending', 'completed', 'failed', 'cancelled'];

function validatePaymentStatus(status) {
    if (!status || typeof status !== 'string') {
        return { valid: true, value: 'pending' };
    }
    const lower = status.trim().toLowerCase();
    if (!ALLOWED_STATUSES.includes(lower)) {
        return { valid: false, error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` };
    }
    return { valid: true, value: lower };
}

/**
 * Validate last 4 digits of card
 */
function validateLastFour(lastFour) {
    if (!lastFour || typeof lastFour !== 'string') {
        return { valid: false, error: 'Last 4 digits are required' };
    }
    if (!/^\d{4}$/.test(lastFour.trim())) {
        return { valid: false, error: 'Please enter valid last 4 digits (numbers only)' };
    }
    return { valid: true, value: lastFour.trim() };
}

/**
 * Validate a route parameter ID (alphanumeric + underscore)
 */
function validateId(id) {
    if (!id || typeof id !== 'string') {
        return { valid: false, error: 'ID is required' };
    }
    // Allow card_123, numeric IDs, etc.
    if (!/^[a-zA-Z0-9_\-]+$/.test(id)) {
        return { valid: false, error: 'Invalid ID format' };
    }
    if (id.length > 100) {
        return { valid: false, error: 'ID too long' };
    }
    return { valid: true, value: id };
}

/**
 * Validate budget category
 */
function validateBudgetCategory(category) {
    if (!category || typeof category !== 'string') {
        return { valid: false, error: 'Category is required' };
    }
    const sanitized = sanitizeString(category, 50);
    if (sanitized.length < 1) {
        return { valid: false, error: 'Category cannot be empty' };
    }
    return { valid: true, value: sanitized };
}

/**
 * Validate budget period
 */
const ALLOWED_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

function validateBudgetPeriod(period) {
    if (!period || typeof period !== 'string') {
        return { valid: true, value: 'monthly' };
    }
    const lower = period.trim().toLowerCase();
    if (!ALLOWED_PERIODS.includes(lower)) {
        return { valid: false, error: `Period must be one of: ${ALLOWED_PERIODS.join(', ')}` };
    }
    return { valid: true, value: lower };
}

module.exports = {
    sanitizeString,
    validateEmail,
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
    validateBudgetPeriod,
    ALLOWED_BRANDS,
    ALLOWED_CURRENCIES,
    ALLOWED_TRANSACTION_TYPES,
    ALLOWED_FREQUENCIES,
    ALLOWED_STATUSES,
    ALLOWED_PERIODS
};
