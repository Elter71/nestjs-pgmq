import { Module } from '@nestjs/common';
import { CqrsModule } from '../cqrs';
import { NotifyGuildHandler } from './notify-guild.handler';
import { RewardHeroHandler } from './reward-hero.handler';
import { UpdateHeroStatsHandler } from './update-hero-stats.handler';

/**
 * Module that registers all event handlers.
 *
 * CqrsModule.forFeature() automatically:
 * - Reads queue names from @EventsHandler metadata
 * - Registers PGMQ queues for each handler
 * - Registers handlers as providers
 */
@Module({
  imports: [
    CqrsModule.forFeature([
      UpdateHeroStatsHandler,
      NotifyGuildHandler,
      RewardHeroHandler,
    ]),
  ],
})
export class HandlersModule {}
