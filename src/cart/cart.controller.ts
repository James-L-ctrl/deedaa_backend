import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { MergeCartBodyDto } from './dto/merge-cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: Request & { user: { id: string } }) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  addItem(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Patch('items/:productId')
  updateItem(
    @Req() req: Request & { user: { id: string } },
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.id, productId, dto.quantity);
  }

  @Delete('items/:productId')
  removeItem(
    @Req() req: Request & { user: { id: string } },
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(req.user.id, productId);
  }

  @Post('merge')
  merge(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: MergeCartBodyDto,
  ) {
    return this.cartService.merge(req.user.id, dto.items ?? []);
  }
}
