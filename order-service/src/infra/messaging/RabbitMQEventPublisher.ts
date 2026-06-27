import { context, propagation, trace } from "@opentelemetry/api";
import { EventPublisher } from "../../application/ports/EventPublisher.js";
import { logger } from "../observability/logger.js";
import { rabbitmqEventsPublishedTotal } from "../observability/metrics.js";
import { getRabbitMQChannel } from "./rabbitmq.js";

export class RabbitMQEventPublisher<TEvent> implements EventPublisher<TEvent> {
  async publish(event: TEvent): Promise<void> {
    const tracer = trace.getTracer("order-service");

    await tracer.startActiveSpan(
      "rabbitmq.publish orders.created",
      async (span) => {
        try {
          const channel = getRabbitMQChannel();
          const queue = "orders.created";

          span.setAttribute("messaging.system", "rabbitmq");
          span.setAttribute("messaging.destination.name", queue);
          span.setAttribute("messaging.operation", "publish");

          await channel.assertQueue(queue, {
            durable: true,
          });

          const headers: Record<string, string> = {};

          propagation.inject(context.active(), headers);

          channel.sendToQueue(queue, Buffer.from(JSON.stringify(event)), {
            persistent: true,
            headers,
          });

          rabbitmqEventsPublishedTotal.inc({
            queue,
          });

          logger.info(
            {
              queue,
              event,
              traceHeaders: headers,
            },
            "Event published to RabbitMQ",
          );
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({
            code: 2,
            message: "Failed to publish RabbitMQ event",
          });

          throw error;
        } finally {
          span.end();
        }
      },
    );
  }
}
