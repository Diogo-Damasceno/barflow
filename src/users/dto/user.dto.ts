import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() roleId: string;
  @IsOptional() @IsString() branchId?: string;
}

export class UpdateUserRoleDto {
  @IsString() roleId: string;
}

export class CreateRoleDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  // permissões são nomes exatos (ex.: 'product:create')
  @IsOptional() permissions?: string[];
}
