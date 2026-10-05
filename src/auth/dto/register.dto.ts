import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must include a letter and a number',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[\p{L}\p{N} .'-]+$/u, {
    message: 'Name contains invalid characters',
  })
  name: string;
}
