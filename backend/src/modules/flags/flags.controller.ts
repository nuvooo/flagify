import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { FlagsService } from './flags.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagValueDto } from './dto/update-flag-value.dto';
import { AuthGuard } from '../../shared/auth.guard';

@Controller('feature-flags')
@UseGuards(AuthGuard)
export class FlagsController {
  constructor(private readonly flagsService: FlagsService) {}

  @Get()
  async findAll(@Req() req: any, @Query('projectId') projectId?: string) {
    const flags = await this.flagsService.findAll(req.user.userId, projectId);
    return { featureFlags: flags };
  }

  @Get('project/:projectId')
  async findByProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    const flags = await this.flagsService.findAll(req.user.userId, projectId);
    return { featureFlags: flags };
  }

  @Post('project/:projectId')
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateFlagDto,
    @Req() req: any,
  ) {
    return this.flagsService.create(projectId, req.user.userId, dto);
  }

  @Patch(':flagId/environments/:envId/value')
  async updateValue(
    @Param('flagId') flagId: string,
    @Param('envId') envId: string,
    @Body() dto: UpdateFlagValueDto,
  ) {
    return this.flagsService.updateValue(flagId, envId, dto);
  }

  @Delete(':flagId')
  async delete(@Param('flagId') flagId: string) {
    await this.flagsService.delete(flagId);
    return { success: true };
  }
}
