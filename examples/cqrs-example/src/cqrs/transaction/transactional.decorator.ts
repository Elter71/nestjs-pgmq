import { DataSource } from 'typeorm';
import { TransactionContext } from './transaction.context';

/**
 * Property name where DataSource should be injected in the class.
 * The @Transactional decorator will look for this property.
 */
export const DATA_SOURCE_PROPERTY = 'dataSource';

/**
 * Decorator that wraps a method in a database transaction.
 *
 * The transaction context is automatically propagated to:
 * - All repository operations within the method
 * - EventBus.publish() calls (for outbox pattern)
 *
 * Requirements:
 * - The class must have a `dataSource: DataSource` property injected
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class HeroesService {
 *   constructor(private readonly dataSource: DataSource) {}
 *
 *   @Transactional()
 *   async killDragon(heroId: number, dragonId: string) {
 *     // All operations here are in a transaction
 *     const hero = await this.heroRepo.findOne(heroId);
 *     hero.kills++;
 *     await this.heroRepo.save(hero);
 *
 *     // EventBus automatically uses the transaction
 *     await this.eventBus.publish(new HeroKilledDragonEvent(...));
 *   }
 * }
 * ```
 */
export function Transactional(): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const dataSource: DataSource = (this as any)[DATA_SOURCE_PROPERTY];

      if (!dataSource) {
        throw new Error(
          `@Transactional() requires '${DATA_SOURCE_PROPERTY}' property to be injected. ` +
            `Add 'private readonly dataSource: DataSource' to your constructor.`,
        );
      }

      // If already in a transaction, just run the method
      if (TransactionContext.isInTransaction()) {
        return originalMethod.apply(this, args);
      }

      // Start a new transaction and run the method within it
      return dataSource.transaction(async (manager) => {
        return TransactionContext.run(manager, async () => {
          return originalMethod.apply(this, args);
        });
      });
    };

    return descriptor;
  };
}
