import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env, connectToDatabase } from "@notifyiq/config"
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from './common/interceptors/http-exception.interceptor.js';
import express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  await connectToDatabase();
  const app = await NestFactory.create(AppModule);

  // Enable raw body buffer on request for webhook signature verification
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // 1. Enforce strict DTO validation rules global mapping
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 2. Wrap all successful requests automatically
  app.useGlobalInterceptors(new TransformInterceptor());

  // 3. Catch and rewrite all error definitions globally
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: '*', //Allow all for dev,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
  })

  // 4. Set up Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('NotifyIQ - WhatsApp API Intelligence & Automation')
    .setDescription('The core REST API docs for the NotifyIQ WABA automation and intelligence engine.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = env.NEST_PORT ?? 5000;
  await app.listen(port);
  console.log(`[Bootstrap] NotifyIQ backend started successfully on port ${port}. OpenAPI docs: http://localhost:${port}/api/docs`);
}
bootstrap();
