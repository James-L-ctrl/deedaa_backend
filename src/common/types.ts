import { Request } from 'express';
import { Role } from '../../generated/prisma/client';

/** Auth user object attached to the request by JwtStrategy */
export interface AuthUser {
  id: string;
  role?: Role;
}

/** Express request with an authenticated user */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
