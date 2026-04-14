//
// ─── BullBoard: Real-time queue dashboard ─────────────────────────
//

// npm install @bull-board/express @bull-board/api

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(mediaQueue),
    new BullMQAdapter(notifQueue),
    new BullMQAdapter(reportQueue),
  ],
  serverAdapter,
});

// Protect dashboard with auth middleware
app.use(
  "/admin/queues",
  adminAuthMiddleware,
  serverAdapter.getRouter()
);

// Visit /admin/queues → see queues, jobs, retry manually, clear queues

//
// ─── Custom Metrics ───────────────────────────────────────────────
//

// Track key metrics and expose to Prometheus/Grafana
async function collectQueueMetrics() {
  for (const [name, queue] of Object.entries(queues)) {
    const counts = await queue.getJobCounts();

    // Emit to your metrics system
    metrics.gauge("queue.waiting", counts.waiting, { queue: name });
    metrics.gauge("queue.active", counts.active, { queue: name });
    metrics.gauge("queue.completed", counts.completed, { queue: name });
    metrics.gauge("queue.failed", counts.failed, { queue: name });

    // Alert: queue depth too high → workers need scaling
    if (counts.waiting > 1000) {
      await alert(
        `Queue '${name}' depth: ${counts.waiting} — consider scaling workers`
      );
    }

    // Alert: too many failures → investigate immediately
    if (counts.failed > 100) {
      await alert(
        `Queue '${name}' has ${counts.failed} failed jobs — check DLQ`
      );
    }
  }
}

// Run metrics collection every 30 seconds
setInterval(collectQueueMetrics, 30_000);

//
// ─── Worker health monitoring ─────────────────────────────────────
//

emailWorker.on("error", (err) => {
  console.error("Worker error:", err);
  metrics.increment("worker.error", { queue: "email" });
});

emailWorker.on("stalled", (jobId) => {
  console.warn(`Job ${jobId} stalled — worker may have crashed`);
  metrics.increment("worker.stalled", { queue: "email" });
});