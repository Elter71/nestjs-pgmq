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
