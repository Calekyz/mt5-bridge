import crypto from 'crypto';

const KEY_HEX = process.env.VAULT_MASTER_KEY;

if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error(
        'VAULT_MASTER_KEY missing or invalid. Must be 64 hex chars (32 bytes).\n' +
        'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
}

const KEY = Buffer.from(KEY_HEX, 'hex');
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

export function encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(payload: string): string {
    const buf = Buffer.from(payload, 'base64');
    if (buf.length < IV_LEN + TAG_LEN) throw new Error('Invalid encrypted payload');
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export function selfTest(): boolean {
    const secret = 'test-' + Date.now();
    const enc = encrypt(secret);
    const dec = decrypt(enc);
    const ok = dec === secret;
    console.log(dec === secret ? '✅ Vault OK' : '❌ Vault FAILED');
    return ok;
}
