import { Controller, Get, Param } from '@nestjs/common';
import { Topic, TopicsService } from './topics.service';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  findAll(): Topic[] {
    return this.topicsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Topic | undefined {
    return this.findOne(id);
  }
}
