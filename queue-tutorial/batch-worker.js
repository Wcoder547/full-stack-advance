//
// ─── Handler: DELETE_ACCOUNT task spawns sub-tasks ─────────────────
//

deleteAccountWorker.process("delete-account", async (job) => {
  const { userId } = job.data;

  // Get all resources this user owns
  const [projects, assets] = await Promise.all([
    db.query("SELECT id FROM projects WHERE owner_id = $1", [userId]),
    db.query("SELECT s3_key FROM user_assets WHERE user_id = $1", [userId]),
  ]);

  // Spawn sub-tasks in BULK (efficient — single Redis command)
  await deletionQueue.addBulk([
    ...projects.rows.map((p) => ({
      name: "delete-project",
      data: {
        projectId: p.id,
        userId,
      },
    })),

    ...assets.rows.map((a) => ({
      name: "delete-s3-asset",
      data: {
        s3Key: a.s3_key,
      },
    })),

    {
      name: "delete-user-profile",
      data: {
        userId,
      },
    },

    {
      name: "send-goodbye-email",
      data: {
        userId,
      },
    },
  ]);

  // All sub-tasks run in parallel, each independently retriable
});

//
// ─── Weekly Reports — Batch Enqueue ──────────────────────────────
//

reportCronWorker.process("weekly-reports-trigger", async () => {
  const users = await db.query(
    "SELECT id, email FROM users WHERE weekly_report_enabled = true"
  );

  // Enqueue ALL user report tasks at once — bulk is much faster than loop
  await reportQueue.addBulk(
    users.rows.map((user) => ({
      name: "generate-user-report",
      data: {
        userId: user.id,
        email: user.email,
      },
      opts: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 60000,
        },
      },
    }))
  );

  // 50,000 tasks enqueued → workers process in parallel → all done in minutes
});