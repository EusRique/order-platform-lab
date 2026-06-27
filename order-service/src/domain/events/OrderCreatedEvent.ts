import { Order } from "../entities/Order.js";

export type OrderCreatedEvent = {
  eventName: "OrderCreated";
  ocurredAt: string;
  correlationId?: string;
  payload: {
    orderId: string;
    customerId: string;
    amount: number;
    status: string;
  };
};

// Esse evento representa algo que aconteceu no negócio: Um pedido foi criado.
export function createOrderCreatedEvent(order: Order, correlationId: string): OrderCreatedEvent {
  return {
    eventName: "OrderCreated",
    ocurredAt: new Date().toISOString(),
    correlationId,
    payload: {
      orderId: order.id,
      customerId: order.customerId,
      amount: order.amount,
      status: order.status,
    },
  };
}
