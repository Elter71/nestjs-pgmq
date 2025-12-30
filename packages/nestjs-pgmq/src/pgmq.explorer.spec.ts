import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PgmqExplorer } from './pgmq.explorer';
import { PGMQ_CONNECTION } from './pgmq.constants';

describe('PgmqExplorer', () => {
  let explorer: PgmqExplorer;
  let discoveryService: DiscoveryService;

  const mockPool = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PgmqExplorer,
        DiscoveryService,
        MetadataScanner,
        Reflector,
        { provide: PGMQ_CONNECTION, useValue: mockPool },
      ],
    }).compile();

    explorer = module.get<PgmqExplorer>(PgmqExplorer);
    discoveryService = module.get<DiscoveryService>(DiscoveryService);
  });

  it('should be defined', () => {
    expect(explorer).toBeDefined();
  });

  it('should explore and find processors', () => {
    const mockInstance = {
      handleTest: jest.fn(),
    };

    jest.spyOn(discoveryService, 'getProviders').mockReturnValue([
      {
        instance: mockInstance,
        metatype: mockInstance.constructor,
      } as any,
    ]);

    (explorer as any).explore();
    expect(discoveryService.getProviders).toHaveBeenCalled();
  });
});