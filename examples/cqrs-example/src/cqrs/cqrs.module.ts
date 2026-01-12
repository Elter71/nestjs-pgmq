import { DynamicModule, Global, Module, Type } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PgmqModule } from 'nestjs-pgmq';
import { EventBus } from './event-bus';
import { EventHandlerRegistry } from './event-handler.registry';
import { EVENTS_HANDLER_METADATA } from './events-handler.decorator';
import { EventsHandlerMetadata, IEventHandler } from './interfaces';

/**
 * CQRS Module that provides event bus functionality with PGMQ backend.
 *
 * Architecture: Each handler has its own dedicated queue.
 *
 * Features:
 * - Automatic discovery of @EventsHandler decorated classes
 * - Automatic queue registration based on handler metadata
 * - Isolated retries: if one handler fails, others are not affected
 * - Independent scaling: each handler processes at its own rate
 * - Separate DLQ per handler
 */
@Global()
@Module({})
export class CqrsModule {
  /**
   * Root module - initializes EventBus and discovery
   */
  static forRoot(): DynamicModule {
    return {
      module: CqrsModule,
      imports: [DiscoveryModule],
      providers: [EventBus, EventHandlerRegistry],
      exports: [EventBus],
    };
  }

  /**
   * Register event handlers with automatic queue creation.
   *
   * Reads queue names from @EventsHandler metadata and automatically
   * registers the required PGMQ queues.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     CqrsModule.forFeature([
   *       UpdateHeroStatsHandler,
   *       NotifyGuildHandler,
   *       RewardHeroHandler,
   *     ]),
   *   ],
   * })
   * export class HandlersModule {}
   * ```
   */
  static forFeature(
    handlers: Type<IEventHandler>[],
  ): DynamicModule {
    // Extract unique queue names from handler metadata
    const queueNames = new Set<string>();

    for (const handler of handlers) {
      const metadata: EventsHandlerMetadata = Reflect.getMetadata(
        EVENTS_HANDLER_METADATA,
        handler,
      );

      if (metadata?.queueName) {
        queueNames.add(metadata.queueName);
      }
    }

    // Create queue registrations for each unique queue
    const queueModules = Array.from(queueNames).map((name) =>
      PgmqModule.registerQueue({ name }),
    );

    return {
      module: CqrsModule,
      imports: [...queueModules],
      providers: [...handlers],
      exports: [...handlers],
    };
  }
}
