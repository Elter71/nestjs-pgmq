import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { Pool } from 'pg';
import {
  PGMQ_CONNECTION,
  PGMQ_PROCESS_METADATA,
  PGMQ_PROCESSOR_METADATA,
} from './pgmq.constants';
import { PgmqJob } from './pgmq.interfaces';

@Injectable()
export class PgmqExplorer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgmqExplorer.name);
  private isRunning = false;
  private activeJobs = 0;

  private readonly handlers = new Map<
    string,
    Map<string, (job: PgmqJob) => Promise<void>>
  >();
  private readonly MAX_RETRIES = 5;
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    @Inject(PGMQ_CONNECTION) private readonly pool: Pool,
  ) {}

  onModuleInit() {
    this.explore();
    this.isRunning = true;
    this.startPolling();
  }

  async onModuleDestroy() {
    this.isRunning = false;
    this.logger.log('Stopping PGMQ worker...');

    const maxRetries = 10;
    let attempts = 0;
    while (this.activeJobs > 0 && attempts < maxRetries) {
      this.logger.debug(
        `Waiting for ${this.activeJobs} active jobs to finish...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    if (this.activeJobs > 0) {
      this.logger.warn(
        `Forced shutdown with ${this.activeJobs} jobs still processing.`,
      );
    } else {
      this.logger.log('PGMQ worker stopped gracefully.');
    }
  }

  private explore() {
    const wrappers = this.discoveryService.getProviders();

    wrappers.forEach((wrapper) => {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) return;

      const queueName = this.reflector.get<string>(
        PGMQ_PROCESSOR_METADATA,
        instance.constructor,
      );
      if (!queueName) return;

      if (!this.handlers.has(queueName)) {
        this.handlers.set(queueName, new Map());
      }
      const queueHandlers = this.handlers.get(queueName)!;

      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (methodName) => {
          const method = instance[methodName];
          const jobName = this.reflector.get<string>(
            PGMQ_PROCESS_METADATA,
            method,
          );

          if (jobName) {
            if (queueHandlers.has(jobName)) {
              throw new Error(
                `PGMQ Error: Job handler for '${jobName}' in queue '${queueName}' is already defined! Check your @Process decorators.`,
              );
            }

            this.logger.log(
              `Mapped {${jobName}} handler for queue: ${queueName}`,
            );
            this.handlers.get(queueName)!.set(jobName, method.bind(instance));
          }
        },
      );
    });
  }

  private async startPolling() {
    await (async () => {
      while (this.isRunning) {
        let processedAny = false;
        const queueNames = Array.from(this.handlers.keys());

        for (const queue of queueNames) {
          const processed = await this.processQueue(queue);
          if (processed) processedAny = true;
        }

        if (!processedAny) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    })();
  }

  private async processQueue(queueName: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM pgmq.read($1, 30, 10)`,
        [queueName],
      );

      if (result.rows.length === 0) return false;

      const jobs = result.rows as PgmqJob[];
      this.activeJobs += jobs.length;

      try {
        await Promise.all(jobs.map((job) => this.handleJob(queueName, job)));
      } finally {
        this.activeJobs -= jobs.length;
      }

      return true;
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `Polling error for queue ${queueName}: ${error.message}`,
      );
      return false;
    }
  }

  private async handleJob(queueName: string, job: PgmqJob) {
    const { jobName } = job.message;
    const handler = this.handlers.get(queueName)?.get(jobName);

    if (job.read_ct > this.MAX_RETRIES + 1) {
      await this.moveToDlq(
        queueName,
        job,
        new Error('Max retries exceeded (Stale Message)'),
      );
      return;
    }

    if (handler) {
      try {
        this.logger.debug(`Processing job: ${jobName} [ID: ${job.msg_id}]`);
        await handler(job);

        // Success -> Archive
        await this.pool.query(`SELECT pgmq.archive($1::text, $2::bigint)`, [
          queueName,
          job.msg_id,
        ]);
      } catch (err) {
        const error = err as Error;
        this.logger.error(`Error processing job ${jobName}: ${error.message}`);

        if (job.read_ct >= this.MAX_RETRIES) {
          this.logger.warn(
            `Job ${job.msg_id} reached max retries. Moving to DLQ with headers.`,
          );

          await this.moveToDlq(queueName, job, error);
        }
      }
    } else {
      this.logger.warn(
        `No handler found for job: ${jobName} in queue: ${queueName}`,
      );
    }
  }

  private async moveToDlq(queueName: string, job: PgmqJob, error: Error) {
    const dlqName = `${queueName}_dlq`;

    const headers = {
      ...job.headers,
      errorType: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      failedAt: new Date().toISOString(),
      retryCount: job.read_ct,
      originalQueue: queueName,
    };

    try {
      await this.pool.query(`SELECT pgmq.create_non_partitioned($1)`, [
        dlqName,
      ]);

      await this.pool.query(
        `SELECT pgmq.send($1::text, $2::jsonb, $3::jsonb)`,
        [dlqName, job.message, headers],
      );

      await this.pool.query(`SELECT pgmq.delete($1::text, $2::bigint)`, [
        queueName,
        job.msg_id,
      ]);

      this.logger.log(
        `Moved job ${job.msg_id} to ${dlqName} with native headers.`,
      );
    } catch (dlqErr) {
      const e = dlqErr as Error;
      this.logger.error(
        `CRITICAL: Failed to move job to DLQ. Reason: ${e.message}`,
      );
    }
  }
}
