import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EmailService } from './email.service';
import { PgmqModule } from 'nestjs-pgmq';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    PgmqModule.forRootAsync({
      useFactory: () => ({
        connection: {
          connectionString: 'postgres://postgres:postgres@localhost:5432/db',
        },
      }),
    }),
    PgmqModule.registerQueue({ name: 'emails' }),
  ],
  controllers: [AppController],
  providers: [EmailService, EmailProcessor],
})
export class AppModule {}
