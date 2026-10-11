import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { OrdersService } from './orders.service';
import { PaymentMethod } from '../payment-method.enum';

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

  // Webhook endpoint for GCash payment notifications
  @Post('gcash/webhook')
  async handleGcashWebhook(
    @Body() body: { orderId: string; gcashReferenceId: string; status: string },
  ) {
    // Map GCash status to our internal status
    let internalStatus;
    switch (body.status.toLowerCase()) {
      case 'completed':
      case 'paid':
        internalStatus = 'GCASH_COMPLETED';
        break;
      case 'failed':
      case 'cancelled':
      case 'expired':
        internalStatus = 'GCASH_FAILED';
        break;
      default:
        internalStatus = 'GCASH_PENDING';
    }

    return this.ordersService.updateGcashPaymentStatus(
      body.orderId,
      body.gcashReferenceId,
      internalStatus as 'GCASH_COMPLETED' | 'GCASH_FAILED' | 'GCASH_CANCELLED',
    );
  }

  // Endpoint for updating COD status (would be called by admin/delivery personnel)
  @Post(':id/cod/status')
  @UseGuards(JwtAuthGuard)
  async updateCodStatus(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @Body() body: { status: string; codReferenceId?: string },
  ) {
    // In a real app, you'd check if the user is admin/delivery personnel
    const allowedStatuses = ['COD_CONFIRMED', 'COD_DELIVERED', 'COD_CANCELLED'];
    if (!allowedStatuses.includes(body.status)) {
      throw new Error('Invalid COD status');
    }

    return this.ordersService.updateCodStatus(
      orderId,
      body.status as 'COD_CONFIRMED' | 'COD_DELIVERED' | 'COD_CANCELLED',
      body.codReferenceId,
    );
  }
}
