import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectQueue, PgmqQueue } from 'nestjs-pgmq';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectQueue('notifications') private readonly queue: PgmqQueue,
  ) {}

  async register(email: string) {
    this.logger.log(`Starting registration for ${email}...`);


    await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, { email });
      await manager.save(user);
      this.logger.log(`User ${user.id} saved in transaction (pending commit).`);

      await this.queue.add(
        'send-welcome-email',
        { userId: user.id, email: user.email },
        { connection: manager },
      );

      this.logger.log(`Job added to queue in transaction (pending commit).`);

      if (email.includes('error')) throw new Error('Simulated Failure!');
    });

    this.logger.log(
      'Transaction COMMITTED. User created and Email job is live.',
    );
  }
}
