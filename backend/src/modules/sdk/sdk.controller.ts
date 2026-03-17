import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { SdkService } from './sdk.service';

@Controller('sdk')
export class SdkController {
  constructor(private readonly sdkService: SdkService) {}

  @Get('flags/:projectKey/:environmentKey/:flagKey')
  async evaluateFlag(
    @Param('projectKey') projectKey: string,
    @Param('environmentKey') environmentKey: string,
    @Param('flagKey') flagKey: string,
    @Query('brandKey') brandKey?: string,
    @Headers('origin') origin?: string,
  ) {
    return this.sdkService.evaluateFlag(
      projectKey,
      environmentKey,
      flagKey,
      brandKey,
    );
  }
}
