import { Module } from '@nestjs/common';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  providers: [NotificationsProcessor],
})
export class NotificationsModule {}
