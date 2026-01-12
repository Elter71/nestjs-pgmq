import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PgmqQueue, getQueueToken } from 'nestjs-pgmq';
import { EventHandlerRegistry } from './event-handler.registry';
import { IEvent, PublishOptions } from './interfaces';
import { TransactionContext } from './transaction';

/**
 * EventBus that publishes events to handler-specific PGMQ queues.
 *
 * Key features:
 * - Each handler has its own dedicated queue (isolated retries)
 * - Automatic transaction detection via AsyncLocalStorage
 * - Supports explicit connection passing for manual transaction control
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
   *
   * Transaction handling:
   * 1. If called within @Transactional() - automatically uses the transaction
   * 2. If options.connection is provided - uses that connection
   * 3. Otherwise - publishes without transaction
   *
   * @param event The event to publish
   * @param options Optional settings (connection is auto-detected if not provided)
   *
   * @example
   * ```typescript
   * // With @Transactional() decorator (recommended)
   * @Transactional()
   * async doSomething() {
   *   await this.repo.save(entity);
   *   await this.eventBus.publish(new MyEvent()); // auto-transactional!
   * }
   *
   * // Manual transaction control
   * await this.eventBus.publish(event, { connection: manager });
   *
   * // Without transaction
   * await this.eventBus.publish(event);
   * ```
   */
  async publish<T extends IEvent>(
    event: T,
    options?: PublishOptions,
  ): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.registry.getQueuesForEvent(eventName);

    if (handlers.length === 0) {
      this.logger.warn(`No handlers registered for event "${eventName}"`);
      return;
    }

    // Auto-detect transaction from context if not explicitly provided
    const connection =
      options?.connection ?? TransactionContext.getCurrentManager();

    const queueNames = handlers.map((h) => h.queueName);
    const txInfo = connection ? ' (transactional)' : '';
    this.logger.log(
      `Publishing "${eventName}" to ${handlers.length} queue(s): [${queueNames.join(', ')}]${txInfo}`,
    );

    // Publish to each handler's dedicated queue
    for (const handler of handlers) {
      const queue = this.moduleRef.get<PgmqQueue>(
        getQueueToken(handler.queueName),
        { strict: false },
      );

      await queue.add('event', { ...event }, { connection });

      this.logger.debug(
        `Sent "${eventName}" to queue "${handler.queueName}" (handler: ${handler.handlerName})`,
      );
    }
  }

  /**
   * Publish multiple events
   *
   * @param events Array of events to publish
   * @param options Optional settings (connection is auto-detected if not provided)
   */
  async publishAll(events: IEvent[], options?: PublishOptions): Promise<void> {
    for (const event of events) {
      await this.publish(event, options);
    }
  }
}
