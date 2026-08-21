import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponse, JwtPayload, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...this.signTokens({ sub: admin.id, email: admin.email, role: admin.role }),
      user: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Wrong token type');
    }

    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Account inactive');
    }

    return {
      ...this.signTokens({ sub: admin.id, email: admin.email, role: admin.role }),
      user: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
    };
  }

  private signTokens(base: Omit<JwtPayload, 'type'>): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwt.sign(
      { ...base, type: 'access' } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as any,
      },
    );
    const refreshToken = this.jwt.sign(
      { ...base, type: 'refresh' } satisfies JwtPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
      },
    );
    return { accessToken, refreshToken };
  }
}
