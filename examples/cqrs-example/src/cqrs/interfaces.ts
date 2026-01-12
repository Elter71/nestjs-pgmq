import { PgmqJob } from 'nestjs-pgmq';

/**
 * Marker interface for events (following @nestjs/cqrs pattern)
 */
export interface IEvent {}

/**
 * Interface for event handlers.
 * Each handler processes events from its own dedicated queue.
 */
export interface IEventHandler<T extends IEvent = any> {
  handle(job: PgmqJob<T>): Promise<void>;
}

/**
 * Metadata stored by @EventsHandler decorator
 */
export interface EventsHandlerMetadata {
  events: Array<new (...args: any[]) => IEvent>;
  queueName: string;
}

/**
 * Handler info stored in registry
 */
export interface HandlerInfo {
  queueName: string;
  handlerName: string;
}

/**
 * Options for publishing events
 */
export interface PublishOptions {
  /**
   * Database connection/transaction manager to use for transactional publishing.
   * Pass TypeORM EntityManager or Drizzle transaction to ensure event is sent
   * in the same transaction as your database operations (outbox pattern).
   *
   * @example
   * ```typescript
   * await this.dataSource.transaction(async (manager) => {
   *   await manager.save(user);
   *   await this.eventBus.publish(new UserCreatedEvent(user.id), { connection: manager });
   * });
   * ```
   */
  connection?: any;
}
