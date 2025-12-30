import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PgmqModule } from 'nestjs-pgmq';

@Module({
  imports: [
    PgmqModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
