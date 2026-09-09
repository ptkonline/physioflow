export async function sendPlainEmail(input: { to: string; subject: string; text: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL || "PhysioFlow <noreply@resend.dev>";
  if (!resendKey) {
    console.info("[mail]", input.subject, input.to, "\n", input.text);
    return { sent: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Email provider rejected the message.");
  }
  return { sent: true };
}
