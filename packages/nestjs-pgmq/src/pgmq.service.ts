import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as os from 'node:os';
import { randomUUID } from 'crypto';
import { PgmqAddOptions } from './pgmq.interfaces';

@Injectable()
export class PgmqQueue {
  constructor(
    private readonly pool: Pool,
    private readonly queueName: string,
  ) {}
  private readonly producerId = `${os.hostname()}-${process.pid}`;

  async add(jobName: string, data: any, options?: PgmqAddOptions) {
    const payload = { jobName, data };
    const customHeaders = options?.headers;
    const runner = options?.connection || this.pool;
    const systemHeaders = {
      messageId: randomUUID(),
      correlationId: customHeaders?.correlationId || randomUUID(),
      producerId: this.producerId,
      appVersion: process.env.npm_package_version || '0.0.1',
      createdAt: new Date().toISOString(),
      ...customHeaders,
    };
    const delay = options?.delay || 0;

    await runner.query(
      `SELECT * FROM pgmq.send($1::text, $2::jsonb, $3::jsonb, $4::int)`,
      [this.queueName, payload, systemHeaders, delay],
    );
  }
}
