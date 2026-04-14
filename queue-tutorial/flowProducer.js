import { FlowProducer } from "bullmq";

const flowProducer = new FlowProducer({
  connection: redisConfig,
});

// Define the chain: parent + children
// Children only run after the parent completes
await flowProducer.add({
  name: "encode-video", // PARENT
  queueName: "video-processing",
  data: {
    videoId: "vid_abc123",
    s3Key: "uploads/vid_abc123.mp4",
  },
  children: [
    {
      name: "generate-thumbnails", // CHILD 1 — runs after parent
      queueName: "thumbnail",
      data: {
        videoId: "vid_abc123",
      },
      children: [
        {
          name: "process-thumbnails", // GRANDCHILD — runs after child 1
          queueName: "image-processing",
          data: {
            videoId: "vid_abc123",
          },
        },
      ],
    },
    {
      name: "generate-transcription", // CHILD 2 — runs in parallel with child 1
      queueName: "transcription",
      data: {
        videoId: "vid_abc123",
      },
    },
  ],
});