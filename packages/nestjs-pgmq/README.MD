Postgres Message Queue for NestJS.
---

[![npm](https://img.shields.io/npm/v/nestjs-pgmq.svg)](https://www.npmjs.com/package/nestjs-pgmq)
[![licence](https://img.shields.io/npm/l/nestjs-pgmq.svg)](https://www.npmjs.com/package/nestjs-pgmq)
## 📖 Introduction
`nestjs-pgmq` is a robust module that integrates PGMQ (Postgres Message Queue) into the NestJS ecosystem. It allows you to
build distributed, background processing systems using your existing PostgreSQL database, eliminating the need for
additional infrastructure like Redis.

It provides a Developer Experience (DX) heavily inspired by `@nestjs/bull`, making migration easy.

Key Features

* 🏗 Zero Infrastructure Overhead: Uses your existing Postgres instance.

* 🦄 Bull-like API: Familiar decorators @Processor, @Process, and @InjectQueue.

* 🛡 Transactional Safety: Support for Transactional Outbox pattern (WIP).

* ⚡ High Performance: Uses SKIP LOCKED for concurrent job processing.

* 🔍 Observability: Automatic injection of correlationId, producerId, and timestamps.

* 💀 Dead Letter Queues (DLQ): Automatic handling of failed jobs with full stack traces.

* 🛑 Graceful Shutdown: Ensures no jobs are lost during deployment/restart.
---
## 🔌 Prerequisites
This library requires a PostgreSQL database with the pgmq extension installed.

Using Docker (Recommended):

```Bash
docker run -d --name pgmq -p 5432:5432 -e POSTGRES_PASSWORD=postgres ghcr.io/pgmq/pg18-pgmq:v1.7.0
```
Manual Installation:

```SQL
CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;
```
📦 Installation
```Bash
pnpm add nestjs-pgmq pg

# or

npm install nestjs-pgmq pg
```
## 🚀 Quick Start

### 1. Register the Module

Import PgmqModule in your root AppModule. You can configure the connection asynchronously.

```TypeScript

// src/app.module.ts
import {Module} from '@nestjs/common';
import {PgmqModule} from 'nestjs-pgmq';

@Module({
  imports: [
    // 1. Configure the global connection
    PgmqModule.forRootAsync({
      useFactory: () => ({
        connectionString: 'postgres://postgres:postgres@localhost:5432/db',
      }),
    }),

    // 2. Register a queue
    PgmqModule.registerQueue({
      name: 'notifications',
    }),
  ],
})
export class AppModule {
}
```

### 2. Create a Processor (Consumer)

Define a class to handle jobs. Use `@Processor` for the queue name and `@Process` for specific job names.

```TypeScript
// src/notifications.processor.ts
import {Processor, Process} from 'nestjs-pgmq';
import {Job} from 'nestjs-pgmq';

@Processor('notifications')
export class NotificationsProcessor {

  @Process('send-email')
  async handleEmail(job: Job<{ email: string; body: string }>) {
    console.log(`Sending email to ${job.data.email}...`);

    // Perform your logic here.
    // If it throws an error, the job will be retried.
    // If it succeeds, the job is archived.

  }
}
```

### 3. Inject Queue & Add Jobs (Producer)

Inject the queue into your service to dispatch jobs.

```TypeScript
// src/users.service.ts
import {Injectable} from '@nestjs/common';
import {InjectQueue, PgmqQueue} from 'nestjs-pgmq';

@Injectable()
export class UsersService {
  constructor(@InjectQueue('notifications') private readonly queue: PgmqQueue) {
  }

  async registerUser(email: string) {
    // Add a job to the queue
    await this.queue.add('send-email', {
      email,
      body: 'Welcome to our platform!',
    });
  }
}
```

## ⚙️ Configuration & Features
### Metadata & Observability (Automatic Headers)

Every message sent via nestjs-pgmq is automatically enriched with metadata headers to help with debugging and tracing in
distributed systems.

You don't need to do anything; the library automatically adds:

* correlationId: Unique Trace ID (UUID).

* messageId: Unique Message ID.

* producerId: Hostname and PID of the sender.

* appVersion: Application version from package.json.

* createdAt: Timestamp.

You can also pass custom headers:

```TypeScript
    await this.queue.add(
      'process-order',
      {orderId: 123},
      {correlationId: 'req-abc-123'} // Override correlationId to match HTTP Request
    );
```

### Error Handling & Dead Letter Queue (DLQ)

The module implements a robust "Envelope Pattern" for error handling.

1. Retries: If your processor throws an error, the job remains in the queue and becomes visible again after the Visibility
Timeout (default: 30s).

2. Max Retries: If a job fails more than 5 times (configurable), it is moved to a DLQ.

3. DLQ Format: The failed job is moved to a queue named <queue_name>_dlq. The payload is wrapped in an envelope containing
the Exception Message and Stack Trace.

**Example DLQ Message:**

```JSON
{
  "headers": {
    "errorType": "Error",
    "errorMessage": "Connection timeout",
    "stackTrace": "Error: Connection timeout\n at EmailService.send...",
    "retryCount": 5,
    "failedAt": "2023-10-25T12:00:00Z",
    "originalQueue": "notifications"
  },
  "body": {
    "jobName": "send-email",
    "data": {
      "email": "user@example.com"
    }
  }
}
```

#### Concurrency

The worker uses intelligent polling with SKIP LOCKED. By default, it processes jobs in batches to maximize throughput
while ensuring safety.

## 🤝 Contributing
This project is a Monorepo managed with pnpm.

1. Clone the repo.

2. Install dependencies: pnpm install.

3. Run the example app:

```Bash
cd examples/basic-app
pnpm start:dev
```

4. Watch library changes:

```Bash
cd packages/nestjs-pgmq
pnpm build --watch
```

## ✨ Contributors

Thanks goes to these incredible people:

<a href="https://github.com/elter71/nestjs-pgmq/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=elter71/nestjs-pgmq" />
</a>

## 📝 License
This project is MIT licensed.