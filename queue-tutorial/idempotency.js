//
// ─── PROBLEM: Non-Idempotent Email Task ───────────────────────────
//

// If this task retries, the user gets TWO emails. Bad.
emailWorker.process(async (job) => {
  await sendEmail(job.data); // ← retries = duplicate emails ❌
});

//
// ─── SOLUTION 1: Idempotency Key ─────────────────────────────────
//

// Before sending, check if we already sent this specific email
emailWorker.process(async (job) => {
  const idempotencyKey = `email_sent:${job.id}`;

  // Check if already sent (Redis SET NX = atomic "set if not exists")
  const alreadySent = await redis.set(
    idempotencyKey,
    "1",
    "NX",
    "EX",
    86400 // 24 hours TTL
  );

  if (!alreadySent) {
    console.log("Email already sent, skipping duplicate");
    return; // ACK without doing anything — safe to skip
  }

  await sendEmail(job.data); // Only runs if key was NOT already set
});

//
// ─── SOLUTION 2: Database Status Check ────────────────────────────
//

// Track in DB whether the operation already happened
accountDeletionWorker.process("delete-project", async (job) => {
  const { projectId, userId } = job.data;

  // Check if project is already deleted (idempotency check)
  const project = await db.query(
    "SELECT id, deleted_at FROM projects WHERE id = $1",
    [projectId]
  );

  if (!project.rows[0] || project.rows[0].deleted_at) {
    return; // Already deleted — safe to return without error
  }

  // Use a DB TRANSACTION — all-or-nothing
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "DELETE FROM project_members WHERE project_id = $1",
      [projectId]
    );

    await client.query(
      "DELETE FROM tasks WHERE project_id = $1",
      [projectId]
    );

    await client.query(
      "DELETE FROM projects WHERE id = $1",
      [projectId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err; // Re-throw → triggers retry from scratch
  } finally {
    client.release();
  }
});

//
// ─── SOLUTION 3: Upsert instead of Insert ─────────────────────────
//

// If your task creates a record, use INSERT ... ON CONFLICT DO NOTHING
await db.query(
  `
  INSERT INTO email_logs (job_id, user_id, email_type, sent_at)
  VALUES ($1, $2, $3, NOW())
  ON CONFLICT (job_id) DO NOTHING
  `,
  [job.id, userId, emailType]
);

// If this runs twice (retry), the second insert is silently ignored