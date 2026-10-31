import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../generated/prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('product/:productId')
  create(
    @Param('productId') productId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, productId, dto);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('my-reviews')
  findMyReviews(@GetUser('id') userId: string) {
    return this.reviewsService.findByUser(userId);
  }

  @Get('product/:productId/average')
  getAverageRating(@Param('productId') productId: string) {
    return this.reviewsService.getAverageRating(productId);
  }

  @Patch(':reviewId')
  update(
    @Param('reviewId') reviewId: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, reviewId, dto);
  }

  @Delete(':reviewId')
  delete(
    @Param('reviewId') reviewId: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
  ) {
    return this.reviewsService.delete(userId, reviewId, role === Role.ADMIN);
  }
}