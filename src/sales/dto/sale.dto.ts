import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsString() productId: string;
  @IsNumber() @Min(0.0001) quantity: number;
}

export class CreateSaleDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SaleItemDto) items: SaleItemDto[];
  @IsEnum(['CASH', 'CARD', 'PIX', 'TEF', 'OTHER']) paymentMethod: 'CASH' | 'CARD' | 'PIX' | 'TEF' | 'OTHER';
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsNumber() @Min(0) addition?: number;
  @IsOptional() @IsNumber() @Min(0) amountReceived?: number;
  @IsOptional() branchId?: string;
}
