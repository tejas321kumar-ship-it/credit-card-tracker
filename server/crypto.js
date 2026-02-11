const crypto = require('crypto');

// Use environment variable or generate a secure random key
// In production, set ENCRYPTION_KEY environment variable!
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'credit-card-tracker-secure-key-32!';
const key = crypto.scryptSync(secretKey, 'secure-salt-12345', 32); // 32 bytes for AES-256

const encrypt = (text) => {
    if (!text) return text;
    // Generate random IV for each encryption (more secure)
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Prepend IV to encrypted data (IV is not secret, just needs to be unique)
    return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (text) => {
    if (!text) return text;
    try {
        // Check if it's the new format with IV
        if (text.includes(':')) {
            const parts = text.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } else {
            // Legacy format (backward compatibility)
            const iv = Buffer.alloc(16, 0);
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(text, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
    } catch (e) {
        // Return original text if decryption fails
        return text;
    }
};

// Hash sensitive data that never needs to be retrieved (like CVV)
const hash = (text) => {
    if (!text) return text;
    return crypto.createHash('sha256').update(text).digest('hex');
};

// Mask card number for display (show only last 4 digits)
const maskCardNumber = (number) => {
    if (!number || number.length < 4) return '****';
    return '**** **** **** ' + number.slice(-4);
};

module.exports = { encrypt, decrypt, hash, maskCardNumber };

