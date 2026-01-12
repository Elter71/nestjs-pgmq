import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '../cqrs';
import { HeroKilledDragonEvent } from './events';

export interface Hero {
  id: string;
  name: string;
  kills: number;
}

@Injectable()
export class HeroesService {
  private readonly logger = new Logger(HeroesService.name);

  private heroes: Hero[] = [
    { id: '1', name: 'Sir Lancelot', kills: 0 },
    { id: '2', name: 'Sir Galahad', kills: 0 },
  ];

  constructor(private readonly eventBus: EventBus) {}

  findAll(): Hero[] {
    return this.heroes;
  }

  findOne(id: string): Hero | undefined {
    return this.heroes.find((h) => h.id === id);
  }

  async killDragon(heroId: string, dragonId: string): Promise<Hero> {
    const hero = this.findOne(heroId);
    if (!hero) {
      throw new Error(`Hero ${heroId} not found`);
    }

    hero.kills++;
    this.logger.log(`${hero.name} killed dragon ${dragonId}! Total kills: ${hero.kills}`);

    // Publish event - EventBus creates separate jobs for each handler
    // If one handler fails, only that handler retries (isolated retry)
    await this.eventBus.publish(new HeroKilledDragonEvent(heroId, dragonId));

    return hero;
  }
}
