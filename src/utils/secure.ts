import CryptoJS from 'crypto-js';

// PHASE Z3: Lightweight AES encryption for sensitive session fields
// No hardcoded secrets: key derived at runtime from uid + clinicId + public salt
export function deriveKey(uid: string, clinicId: string, salt: string) {
  return CryptoJS.SHA256(`${uid}:${clinicId}:${salt}`).toString();
}

export function encryptText(plain: string, key: string) {
  if (!plain) return plain;
  return CryptoJS.AES.encrypt(plain, key).toString();
}

export function decryptText(cipher: string, key: string) {
  if (!cipher) return cipher;
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return ''; // Mask on failure
  }
}

// Mask sensitive output in logs/errors
export function mask(text: string, visible = 4) {
  if (!text) return '';
  const head = text.slice(0, visible);
  return `${head}••••`;
}
