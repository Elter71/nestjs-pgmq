# Postgres Message Queue for NestJS (PGMQ)

[![npm](https://img.shields.io/npm/v/nestjs-pgmq.svg)](https://www.npmjs.com/package/nestjs-pgmq)
[![license](https://img.shields.io/npm/l/nestjs-pgmq.svg)](https://www.npmjs.com/package/nestjs-pgmq)

---

## 📖 Introduction

**nestjs-pgmq** is a robust **PostgreSQL Message Queue (PGMQ)** integration for **NestJS**.
It allows you to build **distributed background processing systems** using your existing PostgreSQL database — without introducing additional infrastructure like Redis or RabbitMQ.

The developer experience is heavily inspired by **@nestjs/bull**, making migration simple and intuitive.

---

## ✨ Key Features

* 🏗 **Zero Infrastructure Overhead** – Uses your existing PostgreSQL instance
* 🦄 **Bull-like API** – Familiar decorators: `@Processor`, `@Process`, `@InjectQueue`
* 🛡 **Transactional Safety** – Supports the Transactional Outbox pattern (WIP)
* ⚡ **High Performance** – Uses `SKIP LOCKED` for safe concurrent processing
* 🔍 **Observability** – Automatic `correlationId`, `producerId`, timestamps
* 💀 **Dead Letter Queues (DLQ)** – Failed jobs stored with full stack traces
* 🛑 **Graceful Shutdown** – No jobs lost during deploys or restarts

---

## 🔌 Prerequisites

This library requires **PostgreSQL** with the **pgmq extension** installed.

### Using Docker (Recommended)

```bash
docker run -d \
  --name pgmq \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  ghcr.io/pgmq/pg18-pgmq:v1.7.0
```

### Manual Installation

```sql
CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;
```

---

## 📦 Installation

```bash
pnpm add nestjs-pgmq pg

# or

npm install nestjs-pgmq pg
```

---

## 🚀 Quick Start

### 1️⃣ Register the Module

Import `PgmqModule` in your root module and configure the database connection.

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { PgmqModule } from 'nestjs-pgmq';

@Module({
  imports: [
    PgmqModule.forRootAsync({
      useFactory: () => ({
        connectionString: 'postgres://postgres:postgres@localhost:5432/db',
      }),
    }),

    PgmqModule.registerQueue({
      name: 'notifications',
    }),
  ],
})
export class AppModule {}
```

---

### 2️⃣ Create a Processor (Consumer)

Define a processor using `@Processor` and handle jobs using `@Process`.

```ts
// src/notifications.processor.ts
import { Processor, Process, PgmqJob } from 'nestjs-pgmq';

@Processor('notifications')
export class NotificationsProcessor {

  @Process('send-email')
  async handleEmail(job: PgmqJob<{ email: string; body: string }>) {
    console.log(`Sending email to ${job.data.email}...`);

    // If this throws, the job is retried
    // On success, the job is archived
  }
}
```

---

### 3️⃣ Inject Queue & Add Jobs (Producer)

```ts
// src/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue, PgmqQueue } from 'nestjs-pgmq';

@Injectable()
export class UsersService {
  constructor(
    @InjectQueue('notifications')
    private readonly queue: PgmqQueue,
  ) {}

  async registerUser(email: string) {
    await this.queue.add('send-email', {
      email,
      body: 'Welcome to our platform!',
    });
  }
}
```

---

## 🛡 Transactional Safety (Outbox Pattern)

Achieve **full data consistency** by committing both your domain data and queue job in **a single database transaction**.

If the transaction rolls back, the job is never scheduled.

**Supported ORMs:** TypeORM, Drizzle (via adapter)

### Example (TypeORM)

```ts
await this.dataSource.transaction(async (manager) => {
  const user = await manager.save(User, { email: 'test@example.com' });

  await this.queue.add(
    'send-welcome',
    { userId: user.id },
    { connection: manager } // Atomicity guaranteed
  );
});
```

👉 See the `examples/` folder for full implementations with **Drizzle ORM** and **TypeORM**.

---

## ⚙️ Configuration & Features

### 🔍 Metadata & Observability

Every message is automatically enriched with metadata headers:

* `correlationId` – unique trace ID (UUID)
* `messageId` – unique message ID
* `producerId` – hostname + PID
* `appVersion` – from `package.json`
* `createdAt` – timestamp

You can override headers if needed:

```ts
await this.queue.add(
  'process-order',
  { orderId: 123 },
  { correlationId: 'req-abc-123' }
);
```

---

### 💀 Error Handling & Dead Letter Queue (DLQ)

The module uses an **Envelope Pattern** for error handling.

**Flow:**

1. Job fails → retried after visibility timeout (default: 30s)
2. Exceeds max retries (default: 5)
3. Moved to `<queue_name>_dlq`

**DLQ Message Example:**

```json
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

---

### ⚡ Concurrency

Workers use **intelligent polling with `SKIP LOCKED`** and batch processing to maximize throughput while maintaining safety.

---

## 🤝 Contributing

This project is a **pnpm monorepo**.

```bash
# install deps
pnpm install

# run example
cd examples/basic-app
pnpm start:dev

# watch library changes
cd packages/nestjs-pgmq
pnpm build --watch
```

---

## ✨ Contributors

<a href="https://github.com/elter71/nestjs-pgmq/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=elter71/nestjs-pgmq" />
</a>

---

## 📝 License

MIT

