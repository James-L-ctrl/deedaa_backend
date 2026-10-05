import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductQueryDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.featured) {
      where.featured = true;
    }
    if (query.bestseller) {
      where.bestseller = true;
    }
    if (query.preorder) {
      where.isPreorder = true;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { bestseller: 'desc' }, { name: 'asc' }],
    });
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }
}
