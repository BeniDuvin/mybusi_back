import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';

@Module({
  controllers: [ProductController, CategoryController, BrandController],
  providers: [ProductService, CategoryService, BrandService],
  exports: [ProductService, CategoryService, BrandService],
})
export class ProductModule {}
