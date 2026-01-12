import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { EVENTS_HANDLER_METADATA } from './events-handler.decorator';
import { EventsHandlerMetadata, HandlerInfo } from './interfaces';

/**
 * Registry that discovers and tracks all event handlers and their queues.
 */
@Injectable()
export class EventHandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(EventHandlerRegistry.name);

  // Map: eventName -> handlers with their queue names
  private readonly handlersMap = new Map<string, HandlerInfo[]>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    this.discoverHandlers();
  }

  private discoverHandlers() {
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const { instance, metatype } = wrapper;

      if (!instance || !metatype) {
        continue;
      }

      const metadata = this.reflector.get<EventsHandlerMetadata>(
        EVENTS_HANDLER_METADATA,
        metatype,
      );

      if (!metadata) {
        continue;
      }

      const { events, queueName } = metadata;
      const handlerName = metatype.name;

      // Register handler for each event it handles
      for (const eventClass of events) {
        const eventName = eventClass.name;

        if (!this.handlersMap.has(eventName)) {
          this.handlersMap.set(eventName, []);
        }

        this.handlersMap.get(eventName).push({
          queueName,
          handlerName,
        });

        this.logger.log(
          `Registered handler "${handlerName}" (queue: "${queueName}") for event "${eventName}"`,
        );
      }
    }

    const totalHandlers = Array.from(this.handlersMap.values()).flat().length;
    const totalEvents = this.handlersMap.size;
    this.logger.log(
      `Discovery complete: ${totalHandlers} handler(s) for ${totalEvents} event type(s)`,
    );
  }

  /**
   * Get all handler queue names for a given event
   */
  getQueuesForEvent(eventName: string): HandlerInfo[] {
    return this.handlersMap.get(eventName) || [];
  }
}
