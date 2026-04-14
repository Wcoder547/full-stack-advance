//
// ─── Email sending function (calls Resend API) ────────────────────
//

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(data) {
  const { userId, email, code, jobId } = data;

  // Idempotency: check if this specific email was already sent
  const alreadySent = await redis.get(`email_sent:${jobId}`);

  if (alreadySent) {
    console.log("Skipping duplicate email", jobId);
    return;
  }

  // Send email via Resend API
  const { error } = await resend.emails.send({
    from: "YourApp <noreply@yourapp.com>",
    to: email,
    subject: "Verify your email address",
    html: renderVerificationTemplate({ code }),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  // Mark as sent — prevents duplicate sends on retry
  await redis.set(
    `email_sent:${jobId}`,
    "1",
    "EX",
    86400 // 24 hours TTL
  );

  // Log to DB for audit trail
  await db.query(
    `
    INSERT INTO email_logs (user_id, email_type, sent_at, job_id)
    VALUES ($1, 'verification', NOW(), $2)
    ON CONFLICT (job_id) DO NOTHING
    `,
    [userId, jobId]
  );
}