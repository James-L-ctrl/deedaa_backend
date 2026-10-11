import { IsString, Matches, MaxLength, MinLength, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../payment-method.enum';

export class CheckoutDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[\p{L}\p{N} .'-]+$/u)
  shippingName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  shippingAddress: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  shippingCity: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9 \-]+$/)
  shippingPostalCode: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  shippingCountry: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
