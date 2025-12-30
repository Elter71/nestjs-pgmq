import { Logger } from '@nestjs/common';

// This interface matches the signature expected by 'nestjs-pgmq' (and node-postgres)
interface PgmqConnection {
  query(text: string, params?: any[]): Promise<any>;
}

/**
 * Creates an adapter that allows 'nestjs-pgmq' to execute raw queries
 * within a Drizzle ORM transaction context.
 *
 * @param tx - The Drizzle transaction object
 */
export function withDrizzleTx(tx: any): PgmqConnection {
  return {
    query: async (text: string, params: any[]) => {
      // ------------------------------------------------------------------
      // WHY THIS IS NEEDED:
      // ------------------------------------------------------------------
      // 1. 'nestjs-pgmq' generates raw SQL strings with parameterized values
      //    (e.g., "SELECT pgmq.send($1, $2...)" and values: ['queue', {...}]).
      //
      // 2. Drizzle's high-level 'tx.execute(sql)' API is strictly typed and
      //    abstracts away parameter binding. Passing raw text via 'sql.raw()'
      //    causes Drizzle to ignore the 'params' array, leading to SQL errors.
      //
      // 3. To fix this, we bypass Drizzle's abstraction layer and access the
      //    underlying 'node-postgres' client directly. This client natively
      //    supports the '.query(text, params)' signature.
      // ------------------------------------------------------------------

      // Access the internal session object.
      // Note: Properties might differ slightly between Drizzle versions, hence the fallback.
      const session = tx.session ?? (tx as any)._session;
      const pgClient = session?.client;

      // Validate that we successfully extracted the native PG client
      if (pgClient && typeof pgClient.query === 'function') {
        return pgClient.query(text, params);
      }

      // ------------------------------------------------------------------
      // ERROR HANDLING:
      // ------------------------------------------------------------------
      const logger = new Logger('PgmqDrizzleAdapter');
      logger.error(
        'Failed to extract the underlying PG client from Drizzle transaction. ' +
          'Ensure you are using the "drizzle-orm/node-postgres" driver.',
      );

      throw new Error(
        'CRITICAL: Could not access underlying PG client from Drizzle Transaction to perform Queue operation.',
      );
    },
  };
}
