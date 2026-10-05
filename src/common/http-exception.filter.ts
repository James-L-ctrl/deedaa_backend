import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else if (typeof payload === 'object' && payload && 'message' in payload) {
        const raw = (payload as { message: string | string[] }).message;
        message = Array.isArray(raw) ? raw[0] : raw;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'That record already exists';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      }
    } else {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
