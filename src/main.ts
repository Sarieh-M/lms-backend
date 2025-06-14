import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LanguageInterceptor } from './common/interceptors/language.interceptor';
import * as cookieParser from 'cookie-parser';
import * as multer from 'multer';
import * as dotenv from 'dotenv'
async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  dotenv.config();
  // this one for interceptr
  app.useGlobalInterceptors(new LanguageInterceptor());
  //==========================
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
   //===============================
  app.use(cookieParser());
   //===============================
  app.enableCors({
    origin: 'http://localhost:5173', // Allow specific domain
    methods: 'GET,POST,PATCH,PUT,DELETE', // Allow HTTP methods
    credentials: true, // Allow cookies to be sent
    allowedHeaders: 'Content-Type, Authorization', // Permitted request headers
  });
   //===============================
  app.use(helmet());
   //===============================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:true,
      forbidNonWhitelisted:true,
    }),
  );
  //===============================
  const upload=multer();
   app.use((req, res, next) => {
    if (req.is('multipart/form-data')) {
      upload.any()(req, res, (err) => {
        if (err) {
          return next(err);
        }
        next();
      });
    } else {
      next();
    }
  });
   //===============================
  const swaggerConfig = new DocumentBuilder()
    .setTitle("NEST JS API - LMS API")
    .setDescription("API documentation for LMS project")
    .addServer(configService.get<string>('DOMAIN') || 'http://localhost:3000')
    .setTermsOfService("https://www.google.com")
    .setLicense("MIT License", "https://www.google.com")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();
  //===============================

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document); // <-- spelling fix

  const port = configService.get<string>('PORT') || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();


