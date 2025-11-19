import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Server } from 'node:http';
import { AppModule } from './app.module';
import GlobalExceptionFilter from './exceptionFilters/global.exceptionFilters';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication<Server>>(AppModule);

  app.set('query parser', 'extended');

  const server = app.getHttpServer();
  const { httpAdapter } = app.get(HttpAdapterHost);

  const keepAliveTimeout = 60;

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'client_id',
      'Cache-Control',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
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

  //
  // app.enableCors({
  //   origin: ['http://localhost:5173/'],
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  //   allowedHeaders: [
  //     'Content-Type',
  //     'Authorization',
  //     'client_id',
  //     'Cache-Control',
  //     'X-Requested-With',
  //     'Accept',
  //     'Origin',
  //   ],
  //   exposedHeaders: ['Content-Type', 'Cache-Control', 'Connection', 'Transfer-Encoding'],
  //   credentials: false,
  // });

  // server.keepAliveTimeout = keepAliveTimeout * 1000;
  // server.headersTimeout = keepAliveTimeout * 1000;
  // server.setTimeout(30 * 1000);

  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));

  await app.listen(5000, 'localhost');
  await app.startAllMicroservices();

  console.log(`Listening on localhost:5000`);
}

bootstrap();
