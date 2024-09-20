import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());

   app.enableCors({
      origin: corsOrigins,
      methods: process.env.CORS_METHOD,
      allowedHeaders: process.env.CORS_ALLOWED_METHODS,
      optionsSuccessStatus: 204,
      credentials: true,
    });
  
    app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  
    app.setGlobalPrefix('api');

  app.useLogger(['log', 'error', 'warn', 'debug']); // Enable debug logs
  await app.listen(3005);
}
bootstrap();
