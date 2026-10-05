import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto/product.dto';

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

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    // Check if product exists
    await this.findById(id);

    // If slug is being updated, check for uniqueness
    if (dto.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new Error('A product with this slug already exists');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
