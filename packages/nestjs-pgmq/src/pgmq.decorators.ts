import { Inject, SetMetadata } from '@nestjs/common';
import {
  PGMQ_PROCESSOR_METADATA,
  PGMQ_PROCESS_METADATA,
} from './pgmq.constants';


export const Processor = (queueName: string) => SetMetadata(PGMQ_PROCESSOR_METADATA, queueName);

export const Process = (jobName: string) => SetMetadata(PGMQ_PROCESS_METADATA, jobName);

export const getQueueToken = (name: string) => `PGMQ_QUEUE_${name}`;
export const InjectQueue = (name: string) => Inject(getQueueToken(name));