//
// ─── Job Options with Retry Configuration ────────────────────────
//

await emailQueue.add("send-verification", taskData, {
  attempts: 5, // max 5 total attempts (1 original + 4 retries)

  backoff: {
    type: "exponential", // delay doubles on each failure
    delay: 60000, // start with 60 seconds (1 min)
  },

  // Retry schedule:
  // Attempt 1: immediate
  // Retry 1: 60s (1 min)
  // Retry 2: 120s (2 min)
  // Retry 3: 240s (4 min)
  // Retry 4: 480s (8 min)
  // After 5th failure → moves to Dead Letter Queue

  removeOnComplete: {
    count: 1000, // keep last 1000 completed jobs for inspection
  },

  removeOnFail: {
    count: 5000, // keep last 5000 failed jobs in DLQ
  },
});

//
// ─── Different configs for different task types ───────────────────
//

const JOB_OPTIONS = {
  // Email: up to 5 retries, exponential starting 1 min
  email: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 60_000,
    },
  },

  // Image processing: 3 retries, linear 30s backoff
  imageProcess: {
    attempts: 3,
    backoff: {
      type: "fixed",
      delay: 30_000,
    },
  },

  // Payment: up to 3 retries over 24 hours
  payment: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3_600_000, // 1h → 2h → 4h
    },
  },

  // Non-critical notification: 2 retries, fail fast
  notification: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 5_000,
    },
  },
};

//
// ─── Access retry info inside the handler ─────────────────────────
//

emailWorker.process(async (job) => {
  console.log(
    `Attempt ${job.attemptsMade + 1} of ${job.opts.attempts}`
  );

  try {
    await sendEmail(job.data);
  } catch (err) {
    // Log every failure with context
    console.error({
      jobId: job.id,
      attempt: job.attemptsMade + 1,
      error: err.message,
      data: job.data,
    });

    throw err; // Re-throw to trigger retry mechanism
  }
});