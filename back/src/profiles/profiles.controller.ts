import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Profile } from './profile.entity';
import { UpdateProfileDto } from './dtos/update-profile.dto';

@Controller('')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('profiles/me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: { user: { userId: string } }): Promise<Profile> {
    return await this.profilesService.me(req.user.userId);
  }

  @Get('/p/:slug')
  async getBySlug(@Param('slug') slug: string): Promise<Profile> {
    return await this.profilesService.getBySlug(slug);
  }

  @Patch('profiles/me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: { user: { userId: string } },
  ): Promise<Profile> {
    return await this.profilesService.updateProfile(dto, req.user.userId);
  }
}
