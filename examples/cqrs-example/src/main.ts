import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           CQRS Example with Per-Handler Queues                   ║
╠══════════════════════════════════════════════════════════════════╣
║  Architecture: Each handler has its own dedicated queue          ║
║                                                                  ║
║  Queues created:                                                 ║
║  - update-hero-stats  → UpdateHeroStatsHandler                   ║
║  - notify-guild       → NotifyGuildHandler                       ║
║  - reward-hero        → RewardHeroHandler (fails 2x for demo)    ║
║                                                                  ║
║  Key benefit: If one handler fails, only that handler retries.   ║
║  Other handlers complete independently on their own queues.      ║
╠══════════════════════════════════════════════════════════════════╣
║  Try it:                                                         ║
║  curl -X POST http://localhost:3000/heroes/1/kill \\              ║
║       -H "Content-Type: application/json" \\                      ║
║       -d '{"dragonId": "dragon-123"}'                            ║
║                                                                  ║
║  Watch the logs to see:                                          ║
║  - UpdateHeroStatsHandler: succeeds immediately (own queue)      ║
║  - NotifyGuildHandler: succeeds immediately (own queue)          ║
║  - RewardHeroHandler: fails 2x, succeeds 3rd (isolated retry)    ║
╚══════════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
