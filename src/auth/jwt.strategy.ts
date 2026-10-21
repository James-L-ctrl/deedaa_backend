import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Role } from '../../generated/prisma/client';
import { AuthUser } from '../common/types';

export type JwtPayload = {
  sub: string;
  role: Role;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null =>
          (request?.cookies?.deedaa_access_token as string | undefined) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { id: payload.sub, role: payload.role } as AuthUser;
  }
}
