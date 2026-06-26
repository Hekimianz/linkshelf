import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LinksService } from './links.service';
import { Link } from './link.entity';
import { CreateLinkDto } from './dtos/create-link.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateLinkDto } from './dtos/update-link.dto';
import { ReorderLinksDto } from './dtos/reorder-link.dto';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createLink(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateLinkDto,
  ): Promise<Link> {
    return await this.linksService.createLink(req.user.userId, dto);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async updateLink(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
    @Body() dto: UpdateLinkDto,
  ): Promise<Link> {
    return await this.linksService.updateLink(req.user.userId, id, dto);
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deleteLink(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ): Promise<{ message: string }> {
    return await this.linksService.deleteLink(id, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getLinks(@Req() req: { user: { userId: string } }): Promise<Link[]> {
    return await this.linksService.getLinks(req.user.userId);
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard)
  async reorderLinks(
    @Req() req: { user: { userId: string } },
    @Body() dto: ReorderLinksDto,
  ): Promise<Link[]> {
    return await this.linksService.reorderLinks(req.user.userId, dto);
  }
}
