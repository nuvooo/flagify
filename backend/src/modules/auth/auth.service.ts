import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    this.logger.log(`Login attempt for: ${email}`);
    
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`User not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User found, checking password...`);
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      this.logger.warn(`Invalid password for: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Password valid, generating token...`);

    // Get user's organization
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId: user.id },
    });

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        organizationId: membership?.organizationId 
      },
      this.config.get('JWT_SECRET') || 'fallback-secret',
      { expiresIn: '7d' },
    );

    return { 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: `${user.firstName} ${user.lastName}` 
      } 
    };
  }

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';
    
    // Create user
    const user = await this.prisma.user.create({
      data: { 
        email, 
        password: passwordHash, 
        firstName, 
        lastName 
      },
    });

    // No automatic organization creation - user must create one manually

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      this.config.get('JWT_SECRET') || 'fallback-secret',
      { expiresIn: '7d' },
    );

    return { 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name 
      } 
    };
  }
}
