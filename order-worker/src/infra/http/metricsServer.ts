import Fastify from "fastify";
import { register } from "../observability/metrics.js";
import { logger } from "../observability/logger.js";

export async function startMetricsServer() {
  const app = Fastify({
    loggerInstance: logger,
  });

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "order-worker",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/metrics", async (_request, reply) => {
    reply.header("Content-Type", register.contentType);
    return register.metrics();
  });

  await app.listen({
    port: 3001,
    host: "0.0.0.0",
  });

  logger.info({ port: 3001 }, "Worker metrics server started");
}
