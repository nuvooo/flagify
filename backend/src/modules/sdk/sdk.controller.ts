import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { SdkService } from './sdk.service';

@Controller('sdk')
export class SdkController {
  constructor(private readonly sdkService: SdkService) {}

  private resolveApiKey(queryApiKey?: string, authHeader?: string): string {
    if (queryApiKey) return queryApiKey;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
    return '';
  }

  private resolveBrandKey(brandKey?: string, tenantId?: string): string | undefined {
    return brandKey || tenantId;
  }

  @Get('flags/:projectKey/:environmentKey/:flagKey')
  async evaluateFlag(
    @Param('projectKey') projectKey: string,
    @Param('environmentKey') environmentKey: string,
    @Param('flagKey') flagKey: string,
    @Query('apiKey') queryApiKey?: string,
    @Query('brandKey') brandKey?: string,
    @Query('tenantId') tenantId?: string,
    @Headers('origin') origin?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const apiKey = this.resolveApiKey(queryApiKey, authHeader);
    const resolvedBrandKey = this.resolveBrandKey(brandKey, tenantId);
    return this.sdkService.evaluateFlag(
      projectKey,
      environmentKey,
      flagKey,
      apiKey,
      resolvedBrandKey,
      origin,
    );
  }

  @Get('flags/:projectKey/:environmentKey')
  async getAllFlags(
    @Param('projectKey') projectKey: string,
    @Param('environmentKey') environmentKey: string,
    @Query('apiKey') queryApiKey?: string,
    @Query('brandKey') brandKey?: string,
    @Query('tenantId') tenantId?: string,
    @Headers('origin') origin?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const apiKey = this.resolveApiKey(queryApiKey, authHeader);
    const resolvedBrandKey = this.resolveBrandKey(brandKey, tenantId);
    return this.sdkService.getAllFlags(
      projectKey,
      environmentKey,
      apiKey,
      resolvedBrandKey,
      origin,
    );
  }
}
