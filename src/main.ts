import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  const corsOrigins = configService.get<string>('CORS_ORIGIN')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: configService.get<string>('CORS_METHOD'),
    allowedHeaders: configService.get<string>('CORS_ALLOWED_METHODS'),
    optionsSuccessStatus: 204,
    credentials: true,
  });
  
    app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  
    app.setGlobalPrefix('api');

  app.useLogger(['log', 'error', 'warn', 'debug']); // Enable debug logs


  const PORT = configService.get<number>('APP_PORT') || 3005;
  await app.listen(PORT, '0.0.0.0');
}
bootstrap();
