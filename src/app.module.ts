import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { OriginMiddleware } from './common/origin.middleware';
import { HealthController } from './health.controller';
import { NewsletterModule } from './newsletter/newsletter.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const secret = config.JWT_SECRET;
        if (!secret || String(secret).length < 32) {
          throw new Error('JWT_SECRET must be set and at least 32 characters');
        }
        if (!config.DATABASE_URL) {
          throw new Error('DATABASE_URL is required');
        }
        return config;
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    NewsletterModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OriginMiddleware).forRoutes('*');
  }
}
