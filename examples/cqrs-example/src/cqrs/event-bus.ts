import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PgmqQueue, getQueueToken } from 'nestjs-pgmq';
import { EventHandlerRegistry } from './event-handler.registry';
import { IEvent } from './interfaces';

/**
 * EventBus that publishes events to handler-specific PGMQ queues.
 *
 * Key feature: Each handler has its own dedicated queue.
 * If one handler fails, only that handler retries - other handlers are not affected.
 */
@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly registry: EventHandlerRegistry,
  ) {}

  /**
   * Publish an event to all registered handler queues.
   * Each handler has its own queue for complete isolation.
   */
  async publish<T extends IEvent>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.registry.getQueuesForEvent(eventName);

    if (handlers.length === 0) {
      this.logger.warn(`No handlers registered for event "${eventName}"`);
      return;
    }

    const queueNames = handlers.map((h) => h.queueName);
    this.logger.log(
      `Publishing "${eventName}" to ${handlers.length} queue(s): [${queueNames.join(', ')}]`,
    );

    // Publish to each handler's dedicated queue
    for (const handler of handlers) {
      const queue = this.moduleRef.get<PgmqQueue>(
        getQueueToken(handler.queueName),
        { strict: false },
      );

      await queue.add('event', { ...event });

      this.logger.debug(
        `Sent "${eventName}" to queue "${handler.queueName}" (handler: ${handler.handlerName})`,
      );
    }
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: IEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
