const PREFIX = "pbkdf2";
const ITERATIONS = 100_000;
const KEY_BITS = 256;

function toB64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromB64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function isPasswordHashed(value?: string) {
  return Boolean(value?.startsWith(`${PREFIX}$`));
}

export async function hashPassword(plain: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(plain), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    KEY_BITS,
  );
  return `${PREFIX}$${ITERATIONS}$${toB64(salt)}$${toB64(new Uint8Array(bits))}`;
}

export async function verifyPassword(plain: string, stored?: string) {
  if (!stored) return false;
  if (!isPasswordHashed(stored)) {
    return stored === plain;
  }
  const [, iterRaw, saltB64, hashB64] = stored.split("$");
  const iterations = Number(iterRaw);
  const salt = fromB64(saltB64);
  const expected = fromB64(hashB64);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(plain), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    expected.length * 8,
  );
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actual.length; i += 1) mismatch |= actual[i] ^ expected[i];
  return mismatch === 0;
}

export function stripUserSecrets<T extends { password?: string; passwordHash?: string }>(user: T): T {
  return {
    ...user,
    password: "",
    passwordHash: user.passwordHash || (isPasswordHashed(user.password) ? user.password : user.passwordHash),
  };
}
