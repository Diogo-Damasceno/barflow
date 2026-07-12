import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/recipe.dto';
import { JwtAuthGuard, PermissionsGuard } from '../shared/guards';
import { Require } from '../shared/permissions.decorator';
import { User, AuthUser } from '../shared/user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private recipes: RecipesService) {}

  @Require('recipe:create')
  @Post()
  create(@Body() dto: CreateRecipeDto, @User() u: AuthUser) {
    return this.recipes.create(dto, u.tenantId);
  }

  @Require('recipe:read')
  @Get()
  list(@User() u: AuthUser) {
    return this.recipes.list(u.tenantId);
  }

  @Require('recipe:read')
  @Get(':id/cost')
  cost(@Param('id') id: string, @User() u: AuthUser) {
    return this.recipes.cost(id, u.tenantId);
  }
}
