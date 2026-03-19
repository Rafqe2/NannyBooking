import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In sandbox mode all emails are redirected to the verified test address.
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const SANDBOX_TO = process.env.RESEND_SANDBOX_TO ?? null;

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const recipient = SANDBOX_TO ?? to;
  const { error } = await resend.emails.send({ from: FROM, to: recipient, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
