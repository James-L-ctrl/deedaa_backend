import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Req() req: Request & { user: { id: string } }) {
    return this.ordersService.listForUser(req.user.id);
  }

  @Get(':id')
  getOne(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.getForUser(req.user.id, id);
  }

  @Post()
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  checkout(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CheckoutDto,
  ) {
    return this.ordersService.checkout(req.user.id, dto);
  }
}
