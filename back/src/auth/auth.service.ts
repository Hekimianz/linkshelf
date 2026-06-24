import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Profile } from '../profiles/profile.entity';
import { User } from '../users/user.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Profile) private profileRepo: Repository<Profile>,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
    private dataSource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async logout(userId: string): Promise<void> {
    await this.redisClient.del(`refresh:${userId}`);
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Wrong credentials');
    const validPass = await bcrypt.compare(dto.password, user.password_hash);
    if (!validPass) throw new UnauthorizedException('Wrong credentials');
    return this.generateTokens(user.id);
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('User with email already exists');
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        password_hash: hashedPassword,
      });
      await manager.save(user);
      const profile = manager.create(Profile, {
        user_id: user.id,
        slug: dto.email.split('@')[0].toLowerCase(),
        display_name: dto.email.split('@')[0],
      });
      await manager.save(profile);
      return user;
    });
    return this.generateTokens(user.id);
  }

  private async generateTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
    await this.redisClient.set(
      `refresh:${userId}`,
      refreshToken,
      'EX',
      60 * 60 * 24 * 7,
    );
    return { accessToken, refreshToken };
  }
}
