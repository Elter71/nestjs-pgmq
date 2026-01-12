import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║         CQRS Example with @Transactional() Decorator                  ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Features:                                                            ║
║  - @Transactional() decorator for automatic transaction management    ║
║  - EventBus auto-detects transaction context (no manual passing)      ║
║  - Each handler has its own queue (isolated retries)                  ║
║                                                                       ║
║  How it works:                                                        ║
║    @Transactional()                                                   ║
║    async killDragon(heroId: number, dragonId: string) {               ║
║      await this.heroRepo.save(hero);      // uses transaction         ║
║      await this.eventBus.publish(event);  // uses same transaction!   ║
║    }                                                                  ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Try it:                                                              ║
║                                                                       ║
║  1. Create a hero:                                                    ║
║     curl -X POST http://localhost:3000/heroes \\                       ║
║          -H "Content-Type: application/json" \\                        ║
║          -d '{"name": "Sir Lancelot"}'                                ║
║                                                                       ║
║  2. Kill a dragon (success - transaction commits):                    ║
║     curl -X POST http://localhost:3000/heroes/1/kill \\                ║
║          -H "Content-Type: application/json" \\                        ║
║          -d '{"dragonId": "dragon-123"}'                              ║
║                                                                       ║
║  3. Kill a dragon (failure - transaction rolls back, NO events):      ║
║     curl -X POST http://localhost:3000/heroes/1/kill \\                ║
║          -H "Content-Type: application/json" \\                        ║
║          -d '{"dragonId": "fail-dragon"}'                             ║
║                                                                       ║
║  4. Check hero stats (kills should NOT increase after failed tx):     ║
║     curl http://localhost:3000/heroes/1                               ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
