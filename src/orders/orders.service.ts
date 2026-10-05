import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
const SHIPPING_CENTS = 500;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    return this.prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Your cart is empty');
      }

      let subtotalCents = 0;
      for (const item of cartItems) {
        const product = item.product;
        if (!product.isPreorder && product.stock < item.quantity) {
          throw new BadRequestException(`${product.name} does not have enough stock`);
        }
        subtotalCents += product.priceCents * item.quantity;
      }

      const shippingCents =
        subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;

      const order = await tx.order.create({
        data: {
          userId,
          subtotalCents,
          shippingCents,
          totalCents: subtotalCents + shippingCents,
          shippingName: dto.shippingName.trim(),
          shippingAddress: dto.shippingAddress.trim(),
          shippingCity: dto.shippingCity.trim(),
          shippingPostalCode: dto.shippingPostalCode.trim(),
          shippingCountry: dto.shippingCountry.trim(),
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              unitPriceCents: item.product.priceCents,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cartItems) {
        if (item.product.isPreorder) {
          continue;
        }
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          throw new BadRequestException(`${item.product.name} does not have enough stock`);
        }
      }

      await tx.cartItem.deleteMany({ where: { userId } });
      return order;
    });
  }

  listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
