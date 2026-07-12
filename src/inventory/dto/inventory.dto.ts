import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class MovementDto {
  @IsString() productId: string;
  @IsEnum(['IN', 'OUT', 'ADJUST', 'TRANSFER']) type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  @IsNumber() @Min(0) quantity: number;
  @IsOptional() reason?: string;
  @IsOptional() branchId?: string;
}
