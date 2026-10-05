import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class OriginMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const allowed = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    const origin = req.headers.origin;
    if (!origin) {
      return next();
    }

    if (!allowed.includes(origin)) {
      res.status(403).json({ statusCode: 403, message: 'Origin is not allowed' });
      return;
    }

    return next();
  }
}
