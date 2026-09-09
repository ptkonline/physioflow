import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;
const PBKDF2_PREFIX = "pbkdf2";

function fromB64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function isBcryptHash(value?: string) {
  return Boolean(value && /^\$2[aby]\$\d{2}\$/.test(value));
}

export function isPbkdf2Hash(value?: string) {
  return Boolean(value?.startsWith(`${PBKDF2_PREFIX}$`));
}

/** True when the value is a known stored hash (bcrypt or legacy PBKDF2). */
export function isPasswordHashed(value?: string) {
  return isBcryptHash(value) || isPbkdf2Hash(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Sync helper for seed/module init only. Prefer `hashPassword` elsewhere. */
export function hashPasswordSync(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

async function verifyPbkdf2(plain: string, stored: string) {
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

/**
 * Compare plaintext to a stored credential.
 * Supports bcrypt, legacy PBKDF2 (`pbkdf2$…`), and one-shot plaintext equality during migration.
 */
export async function comparePassword(plain: string, stored?: string): Promise<boolean> {
  if (!stored) return false;
  if (isBcryptHash(stored)) return bcrypt.compare(plain, stored);
  if (isPbkdf2Hash(stored)) return verifyPbkdf2(plain, stored);
  return stored === plain;
}

/** @deprecated Prefer `comparePassword`. Kept for call-site compatibility. */
export const verifyPassword = comparePassword;

export function stripUserSecrets<T extends { password?: string; passwordHash?: string }>(user: T): T {
  const hash =
    (user.passwordHash && isPasswordHashed(user.passwordHash) ? user.passwordHash : undefined) ||
    (user.password && isPasswordHashed(user.password) ? user.password : undefined);
  return {
    ...user,
    password: "",
    // Keep bcrypt (or legacy PBKDF2 during transition); never persist plaintext.
    passwordHash: hash || "",
  };
}

/** True when the user still has a usable local credential (hash or legacy plaintext). */
export function hasLocalCredential(user: { password?: string; passwordHash?: string }) {
  return Boolean(
    (user.passwordHash && isPasswordHashed(user.passwordHash)) ||
      (user.password && user.password.length > 0),
  );
}

/** Whether stored credential should be rewritten to a fresh bcrypt hash after a successful login. */
export function needsBcryptUpgrade(user: { password?: string; passwordHash?: string }) {
  const primary = user.passwordHash || user.password || "";
  if (!primary) return false;
  if (isBcryptHash(user.passwordHash)) return false;
  // Plaintext, PBKDF2, or hash parked in `password` field → upgrade to bcrypt in passwordHash.
  return true;
}
