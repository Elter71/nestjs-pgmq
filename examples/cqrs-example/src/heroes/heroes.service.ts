import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventBus, Transactional, TransactionContext } from '../cqrs';
import { HeroKilledDragonEvent } from './events';
import { Hero } from './hero.entity';

@Injectable()
export class HeroesService {
  private readonly logger = new Logger(HeroesService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Get the Hero repository (transaction-aware).
   * If called within @Transactional(), uses the transaction's manager.
   */
  private get heroRepo() {
    return TransactionContext.getRepository(this.dataSource, Hero);
  }

  async findAll(): Promise<Hero[]> {
    return this.heroRepo.find();
  }

  async findOne(id: number): Promise<Hero | null> {
    return this.heroRepo.findOneBy({ id });
  }

  @Transactional()
  async create(name: string): Promise<Hero> {
    const hero = this.heroRepo.create({ name });
    return this.heroRepo.save(hero);
  }

  /**
   * Kill a dragon using the @Transactional() decorator.
   *
   * Everything inside this method runs in a single transaction:
   * - Database operations use the transaction automatically
   * - EventBus.publish() uses the transaction automatically (outbox pattern)
   *
   * If anything throws, the entire transaction rolls back:
   * - hero.kills is NOT incremented
   * - events are NOT sent to the queue
   */
  @Transactional()
  async killDragon(heroId: number, dragonId: string): Promise<Hero> {
    const hero = await this.heroRepo.findOneBy({ id: heroId });
    if (!hero) {
      throw new Error(`Hero ${heroId} not found`);
    }

    hero.kills++;
    await this.heroRepo.save(hero);

    this.logger.log(
      `${hero.name} killed dragon ${dragonId}! Total kills: ${hero.kills}`,
    );

    // EventBus automatically detects the transaction context
    // No need to pass { connection: manager } - it's handled by AsyncLocalStorage
    await this.eventBus.publish(
      new HeroKilledDragonEvent(heroId.toString(), dragonId),
    );

    // Simulate failure for testing - use dragonId containing "fail"
    if (dragonId.includes('fail')) {
      throw new Error('Dragon fight failed! Transaction will rollback.');
    }

    return hero;
  }
}
