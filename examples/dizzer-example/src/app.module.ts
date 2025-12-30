import { Module } from '@nestjs/common';
import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import * as schema from '../db/schema';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PgmqModule } from 'nestjs-pgmq';

@Module({
  imports: [
    DrizzlePGModule.register({
      tag: 'DB',
      config: {
        schema,
      },
      pg: {
        connection: 'pool',
        config: {
          connectionString: 'postgres://postgres:postgres@localhost:5432/db',
        },
      },
    }),
    PgmqModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: 'localhost',
          port: 5432,
          user: 'postgres',
          password: 'postgres',
          database: 'db',
        },
      }),
    }),
    UsersModule,
    NotificationsModule,
  ],
})
export class AppModule {}
