import { trace } from "@opentelemetry/api";
import { OrderRepository } from "../../application/ports/OrderRepository.js";
import { Order } from "../../domain/entities/Order.js";
import { logger } from "../observability/logger.js";
import { postgresPool } from "./postgres.js";

export class PostgresOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    const tracer = trace.getTracer("order-service");

    await tracer.startActiveSpan("orders.repository.save", async (span) => {
      try {
        span.setAttribute("db.system", "postgresql");
        span.setAttribute("order.id", order.id);
        span.setAttribute("order.status", order.status);

        await postgresPool.query(
          `
          INSERT INTO orders (
            id,
            customer_id,
            amount,
            status,
            created_at
          ) VALUES ($1, $2, $3, $4, $5)
          `,
          [
            order.id,
            order.customerId,
            order.amount,
            order.status,
            order.createdAt,
          ],
        );

        logger.info(
          {
            orderId: order.id,
            customerId: order.customerId,
            amount: order.amount,
            status: order.status,
          },
          "Order saved in Postgres",
        );
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: 2,
          message: "Failed to save order",
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }
}
