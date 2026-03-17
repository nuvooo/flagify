import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthGuard } from '../../shared/auth.guard';

@Controller('api-keys')
@UseGuards(AuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get('my')
  async findMyKeys(@Req() req: any) {
    const keys = await this.apiKeysService.findByUser(req.user.userId);
    return keys;
  }

  @Post('organization/:orgId')
  async create(
    @Param('orgId') orgId: string,
    @Body() body: { name: string; type?: string; expiresInDays?: number },
    @Req() req: any,
  ) {
    const key = await this.apiKeysService.create(orgId, req.user.userId, body);
    return { apiKey: key };
  }

  @Delete(':keyId')
  async delete(@Param('keyId') keyId: string) {
    await this.apiKeysService.delete(keyId);
    return { success: true };
  }
}
