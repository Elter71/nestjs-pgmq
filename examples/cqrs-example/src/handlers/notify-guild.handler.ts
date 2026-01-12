import { Injectable, Logger } from '@nestjs/common';
import { Process, PgmqJob } from 'nestjs-pgmq';
import { EventsHandler, IEventHandler } from '../cqrs';
import { HeroKilledDragonEvent } from '../heroes/events';

/**
 * Handler that notifies the guild when a dragon is killed.
 *
 * Has its own dedicated queue: "notify-guild"
 * This handler always succeeds.
 */
@Injectable()
@EventsHandler(HeroKilledDragonEvent, { queueName: 'notify-guild' })
export class NotifyGuildHandler implements IEventHandler<HeroKilledDragonEvent> {
  private readonly logger = new Logger(NotifyGuildHandler.name);

  @Process('event')
  async handle(job: PgmqJob<HeroKilledDragonEvent>): Promise<void> {
    const event = job.message.data;

    this.logger.log(
      `Notifying guild about hero ${event.heroId} killing dragon ${event.dragonId}`,
    );

    // Simulate notification
    await new Promise((resolve) => setTimeout(resolve, 200));

    this.logger.log(`Guild notified successfully!`);
  }
}
