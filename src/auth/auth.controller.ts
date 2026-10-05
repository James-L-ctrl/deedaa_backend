import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, res);
  }

  @Post('login')
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: { id: string } }) {
    return this.authService.me(req.user.id);
  }
}
