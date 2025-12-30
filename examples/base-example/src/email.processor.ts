import { PgmqJob, Process, Processor } from 'nestjs-pgmq';

@Processor('emails')
export class EmailProcessor {
  @Process('welcome-msg')
  async handle(job: PgmqJob) {
    console.log('Received job welcome-msg:', job);
  }

  @Process('error-msg')
  async errorHandler() {
    throw new Error('Error processing job');
  }
}
