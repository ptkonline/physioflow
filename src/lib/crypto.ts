function bytesToB64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function b64ToBytes(payload: string) {
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const KEY_NAME = "physioflow.device-key";

async function getKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem(KEY_NAME);
  const raw = existing ? b64ToBytes(existing) : crypto.getRandomValues(new Uint8Array(32));
  if (!existing) localStorage.setItem(KEY_NAME, bytesToB64(raw));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptJson(value: unknown): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const packed = new Uint8Array(iv.length + cipher.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(cipher), iv.length);
  return bytesToB64(packed);
}

export async function decryptJson<T>(payload: string): Promise<T> {
  const key = await getKey();
  const packed = b64ToBytes(payload);
  const iv = packed.slice(0, 12);
  const data = packed.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}
