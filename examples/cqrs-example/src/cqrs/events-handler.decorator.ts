import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Processor } from 'nestjs-pgmq';
import { IEvent } from './interfaces';

export const EVENTS_HANDLER_METADATA = 'EVENTS_HANDLER_METADATA';

export interface EventsHandlerOptions {
  queueName: string;
}

/**
 * Decorator that marks a class as an event handler with its own dedicated queue.
 *
 * Each handler has its own queue, providing:
 * - Isolated retry: if this handler fails, others are not affected
 * - Independent scaling: can process events at different rates
 * - Separate DLQ per handler
 *
 * @param event The event class this handler processes
 * @param options Options including the queue name
 */
export function EventsHandler(
  event: new (...args: any[]) => IEvent,
  options: EventsHandlerOptions,
): ClassDecorator {
  return applyDecorators(
    SetMetadata(EVENTS_HANDLER_METADATA, {
      events: [event],
      queueName: options.queueName,
    }),
    Processor(options.queueName),
  );
}
