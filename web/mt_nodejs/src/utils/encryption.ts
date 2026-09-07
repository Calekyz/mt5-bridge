import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-change-this';

export function encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(text: string): string {
    const bytes = CryptoJS.AES.decrypt(text, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}
