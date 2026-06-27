import { trace } from "@opentelemetry/api";
import { Order } from "../../domain/entities/Order.js";
import {
  createOrderCreatedEvent,
  OrderCreatedEvent,
} from "../../domain/events/OrderCreatedEvent.js";
import { ordersCreatedTotal } from "../../infra/observability/metrics.js";
import { EventPublisher } from "../ports/EventPublisher.js";
import { OrderRepository } from "../ports/OrderRepository.js";

type CreateOrderInput = {
  customerId: string;
  amount: number;
  correlationId: string;
};

type CreateOrderOutput = {
  id: string;
  customerId: string;
  amount: number;
  status: string;
  createdAt: string;
};

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventPublisher: EventPublisher<OrderCreatedEvent>,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const tracer = trace.getTracer("order-service");

    return tracer.startActiveSpan("create-order.use-case", async (span) => {
      try {
        span.setAttribute("customer.id", input.customerId);
        span.setAttribute("order.amount", input.amount);
        span.setAttribute("correlation.id", input.correlationId);

        const order = Order.create({
          customerId: input.customerId,
          amount: input.amount,
        });

        span.setAttribute("order.id", order.id);
        span.setAttribute("order.status", order.status);

        await this.orderRepository.save(order);

        const event = createOrderCreatedEvent(order, input.correlationId);

        await this.eventPublisher.publish(event);

        ordersCreatedTotal.inc();

        return {
          id: order.id,
          customerId: order.customerId,
          amount: order.amount,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
        };
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: 2,
          message: "Create order failed",
        });

        throw error;
      } finally {
        span.end();
      }
    });
  }
}
