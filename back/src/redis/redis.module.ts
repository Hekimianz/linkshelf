import { Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      useFactory: () => new Redis({ host: 'localhost', port: 6379 }),
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
