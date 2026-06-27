import { context, propagation, trace } from "@opentelemetry/api";
import { processOrderPayment } from "./application/processOrderPayment.js";
import { connectToPostgres } from "./infra/database/postgres.js";
import { startMetricsServer } from "./infra/http/metricsServer.js";
import {
  connectRabbitMQ,
  getRabbitMQChannel,
} from "./infra/messaging/rabbitmq.js";
import { logger } from "./infra/observability/logger.js";
import {
  workerMessagesFailedTotal,
  workerMessagesProcessedTotal,
} from "./infra/observability/metrics.js";
import {
  startTracing,
  shutdownTracing,
} from "./infra/observability/tracing.js";

const QUEUE_NAME = "orders.created";

async function bootstrap() {
  await startTracing();

  await connectToPostgres();

  await connectRabbitMQ();

  await startMetricsServer();

  const channel = getRabbitMQChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  logger.info(
    {
      queue: QUEUE_NAME,
    },
    "Worker waiting for messages",
  );

  channel.consume(QUEUE_NAME, async (message) => {
    if (!message) {
      return;
    }

    const headers = message.properties.headers ?? {};

    const parentContext = propagation.extract(context.active(), headers);

    await context.with(parentContext, async () => {
      const tracer = trace.getTracer("order-worker");

      await tracer.startActiveSpan(
        "rabbitmq.consume orders.created",
        async (span) => {
          try {
            const event = JSON.parse(message.content.toString());

            span.setAttribute("messaging.system", "rabbitmq");
            span.setAttribute("messaging.destination.name", QUEUE_NAME);
            span.setAttribute("messaging.operation", "process");
            span.setAttribute("order.id", event.payload.orderId);
            span.setAttribute("correlation.id", event.correlationId);

            logger.info(
              {
                correlationId: event.correlationId,
                eventName: event.eventName,
                orderId: event.payload.orderId,
              },
              "Message received",
            );

            await processOrderPayment(event);

            channel.ack(message);

            workerMessagesProcessedTotal.inc({
              queue: QUEUE_NAME,
            });

            logger.info(
              {
                correlationId: event.correlationId,
                orderId: event.payload.orderId,
              },
              "Message acknowledged",
            );
          } catch (error) {
            span.recordException(error as Error);
            span.setStatus({
              code: 2,
              message: "Failed to process message",
            });

            workerMessagesFailedTotal.inc({
              queue: QUEUE_NAME,
            });

            // channel.ack(message);

            logger.error(
              {
                error,
              },
              "Failed to process message",
            );
          } finally {
            span.end();
          }
        },
      );
    });
  });
}

bootstrap();

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down order-worker");

  await shutdownTracing();

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
