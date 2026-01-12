import { IEvent } from '../../cqrs';

/**
 * Event emitted when a hero kills a dragon
 */
export class HeroKilledDragonEvent implements IEvent {
  constructor(
    public readonly heroId: string,
    public readonly dragonId: string,
  ) {}
}
