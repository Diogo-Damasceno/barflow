import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() supplierId?: string;
  @IsEnum(['UN', 'ML', 'L', 'G', 'KG']) unit?: 'UN' | 'ML' | 'L' | 'G' | 'KG';
  @IsNumber() @Min(0) quantity?: number;
  @IsNumber() @Min(0) minStock?: number;
  @IsNumber() @IsPositive() costPrice: number;
  @IsNumber() @IsPositive() salePrice: number;
  @IsOptional() expiresAt?: string;
  @IsOptional() notes?: string;
  @IsOptional() imageUrl?: string;
}

export class UpdateProductPriceDto {
  @IsNumber() @IsPositive() costPrice: number;
  @IsNumber() @IsPositive() salePrice: number;
}

export class CreateSupplierDto {
  @IsString() name: string;
  @IsOptional() contact?: string;
}

export class CreateCategoryDto {
  @IsString() name: string;
}
