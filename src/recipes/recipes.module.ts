import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { RecipeCostService } from './recipe-cost.service';

@Module({
  providers: [RecipesService, RecipeCostService],
  controllers: [RecipesController],
  exports: [RecipesService],
})
export class RecipesModule {}
