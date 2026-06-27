import { EventPublisher } from "../../application/ports/EventPublisher.js";
import { logger } from "../observability/logger.js";

// Outro adapter fake. Ele implementa a porta EventPublisher.
export class InMemoryEventPublisher<TEvent> implements EventPublisher<TEvent> {
  async publish(event: TEvent): Promise<void> {
    logger.info({ event }, "Event published in memory");
  }
}
