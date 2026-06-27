import crypto from "node:crypto";

export type OrderStatus = "PENDING" | "PAID" | "FAILED";

type CreateOrderInput = {
  customerId: string;
  amount: number;
};

export class Order {
  public readonly id: string;
  public readonly customerId: string;
  public readonly amount: number;
  public status: OrderStatus;
  public readonly createdAt: Date;

  private constructor(props: {
    id: string;
    customerId: string;
    amount: number;
    status: OrderStatus;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.amount = props.amount;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  /**
   * Pedido não pode existir sem cliente.
   * Pedido não pode ter valor menor ou igual a zero.
   * Pedido nasce como PENDING.
   */
  static create(input: CreateOrderInput): Order {
    if (!input.customerId) {
      throw new Error("Customer is required");
    }

    if (input.amount <= 0) {
      throw new Error("Order amount must be greater than zero");
    }

    return new Order({
      id: crypto.randomUUID(),
      customerId: input.customerId,
      amount: input.amount,
      status: "PENDING",
      createdAt: new Date(),
    });
  }
}
