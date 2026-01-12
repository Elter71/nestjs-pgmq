import { AsyncLocalStorage } from 'async_hooks';
import { DataSource, EntityManager, EntityTarget, Repository } from 'typeorm';

/**
 * Transaction context using AsyncLocalStorage.
 *
 * This allows us to implicitly pass the current transaction manager
 * through the async call stack without explicitly passing it as a parameter.
 */
class TransactionContextClass {
  private readonly storage = new AsyncLocalStorage<EntityManager>();

  /**
   * Run a function within a transaction context.
   * The EntityManager will be available to all code within the callback
   * via getCurrentManager().
   */
  run<T>(manager: EntityManager, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(manager, fn);
  }

  /**
   * Get the current transaction's EntityManager.
   * Returns undefined if not within a transaction context.
   */
  getCurrentManager(): EntityManager | undefined {
    return this.storage.getStore();
  }

  /**
   * Check if currently running within a transaction context.
   */
  isInTransaction(): boolean {
    return this.storage.getStore() !== undefined;
  }

  /**
   * Get a repository that uses the current transaction if available.
   * Falls back to the DataSource's default repository if not in a transaction.
   *
   * @param dataSource The DataSource to get repository from
   * @param entity The entity class
   */
  getRepository<T>(
    dataSource: DataSource,
    entity: EntityTarget<T>,
  ): Repository<T> {
    const manager = this.getCurrentManager();
    if (manager) {
      return manager.getRepository(entity);
    }
    return dataSource.getRepository(entity);
  }
}

/**
 * Singleton instance of TransactionContext.
 * Used by @Transactional() decorator and EventBus.
 */
export const TransactionContext = new TransactionContextClass();
