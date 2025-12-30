import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PgmqModule } from 'nestjs-pgmq';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'postgres',
      entities: [User],
      synchronize: true,
    }),

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

    UsersModule,
    NotificationsModule,
  ],
})
export class AppModule {}
