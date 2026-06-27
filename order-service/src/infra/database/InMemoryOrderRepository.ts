import { OrderRepository } from "../../application/ports/OrderRepository.js";
import { Order } from "../../domain/entities/Order.js";
import { logger } from "../observability/logger.js";

// Esse é um adapter fake.
// Ele implementa a porta OrderRepository.

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders: Order[] = [];

  async save(order: Order): Promise<void> {
    this.orders.push(order);

    logger.info(
      {
        orderId: order.id,
        customerId: order.customerId,
        amount: order.amount,
        status: order.status,
      },
      "Order saved in memory",
    );
  }
}
