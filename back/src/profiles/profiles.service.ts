import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './profile.entity';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import Redis from 'ioredis';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile) private profilesRepo: Repository<Profile>,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}
  async me(userId: string): Promise<Profile> {
    const profile = await this.profilesRepo.findOne({
      where: { user_id: userId },
    });
    if (!profile) throw new NotFoundException('No profile found');
    return profile;
  }

  async updateProfile(dto: UpdateProfileDto, userId: string): Promise<Profile> {
    const profile = await this.me(userId);
    if (dto.slug) {
      const existing = await this.profilesRepo.findOne({
        where: { slug: dto.slug },
      });
      if (existing && existing.user_id !== userId)
        throw new ConflictException('Slug already taken');
    }
    await this.redisClient.del(`profile:${profile.slug}`);
    Object.assign(profile, dto);
    return await this.profilesRepo.save(profile);
  }

  async getBySlug(slug: string): Promise<Profile> {
    const cached = await this.redisClient.get(`profile:${slug}`);
    if (cached) return JSON.parse(cached) as Profile;
    const profile = await this.profilesRepo.findOne({
      where: { slug: slug },
      relations: ['links'],
    });
    if (!profile) throw new NotFoundException('No profile found');
    profile.links = profile.links.filter((l) => l.is_active && !l.deleted_at);
    await this.redisClient.set(
      `profile:${slug}`,
      JSON.stringify(profile),
      'EX',
      30,
    );
    return profile;
  }
}
