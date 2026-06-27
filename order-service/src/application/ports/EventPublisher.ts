// Outra porta. O caso de uso não sabe se vai publicar em:
// RabbitMQ, SQS, Kafka, Redis Streams, console.log

export interface EventPublisher<TEvent = unknown> {
  publish(event: TEvent): Promise<void>;
}
