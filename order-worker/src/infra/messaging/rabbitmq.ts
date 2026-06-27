import amqp from "amqplib";
import { logger } from "../observability/logger.js";

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://rabbitmq:5672";

let channel: amqp.Channel;

export async function connectRabbitMQ() {
  const connection = await amqp.connect(RABBITMQ_URL);

  channel = await connection.createChannel();

  logger.info("Worker connected to RabbitMQ");
}

export function getRabbitMQChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }

  return channel;
}
