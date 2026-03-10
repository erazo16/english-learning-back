import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TopicsModule } from './topics/topics.module';
import { ExercisesModule } from './exercices/exercises.module';
import { StoriesModule } from './stories/stories.module';
import { TranslationModule } from './translation/translation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TopicsModule,
    ExercisesModule,
    StoriesModule,
    TranslationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
