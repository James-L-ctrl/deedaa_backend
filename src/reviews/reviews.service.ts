import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existing = await this.prisma.productReview.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      throw new ForbiddenException('You have already reviewed this product');
    }

    return this.prisma.productReview.create({
      data: {
        ...dto,
        userId,
        productId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { user: { select: { name: true } } },
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.productReview.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.productReview.findMany({
      where: { userId },
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }
    return this.prisma.productReview.update({
      where: { id: reviewId },
      data: dto,
      include: { user: { select: { name: true } } },
    });
  }

  async delete(userId: string, reviewId: string, isAdmin = false) {
    const review = await this.prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    return this.prisma.productReview.delete({ where: { id: reviewId } });
  }

  async getAverageRating(productId: string) {
    const result = await this.prisma.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      averageRating: result._avg.rating ?? 0,
      reviewCount: result._count.rating ?? 0,
    };
  }
}