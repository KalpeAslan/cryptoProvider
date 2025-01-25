import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SharedConfig } from './modules/shared/config/shared.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(SharedConfig);
  const { host, port } = config.server;

  console.log('host', host);
  console.log('port', port);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setDescription('Blockchain Transaction API')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });

  await app.listen(port, host).catch((e) => {
    console.log('Listen Error', e.message);
    console.log('Listen Error Desc', e);
  });
  console.log(`Server started on: http://${host}:${port}`);
  console.log(`Swagger docs available at: http://${host}:${port}/api-docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
