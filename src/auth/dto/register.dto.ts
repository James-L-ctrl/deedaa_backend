import { IsEmail, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { ValidatePasswordStrength } from '../decorators/validate-password-strength.decorator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ValidatePasswordStrength()
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[\p{L}\p{N} .'-]+$/u, {
    message: 'Name contains invalid characters',
  })
  name: string;
}
