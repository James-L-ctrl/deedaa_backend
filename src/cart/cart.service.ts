import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) => this.mapItem(item));
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    this.assertStock(product, dto.quantity);

    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    const nextQty = (existing?.quantity ?? 0) + dto.quantity;
    this.assertStock(product, nextQty);

    await this.prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: dto.productId } },
      create: { userId, productId: dto.productId, quantity: dto.quantity },
      update: { quantity: nextQty },
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    if (quantity === 0) {
      await this.prisma.cartItem.deleteMany({ where: { userId, productId } });
      return this.getCart(userId);
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    this.assertStock(product, quantity);

    await this.prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity },
      update: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId, productId } });
    return this.getCart(userId);
  }

  async merge(userId: string, items: AddCartItemDto[]) {
    const safeItems = Array.isArray(items) ? items.slice(0, 50) : [];
    for (const item of safeItems) {
      if (!item?.productId || !Number.isInteger(item.quantity) || item.quantity < 1) {
        continue;
      }
      await this.addItem(userId, {
        productId: item.productId,
        quantity: Math.min(item.quantity, 20),
      });
    }
    return this.getCart(userId);
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return [];
  }

  private assertStock(
    product: { stock: number; isPreorder: boolean; name: string },
    quantity: number,
  ) {
    if (!product.isPreorder && product.stock < quantity) {
      throw new BadRequestException(`${product.name} does not have enough stock`);
    }
  }

  private mapItem(item: {
    quantity: number;
    product: {
      id: string;
      slug: string;
      name: string;
      priceCents: number;
      imageUrl: string;
      stock: number;
      isPreorder: boolean;
    };
  }) {
    return {
      productId: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      priceCents: item.product.priceCents,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      stock: item.product.stock,
      isPreorder: item.product.isPreorder,
    };
  }
}
