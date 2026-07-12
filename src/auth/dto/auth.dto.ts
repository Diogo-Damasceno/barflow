import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  current: string;
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'precisa de letra maiúscula' })
  @Matches(/[a-z]/, { message: 'precisa de letra minúscula' })
  @Matches(/[0-9]/, { message: 'precisa de número' })
  @Matches(/[^A-Za-z0-9]/, { message: 'precisa de símbolo' })
  next: string;
}
