import { Module } from '@nestjs/common';
import { PgmqModule } from 'nestjs-pgmq';
import { CqrsModule } from './cqrs';
import { HandlersModule } from './handlers/handlers.module';
import { HeroesModule } from './heroes/heroes.module';

@Module({
  imports: [
    // Initialize PGMQ connection
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
