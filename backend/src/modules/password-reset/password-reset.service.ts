import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import type { PrismaService } from '../../shared/prisma.service'
import type { MailService } from '../mail/mail.service'

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly config: ConfigService
  ) {}

  async requestReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) {
      return
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiryHours = this.config.get<number>('RESET_TOKEN_EXPIRY_HOURS', 1)
    const expires = new Date()
    expires.setHours(expires.getHours() + expiryHours)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expires,
      },
    })

    this.logger.debug(`Password reset requested for ${email}`)

    try {
      await this.mailService.sendPasswordResetEmail(email, token)
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`)
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    })

    if (!user) {
      throw new NotFoundException('Invalid or expired token')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })
  }
}
