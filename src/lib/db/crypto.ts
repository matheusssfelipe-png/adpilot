/**
 * Simple AES-256-CBC encryption/decryption for storing tokens in the database.
 * Uses Web Crypto API (available in Node.js 18+ and Edge Runtime).
 */

const ALGORITHM = 'AES-CBC';
const KEY_LENGTH = 256;

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for token encryption');
  }
  return key;
}

// Derive a CryptoKey from the string key
async function deriveKey(keyString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString).slice(0, 32), // Use first 32 bytes (256 bits)
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
  return keyMaterial;
}

/**
 * Encrypt a plaintext string. Returns "iv:ciphertext" as hex.
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  
  const key = await deriveKey(getEncryptionKey());
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const ctHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${ivHex}:${ctHex}`;
}

/**
 * Decrypt an "iv:ciphertext" hex string back to plaintext.
 */
export async function decrypt(encryptedStr: string): Promise<string> {
  if (!encryptedStr || !encryptedStr.includes(':')) return '';
  
  const [ivHex, ctHex] = encryptedStr.split(':');
  const key = await deriveKey(getEncryptionKey());

  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const ciphertext = new Uint8Array(ctHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
