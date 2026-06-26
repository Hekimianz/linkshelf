import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from './link.entity';
import { Profile } from 'src/profiles/profile.entity';
import { BullModule } from '@nestjs/bull';
import { LinkExpiryProcessor } from './link-expiry.processor';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Link, Profile]),
    BullModule.registerQueue({ name: 'link-expiry' }),
    RedisModule,
  ],
  providers: [LinksService, LinkExpiryProcessor],
  controllers: [LinksController],
})
export class LinksModule {}
