import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PgmqModule } from 'nestjs-pgmq';
import { CqrsModule } from './cqrs';
import { HandlersModule } from './handlers/handlers.module';
import { Hero } from './heroes/hero.entity';
import { HeroesModule } from './heroes/heroes.module';

@Module({
  imports: [
    // TypeORM connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'postgres',
      entities: [Hero],
      synchronize: true, // Auto-create tables (dev only)
    }),

    // PGMQ connection (uses same PostgreSQL instance)
    PgmqModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: 'localhost',
          port: 5432,
          user: 'postgres',
          password: 'postgres',
          database: 'postgres',
        },
      }),
    }),

    // CQRS module with EventBus
    CqrsModule.forRoot(),

    // Event handlers - queues auto-registered from @EventsHandler metadata
    HandlersModule,

    // Domain module
    HeroesModule,
  ],
})
export class AppModule {}
