import { IsArray, IsEnum, IsNumber, IsOptional, IsPositive, IsString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RecipeItemDto {
  @IsString() productId: string;
  @IsNumber() @Min(0) amount: number;
  @IsEnum(['UN', 'ML', 'L', 'G', 'KG', 'PCT']) unit: 'UN' | 'ML' | 'L' | 'G' | 'KG' | 'PCT';
}

export class CreateRecipeDto {
  @IsString() name: string;
  @IsOptional() description?: string;
  @IsNumber() @Min(0) yield?: number;
  @IsEnum(['UN', 'ML', 'L', 'G', 'KG']) yieldUnit?: 'UN' | 'ML' | 'L' | 'G' | 'KG';
  @IsNumber() @Min(0) @Max(100) wastePct?: number;
  @IsNumber() @IsPositive() salePrice: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => RecipeItemDto) items: RecipeItemDto[];
}
