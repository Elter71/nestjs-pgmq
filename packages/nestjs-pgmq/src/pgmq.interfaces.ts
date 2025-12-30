import { ModuleMetadata } from '@nestjs/common';
import { PoolConfig } from 'pg';

export interface PgmqModuleOptions {
  connection: PoolConfig;
}

export interface PgmqModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  useFactory: (
    ...args: any[]
  ) => Promise<PgmqModuleOptions> | PgmqModuleOptions;
  inject?: any[];
}

export interface PgmqQueueOptions {
  name: string;
}

export interface PgmqJob<T = any> {
  msg_id: number;
  read_ct: number;
  enqueued_at: Date;
  vt: Date;
  message: {
    jobName: string;
    data: T;
  };
  headers: PgmqJobHeaders;
}

export interface PgmqJobHeaders {
  messageId: string;
  correlationId: string;
  producerId: string;
  appVersion: string;
  createdAt: string;
  [key: string]: any;
}

export interface PgmqAddOptions {
  delay?: number;
  headers?: Record<string, any>;
  connection?: PgConnection;
}

export interface PgConnection {
  query(text: string, params?: any[]): Promise<any>;
}
