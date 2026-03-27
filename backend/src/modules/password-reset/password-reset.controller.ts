import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import type { PasswordResetService } from './password-reset.service'

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly service: PasswordResetService) {}

  @Post('request')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  async request(@Body() body: { email: string }) {
    await this.service.requestReset(body.email);
    return { success: true };
  }

  @Post('verify')
  async verify(@Body() body: { token: string; newPassword: string }) {
    await this.service.resetPassword(body.token, body.newPassword);
    return { success: true };
  }
}
