/** Auth helpers — bcrypt hashing lives in password.ts; re-exported for a stable import path. */
export {
  comparePassword,
  comparePassword as verifyPassword,
  hashPassword,
  hashPasswordSync,
  hasLocalCredential,
  isBcryptHash,
  isPasswordHashed,
  needsBcryptUpgrade,
  stripUserSecrets,
} from "./password";
