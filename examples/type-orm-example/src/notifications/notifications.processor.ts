import { Processor, Process, PgmqJob } from 'nestjs-pgmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  @Process('send-welcome-email')
  async handleWelcomeEmail(job: PgmqJob<{ userId: number; email: string }>) {
    this.logger.log(
      `📨 Sending welcome email to: ${job.message.data.email} (User ID: ${job.message.data.userId})`,
    );

    await new Promise((r) => setTimeout(r, 1000));

    this.logger.log(`✅ Email sent!`);
  }
}
