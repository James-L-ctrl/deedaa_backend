import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

const COOKIE_NAME = 'deedaa_access_token';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, res: Response) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
      },
    });

    this.setAuthCookie(res, { sub: user.id, role: user.role });
    return this.publicUser(user);
  }

  async login(dto: LoginDto, res: Response) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const dummyHash =
      '$2a$12$C6UzMDM.H6dfI/f/IKcEe.O8YkJ9u8YQeS5mQqY3xYl6mYfGQw6a';
    const hash = user?.passwordHash ?? dummyHash;
    const matches = await bcrypt.compare(dto.password, hash);

    if (!user || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.setAuthCookie(res, { sub: user.id, role: user.role });
    return this.publicUser(user);
  }

  logout(res: Response) {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite: this.config.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      path: '/',
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.publicUser(user);
  }

  private setAuthCookie(res: Response, payload: JwtPayload) {
    const token = this.jwt.sign(payload);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: this.config.get('NODE_ENV') === 'production' ? 'none' : 'lax',
      secure: this.config.get('NODE_ENV') === 'production',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    });
  }

  private publicUser(user: {
    id: string;
    email: string;
    name: string;
    role: JwtPayload['role'];
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
