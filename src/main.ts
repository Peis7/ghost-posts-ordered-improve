import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   app.enableCors({
      origin: process.env.CORS_ORIGIN,
      methods: process.env.CORS_METHOD,
      allowedHeaders: process.env.CORS_ALLOWED_METHODS,
      optionsSuccessStatus: 204,
    });
  
    app.use(bodyParser.json({ limit: '50mb' })); // Adjust the limit as needed
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  

  app.useLogger(['log', 'error', 'warn', 'debug']); // Enable debug logs
  await app.listen(3005);
}
bootstrap();
