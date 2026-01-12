import { Injectable, Logger } from '@nestjs/common';
import { Process, PgmqJob } from 'nestjs-pgmq';
import { EventsHandler, IEventHandler } from '../cqrs';
import { HeroKilledDragonEvent } from '../heroes/events';

/**
 * Handler that rewards the hero with gold when a dragon is killed.
 *
 * Has its own dedicated queue: "reward-hero"
 *
 * DEMO: This handler intentionally fails the first 2 attempts to demonstrate
 * isolated retry behavior. Notice that other handlers (UpdateHeroStats, NotifyGuild)
 * complete successfully on their own queues while this one retries independently.
 */
@Injectable()
@EventsHandler(HeroKilledDragonEvent, { queueName: 'reward-hero' })
export class RewardHeroHandler implements IEventHandler<HeroKilledDragonEvent> {
  private readonly logger = new Logger(RewardHeroHandler.name);

  @Process('event')
  async handle(job: PgmqJob<HeroKilledDragonEvent>): Promise<void> {
    const event = job.message.data;
    const attempt = job.read_ct;

    this.logger.log(
      `Attempting to reward hero ${event.heroId} with gold (attempt: ${attempt})`,
    );

    // Fail first 2 attempts to demonstrate isolated retry
    if (attempt <= 2) {
      this.logger.error(
        `Payment service unavailable (attempt: ${attempt}/3) - will retry`,
      );
      throw new Error('Payment service temporarily unavailable');
    }

    // Succeed on 3rd attempt
    this.logger.log(
      `Hero ${event.heroId} rewarded with 100 gold for killing dragon ${event.dragonId}!`,
    );
  }
}
