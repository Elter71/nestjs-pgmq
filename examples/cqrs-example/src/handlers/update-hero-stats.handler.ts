import { Injectable, Logger } from '@nestjs/common';
import { Process, PgmqJob } from 'nestjs-pgmq';
import { EventsHandler, IEventHandler } from '../cqrs';
import { HeroKilledDragonEvent } from '../heroes/events';

/**
 * Handler that updates hero statistics when a dragon is killed.
 *
 * Has its own dedicated queue: "update-hero-stats"
 * This handler always succeeds.
 */
@Injectable()
@EventsHandler(HeroKilledDragonEvent, { queueName: 'update-hero-stats' })
export class UpdateHeroStatsHandler
  implements IEventHandler<HeroKilledDragonEvent>
{
  private readonly logger = new Logger(UpdateHeroStatsHandler.name);

  @Process('event')
  async handle(job: PgmqJob<HeroKilledDragonEvent>): Promise<void> {
    const event = job.message.data;

    this.logger.log(
      `Updating stats for hero ${event.heroId} after killing dragon ${event.dragonId}`,
    );

    // Simulate database update
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.log(`Stats updated successfully for hero ${event.heroId}`);
  }
}
