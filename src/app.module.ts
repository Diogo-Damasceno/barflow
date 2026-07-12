import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { RecipesModule } from './recipes/recipes.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 60 }, // 60 req/min geral
      { ttl: 60000, limit: 10, name: 'auth' }, // 10/min em auth (brute force)
    ]),
    SharedModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    RecipesModule,
    InventoryModule,
    SalesModule,
    DashboardModule,
    ReportsModule,
  ],
})
export class AppModule {}
