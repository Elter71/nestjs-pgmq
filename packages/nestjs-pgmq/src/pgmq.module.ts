import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { Pool } from 'pg';
import { PGMQ_CONNECTION, PGMQ_MODULE_OPTIONS } from './pgmq.constants';
import { PgmqExplorer } from './pgmq.explorer';
import {
  PgmqModuleAsyncOptions,
  PgmqModuleOptions,
  PgmqQueueOptions,
} from './pgmq.interfaces';
import { PgmqQueue } from './pgmq.service';
import { getQueueToken } from './pgmq.decorators';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [PgmqExplorer],
})
export class PgmqModule {
  static forRootAsync(options: PgmqModuleAsyncOptions): DynamicModule {
    const connectionProvider: Provider = {
      provide: PGMQ_CONNECTION,
      useFactory: async (opt: PgmqModuleOptions) => {
        const pool = new Pool(opt.connection);
        const installExtension = opt.installExtension ?? true;

        try {
          const client = await pool.connect();
          try {
            if (installExtension) {
              await client.query(
                'CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;',
              );
              console.log('PGMQ extension initialized successfully');
            } else {
              const { rowCount } = await client.query(
                `SELECT 1 FROM pg_namespace WHERE nspname = 'pgmq'`,
              );
              if (!rowCount) {
                throw new Error(
                  'PGMQ not found: schema "pgmq" is missing. Install it manually (see https://github.com/pgmq/pgmq/blob/main/INSTALLATION.md) or set installExtension: true.',
                );
              }
              console.log('PGMQ verified successfully');
            }
          } finally {
            client.release();
          }
        } catch (e) {
          const error = e as Error;
          console.error('Failed to initialize PGMQ extension:', error.message);
          throw e;
        }

        return pool;
      },
      inject: [PGMQ_MODULE_OPTIONS],
    };

    const optionsProvider: Provider = {
      provide: PGMQ_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: PgmqModule,
      providers: [optionsProvider, connectionProvider],
      exports: [connectionProvider],
    };
  }

  static registerQueue(options: PgmqQueueOptions): DynamicModule {
    const queueProvider: Provider = {
      provide: getQueueToken(options.name),
      useFactory: async (pool: Pool) => {
        await pool.query(`SELECT pgmq.create_non_partitioned($1)`, [
          options.name,
        ]);
        return new PgmqQueue(pool, options.name);
      },
      inject: [PGMQ_CONNECTION],
    };

    return {
      module: PgmqModule,
      providers: [queueProvider],
      exports: [queueProvider],
    };
  }
}
