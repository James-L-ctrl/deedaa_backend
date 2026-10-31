import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException('A coupon with this code already exists');
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountPct: dto.discountPct,
        minPurchase: dto.minPurchase ?? 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findById(id);
    return this.prisma.coupon.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is no longer active');
    }

    if (dto.subtotalCents < coupon.minPurchase * 100) {
      throw new BadRequestException(
        `Minimum purchase of $${coupon.minPurchase} required for this coupon`,
      );
    }

    const discountCents = Math.round((dto.subtotalCents * coupon.discountPct) / 100);

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountPct: coupon.discountPct,
        discountCents,
      },
    };
  }
}