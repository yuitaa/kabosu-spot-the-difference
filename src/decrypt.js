const PASSPHRASE = 'kabosu-server-ha-6-shuunenn';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

async function getKey() {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(PASSPHRASE));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['decrypt']);
}

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function decryptImage(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const iv = bytes.slice(0, IV_LENGTH);
  const tag = bytes.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = bytes.slice(IV_LENGTH + TAG_LENGTH);

  const concat = new Uint8Array(data.length + tag.length);
  concat.set(data, 0);
  concat.set(tag, data.length);

  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, concat);
  return `data:image/png;base64,${bytesToBase64(new Uint8Array(decrypted))}`;
}
