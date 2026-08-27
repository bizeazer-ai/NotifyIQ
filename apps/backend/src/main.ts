import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env, connectToDatabase } from "@notifyiq/config"
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from './common/interceptors/http-exception.interceptor.js';

async function bootstrap() {
  await connectToDatabase();
  const app = await NestFactory.create(AppModule);

   // 1. Enforce strict DTO validation rules global mapping
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 2. Wrap all successful requests automatically
  app.useGlobalInterceptors(new TransformInterceptor());

  // 3. Catch and rewrite all error definitions globally
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(env.NEST_PORT ?? 3000);
}
bootstrap();
