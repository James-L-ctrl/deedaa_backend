import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { PaymentMethod } from '../payment-method.enum';
import { EmailService } from '../email/email.service';

const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
const SHIPPING_CENTS = 500;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const order = await this.prisma.$transaction(async (tx) => {
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

      // Determine initial status based on payment method
      let initialStatus;
      if (dto.paymentMethod === PaymentMethod.COD) {
        initialStatus = 'COD_PENDING';
      } else if (dto.paymentMethod === PaymentMethod.GCASH) {
        initialStatus = 'GCASH_PENDING';
      } else {
        initialStatus = 'PENDING';
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: initialStatus,
          subtotalCents,
          shippingCents,
          totalCents: subtotalCents + shippingCents,
          shippingName: dto.shippingName.trim(),
          shippingAddress: dto.shippingAddress.trim(),
          shippingCity: dto.shippingCity.trim(),
          shippingPostalCode: dto.shippingPostalCode.trim(),
          shippingCountry: dto.shippingCountry.trim(),
          paymentMethod: dto.paymentMethod,
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
      return createdOrder;
    });

    // Send order confirmation email (non-blocking)
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const emailItems = order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
        }));
        await this.emailService.sendOrderConfirmation(
          order,
          user.name,
          user.email,
          emailItems,
        );

        // Send payment-specific email
        if (order.paymentMethod === PaymentMethod.GCASH) {
          await this.emailService.sendGcashReceipt(
            order,
            order.gcashReferenceId || '',
            order.totalCents,
            user.email,
          );
        } else if (order.paymentMethod === PaymentMethod.COD) {
          await this.emailService.sendCodConfirmation(order, user.email);
        }
      }
    } catch (emailError) {
      // Log but don't fail the order
      console.error('Failed to send order emails:', emailError);
    }

    return order;
  }

  // Update order status for GCash payment completion
  async updateGcashPaymentStatus(
    orderId: string,
    gcashReferenceId: string,
    status: 'GCASH_COMPLETED' | 'GCASH_FAILED' | 'GCASH_CANCELLED',
  ) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        gcashReferenceId,
        ...(status === 'GCASH_COMPLETED' && { paidAt: new Date() }),
      },
    });
  }

  // Update order status for COD confirmation
  async updateCodStatus(
    orderId: string,
    status: 'COD_CONFIRMED' | 'COD_DELIVERED' | 'COD_CANCELLED',
    codReferenceId?: string,
  ) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(codReferenceId && { codReferenceId }),
        ...(status === 'COD_CONFIRMED' && { paidAt: new Date() }), // Consider COD confirmed as "paid" for accounting
      },
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
