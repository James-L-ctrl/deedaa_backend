import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  bestseller?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  preorder?: boolean;
}

export class CreateProductDto {
  @IsString()
  @MaxLength(80)
  slug: string;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsInt()
  @Min(1)
  @Max(1_000_000)
  priceCents: number;

  @IsString()
  @MaxLength(500)
  imageUrl: string;

  @IsString()
  @MaxLength(40)
  category: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  bestseller?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badge?: string;

  @IsOptional()
  @IsBoolean()
  isPreorder?: boolean;
}
