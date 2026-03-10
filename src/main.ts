import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  console.log(
    '🔑 GEMINI_API_KEY:',
    process.env.GEMINI_API_KEY ? 'Cargada ✅' : 'No encontrada ❌',
  );

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({}));

  await app.listen(3001);
  console.log('🚀 Backend running on http://localhost:3001');
}
bootstrap();
