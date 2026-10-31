import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discountPct!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsString()
  productId?: string;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  discountPct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsInt()
  @Min(0)
  subtotalCents!: number;

  @IsOptional()
  @IsString()
  productId?: string;
}