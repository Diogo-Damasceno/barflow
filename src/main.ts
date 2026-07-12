import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigin = (config.get('CORS_ORIGIN') || 'http://localhost:3000')
    .split(',')
    .map((s: string) => s.trim());

  app.use(helmet({ hsts: config.get('HTTPS') === 'true' }));
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
  });

  // CSRF/força-bruta: exige header custom em mutations (cookie já é SameSite).
  app.use((req: any, res: any, next: any) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      if (!req.headers['x-requested-with']) {
        return res.status(403).json({ message: 'CSRF header ausente' });
      }
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const doc = new DocumentBuilder()
    .setTitle('BarFlow API')
    .setDescription('Gestão de bares/restaurantes — multi-tenant, RBAC, OWASP')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, doc as OpenAPIObject);

  await app.listen(config.get('PORT') || 3001);
  console.log(`BarFlow API on :${config.get('PORT') || 3001} (swagger /docs)`);
}
bootstrap();
