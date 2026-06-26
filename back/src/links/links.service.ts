import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Link } from './link.entity';
import { IsNull, Repository } from 'typeorm';
import { CreateLinkDto } from './dtos/create-link.dto';
import { Profile } from 'src/profiles/profile.entity';
import { UpdateLinkDto } from './dtos/update-link.dto';
import { ReorderLinksDto } from './dtos/reorder-link.dto';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import Redis from 'ioredis';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link) private linksRepo: Repository<Link>,
    @InjectRepository(Profile) private profilesRepo: Repository<Profile>,
    @InjectQueue('link-expiry') private expiryQueue: Queue,
    @Inject('REDIS_CLIENT')
    private redisClient: Redis,
    private dataSource: DataSource,
  ) {}

  async createLink(userId: string, dto: CreateLinkDto): Promise<Link> {
    const profile = await this.profilesRepo.findOne({
      where: { user_id: userId },
      relations: ['links'],
    });
    if (!profile) throw new NotFoundException('No profile found');
    const newLink = this.linksRepo.create({ ...dto });
    newLink.profile_id = profile.id;
    newLink.position = profile.links.length + 1;
    await this.linksRepo.save(newLink);
    if (newLink.expires_at) await this.scheduleExpiry(newLink, profile.slug);
    return newLink;
  }

  async updateLink(
    userId: string,
    id: string,
    dto: UpdateLinkDto,
  ): Promise<Link> {
    const link = await this.linksRepo.findOne({
      where: { id: id },
      relations: ['profile'],
    });
    if (!link) throw new NotFoundException('No link found');
    if (link.profile.user_id !== userId)
      throw new ForbiddenException("Cant't modify link without ownership");
    Object.assign(link, dto);
    await this.linksRepo.save(link);
    if (dto.expires_at) {
      await this.cancelExpiry(link.id);
      await this.scheduleExpiry(link, link.profile.slug);
    }
    return link;
  }

  async deleteLink(id: string, userId: string): Promise<{ message: string }> {
    const link = await this.linksRepo.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!link) throw new NotFoundException('No link found');
    if (link.profile.user_id !== userId)
      throw new ForbiddenException("Cant't modify link without ownership");
    await this.cancelExpiry(link.id);
    link.deleted_at = new Date();
    await this.linksRepo.save(link);
    return { message: 'ok' };
  }

  async getLinks(userId: string): Promise<Link[]> {
    const profile = await this.profilesRepo.findOne({
      where: { user_id: userId },
    });
    if (!profile) throw new NotFoundException("Profile doesn't exist");
    const links = await this.linksRepo.find({
      where: { profile_id: profile.id, deleted_at: IsNull() },
      order: { position: 'ASC' },
    });
    return links;
  }

  async reorderLinks(userId: string, dto: ReorderLinksDto): Promise<Link[]> {
    const links = await this.getLinks(userId);
    const validIds = new Set(links.map((l) => l.id));
    for (const item of dto.ids) {
      if (!validIds.has(item.id))
        throw new ForbiddenException('Can only modify own links');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const item of dto.ids) {
        await queryRunner.manager.update(Link, item.id, {
          position: item.position,
        });
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return await this.getLinks(userId);
  }

  private async scheduleExpiry(link: Link, slug: string) {
    if (!link.expires_at) return;
    const delay = link.expires_at.getTime() - Date.now();
    const job = await this.expiryQueue.add(
      { linkId: link.id, slug },
      { delay },
    );
    await this.redisClient.set('link:expiry:job:' + link.id, String(job.id));
  }

  private async cancelExpiry(linkId: string) {
    const jobId = await this.redisClient.get('link:expiry:job:' + linkId);
    if (!jobId) return;
    const job = await this.expiryQueue.getJob(jobId);
    await job?.remove();
    await this.redisClient.del('link:expiry:job:' + linkId);
  }
}
