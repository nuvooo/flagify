import { Controller, Get, Post, Param, Query, Headers, Body } from '@nestjs/common';
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

  // ==================== EXPERIMENTS ====================

  @Get('experiments/:projectKey/:environmentKey/:experimentKey/variant')
  async getExperimentVariant(
    @Param('projectKey') projectKey: string,
    @Param('environmentKey') environmentKey: string,
    @Param('experimentKey') experimentKey: string,
    @Query('userId') userId: string,
    @Query('apiKey') queryApiKey?: string,
    @Headers('origin') origin?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const apiKey = this.resolveApiKey(queryApiKey, authHeader);
    return this.sdkService.getExperimentVariant(
      projectKey,
      environmentKey,
      experimentKey,
      userId,
      apiKey,
      origin,
    );
  }

  @Post('experiments/:projectKey/:experimentKey/events')
  async trackExperimentEvent(
    @Param('projectKey') projectKey: string,
    @Param('experimentKey') experimentKey: string,
    @Body() body: {
      eventType: string;
      userId: string;
      value?: number;
      metadata?: Record<string, any>;
    }
  ) {
    await this.sdkService.trackExperimentEvent(
      projectKey,
      experimentKey,
      body.eventType,
      body.userId,
      body.value,
      body.metadata,
    );
    return { success: true };
  }
}
