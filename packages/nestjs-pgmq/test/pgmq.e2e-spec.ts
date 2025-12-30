import { Test, TestingModule } from '@nestjs/testing';
import {INestApplication} from "@nestjs/common";
import {PgmqModule, PgmqQueue, Process, Processor} from "../src";

@Processor('test_queue')
class TestProcessor {
  static processedData: any = null;

  @Process('test_job')
  async handle(job: any) {
    TestProcessor.processedData = job.message.data;
  }
}

describe('Pgmq (e2e)', () => {
  let app: INestApplication;
  let queue: PgmqQueue;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PgmqModule.forRootAsync({
          useFactory: () => ({
            connection: {
              connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
            },
          }),
        }),
        PgmqModule.registerQueue({ name: 'test_queue' }),
      ],
      providers: [TestProcessor],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    queue = moduleFixture.get<PgmqQueue>('PGMQ_QUEUE_test_queue');
  });

  it('should process a job from the queue', async () => {
    const testData = { hello: 'world' };

    await queue.add('test_job', testData);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    expect(TestProcessor.processedData).toEqual(testData);
  }, 10000);

  afterAll(async () => {
    await app.close();
  });
});