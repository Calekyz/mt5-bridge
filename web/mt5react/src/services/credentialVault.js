/**
 * credentialVault.js
 * AES-256-GCM encryption for MT5 + SSH passwords.
 *
 * Requires VAULT_MASTER_KEY in .env (64 hex chars = 32 bytes).
 * Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('crypto');

const KEY_HEX = process.env.VAULT_MASTER_KEY;
if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error(
        'VAULT_MASTER_KEY missing or invalid. Must be 64 hex characters (32 bytes).\n' +
        'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
}

const KEY = Buffer.from(KEY_HEX, 'hex');
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * Encrypt a UTF-8 string.
 * @param {string} plaintext
 * @returns {string} base64(iv | tag | ciphertext)
 */
function encrypt(plaintext) {
    if (typeof plaintext !== 'string') {
        throw new TypeError('encrypt() requires a string');
    }
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
}

/**
 * Decrypt a value produced by encrypt().
 * @param {string} payload base64(iv | tag | ciphertext)
 * @returns {string}
 */
function decrypt(payload) {
    if (typeof payload !== 'string') {
        throw new TypeError('decrypt() requires a string');
    }
    const buf = Buffer.from(payload, 'base64');
    if (buf.length < IV_LEN + TAG_LEN) {
        throw new Error('Invalid encrypted payload');
    }
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

/**
 * Quick self-test. Run: node -e "require('./services/credentialVault').selfTest()"
 */
function selfTest() {
    const secret = 'hunter2-' + Date.now();
    const enc = encrypt(secret);
    const dec = decrypt(enc);
    console.log('Original :', secret);
    console.log('Encrypted:', enc.slice(0, 40) + '...');
    console.log('Decrypted:', dec);
    console.log(dec === secret ? '✅ Vault OK' : '❌ Vault FAILED');
    return dec === secret;
}

module.exports = { encrypt, decrypt, selfTest };
