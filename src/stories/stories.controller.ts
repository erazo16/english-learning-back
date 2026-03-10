import { Controller, Get, Query } from '@nestjs/common';
import { StoriesService, Story } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get()
  async getStory(@Query('level') level: string): Promise<Story> {
    return this.storiesService.generateStory(level);
  }
}
