import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue, PgmqQueue } from 'nestjs-pgmq';
import { DrizzleClient } from '../../db/types';
import { users } from '../../db/schema';
import { withDrizzleTx } from '../utils/drizzle-pgmq';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('DB') private db: DrizzleClient,
    @InjectQueue('notifications') private readonly queue: PgmqQueue,
  ) {}

  async register(email: string) {
    this.logger.log(`Starting registration for ${email}...`);

    await this.db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({ email }).returning();

      this.logger.log(`User ${user.id} saved in transaction (pending commit).`);

      await this.queue.add(
        'send-welcome-email',
        { userId: user.id, email: user.email },
        { connection: withDrizzleTx(tx) },
      );

      this.logger.log(`Job added to queue in transaction (pending commit).`);

      if (email.includes('error')) throw new Error('Simulated Failure!');
    });

    this.logger.log(
      'Transaction COMMITTED. User created and Email job is live.',
    );
  }
}
