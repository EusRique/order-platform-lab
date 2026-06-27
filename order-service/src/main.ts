import { CreateOrderUseCase } from "./application/use-cases/CreateOrderUseCase.js";
import { connectToPostgres } from "./infra/database/postgres.js";
import { PostgresOrderRepository } from "./infra/database/PostgresOrderRepository.js";
import { buildServer } from "./infra/http/server.js";
import { RabbitMQEventPublisher } from "./infra/messaging/RabbitMQEventPublisher.js";
import { connectRabbitMQ } from "./infra/messaging/rabbitmq.js";
import { logger } from "./infra/observability/logger.js";
import { startTracing, shutdownTracing } from "./infra/observability/tracing.js";

const port = Number(process.env.PORT) || 3000;

const orderRepository = new PostgresOrderRepository();
const eventPublisher = new RabbitMQEventPublisher();

const createOrderUseCase = new CreateOrderUseCase(
  orderRepository,
  eventPublisher,
);

const app = buildServer({
  createOrderUseCase,
});

try {
  await startTracing();
  await connectToPostgres();
  await connectRabbitMQ();

  await app.listen({
    port,
    host: "0.0.0.0",
  });

  logger.info({ port }, "Order service started");
} catch (error) {
  logger.error({ error }, "Failed to start order service");
  process.exit(1);
}

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down order-service");

  await app.close();
  await shutdownTracing();

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));