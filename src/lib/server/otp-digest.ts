const encoder = new TextEncoder();

export async function digestOtp(email: string, code: string) {
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(`${email}:${code}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
