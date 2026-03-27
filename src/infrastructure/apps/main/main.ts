import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Server } from 'node:http';
import { AppModule } from './app.module';
import GlobalExceptionFilter from './exceptionFilters/global.exceptionFilters';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication<Server>>(AppModule, {
    bodyParser: false,
  });

  app.set('query parser', 'extended');

  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  const server = app.getHttpServer();
  const { httpAdapter } = app.get(HttpAdapterHost);
  const configService = app.get(ConfigService);

  const HOST = configService.get<string>('HOST') || '0.0.0.0';
  const PORT = configService.get<number>('PORT') || 5000;

  const keepAliveTimeout = 60;

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'client_id',
      'x-user',
      'Cache-Control',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: false,
  });

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, client_id, Cache-Control, X-Requested-With, Accept, Origin',
    );
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  server.keepAliveTimeout = keepAliveTimeout * 1000;
  server.headersTimeout = (keepAliveTimeout + 1) * 1000;
  server.setTimeout(120 * 1000); // 120 сек для больших файлов

  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));

  await app.listen(PORT, HOST);
  await app.startAllMicroservices();

  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
}

bootstrap();
