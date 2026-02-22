import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  await app.listen(process.env.PORT ?? 3001);


  console.log(`RUNNING ON PORT: ${process.env.PORT ?? 3001}`);
}
void bootstrap();
