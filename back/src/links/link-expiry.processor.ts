import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from './link.entity';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import type { Job } from 'bull';

@Processor('link-expiry')
export class LinkExpiryProcessor {
  constructor(
    @InjectRepository(Link) private linkRepo: Repository<Link>,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  @Process()
  async handle(job: Job<{ linkId: string; slug: string }>) {
    await this.linkRepo.update(job.data.linkId, { is_active: false });
    await this.redisClient.del(`profile:${job.data.slug}`);
  }
}
