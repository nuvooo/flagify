import { Controller, Get, Param, Query, Headers, ForbiddenException } from '@nestjs/common';
import { SdkService } from './sdk.service';

@Controller('sdk')
export class SdkController {
  constructor(private readonly sdkService: SdkService) {}

  @Get('flags/:projectKey/:environmentKey/:flagKey')
  async evaluateFlag(
    @Param('projectKey') projectKey: string,
    @Param('environmentKey') environmentKey: string,
    @Param('flagKey') flagKey: string,
    @Query('apiKey') apiKey: string,
    @Query('brandKey') brandKey?: string,
    @Headers('origin') origin?: string,
  ) {
    // Validate API key and check origin
    const result = await this.sdkService.evaluateFlag(
      projectKey,
      environmentKey,
      flagKey,
      apiKey,
      brandKey,
      origin,
    );
    return result;
  }

  @Get('flags/:projectKey/:environmentKey')
  async getAllFlags(
    @Param('projectKey') projectKey: string,
    @Param('environmentKey') environmentKey: string,
    @Query('apiKey') apiKey: string,
    @Query('brandKey') brandKey?: string,
    @Headers('origin') origin?: string,
  ) {
    // Return all flags for the project/environment
    const result = await this.sdkService.getAllFlags(
      projectKey,
      environmentKey,
      apiKey,
      brandKey,
      origin,
    );
    return result;
  }
}
