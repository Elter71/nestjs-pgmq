import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PgmqModule } from 'nestjs-pgmq';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PgmqModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
