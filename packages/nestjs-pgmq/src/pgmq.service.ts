import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as os from 'node:os';
import { randomUUID } from 'crypto';

@Injectable()
export class PgmqQueue {
  constructor(
    private readonly pool: Pool,
    private readonly queueName: string,
  ) {}
  private readonly producerId = `${os.hostname()}-${process.pid}`;

  async add(jobName: string, data: any, customHeaders?: Record<string, any>) {
    const payload = { jobName, data };

    const systemHeaders = {
      messageId: randomUUID(),
      correlationId: customHeaders?.correlationId || randomUUID(),
      producerId: this.producerId,
      appVersion: process.env.npm_package_version || '0.0.1',
      createdAt: new Date().toISOString(),
      ...customHeaders,
    };

    await this.pool.query(
      `SELECT * FROM pgmq.send($1::text, $2::jsonb, $3::jsonb)`,
      [this.queueName, payload, systemHeaders],
    );
  }
}
