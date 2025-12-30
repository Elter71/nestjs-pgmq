import { Injectable } from '@nestjs/common';
import { InjectQueue, PgmqQueue } from 'nestjs-pgmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('emails') private readonly queue: PgmqQueue) {}

  async send() {
    await this.queue.add('welcome-msg', { userId: 123 });
  }

  async sendError() {
    await this.queue.add('error-msg', { userId: 123 });
  }
}
