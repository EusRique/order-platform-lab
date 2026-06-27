import Fastify from "fastify";
import { logger } from "../observability/logger.js";
import { CreateOrderUseCase } from "../../application/use-cases/CreateOrderUseCase.js";
import { OrderRoutes } from "./routes/orderRoutes.js";
import { httpRequestsTotal, register } from "../observability/metrics.js";

type BuildServerDependencies = {
  createOrderUseCase: CreateOrderUseCase;
};

export function buildServer(dependencies: BuildServerDependencies) {
  const app = Fastify({
    loggerInstance: logger,
  });

  app.addHook("onRequest", async (request, reply) => {
    const correlationId =
      request.headers["x-correlation-id"]?.toString() ?? crypto.randomUUID();

    request.headers["x-correlation-id"] = correlationId;
    reply.header("x-correlation-id", correlationId);
  });

  app.addHook("onResponse", async (request, reply) => {
    httpRequestsTotal.inc({
      method: request.method,
      route: request.routeOptions.url ?? request.url,
      status_code: String(reply.statusCode),
    });
  });

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "order-service",
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/metrics", async (_request, reply) => {
    reply.header("Content-Type", register.contentType);
    return register.metrics();
  });

  app.register(async (routes) => {
    await OrderRoutes(routes, dependencies.createOrderUseCase);
  });
  return app;
}
