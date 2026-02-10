import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiProperty()
  @IsString()
  depotId: string;

  @ApiProperty({ required: false, description: 'Alias for depotId' })
  @IsOptional()
  @IsString()
  depotid?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBrandDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBrandDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
