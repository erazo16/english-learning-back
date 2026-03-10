import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [ConfigModule],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
