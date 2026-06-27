import { trace } from "@opentelemetry/api";
import { postgresPool } from "../infra/database/postgres.js";
import { logger } from "../infra/observability/logger.js";

type OrderCreatedEvent = {
  eventName: "OrderCreated";
  occurredAt: string;
  correlationId: string;
  payload: {
    orderId: string;
    customerId: string;
    amount: number;
    status: string;
  };
};

export async function processOrderPayment(event: OrderCreatedEvent) {
  const tracer = trace.getTracer("order-worker");

  await tracer.startActiveSpan("fake-payment.process", async (span) => {
    try {
      span.setAttribute("order.id", event.payload.orderId);
      span.setAttribute("payment.amount", event.payload.amount);
      span.setAttribute("correlation.id", event.correlationId);

      logger.info(
        {
          correlationId: event.correlationId,
          orderId: event.payload.orderId,
        },
        "Processing payment",
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      await postgresPool.query(
        `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        `,
        ["PAID", event.payload.orderId],
      );

      logger.info(
        {
          correlationId: event.correlationId,
          orderId: event.payload.orderId,
        },
        "Order marked as PAID",
      );
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: 2,
        message: "Payment processing failed",
      });

      throw error;
    } finally {
      span.end();
    }
  });
}
