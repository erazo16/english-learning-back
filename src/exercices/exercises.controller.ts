import { Controller, Get, Query } from '@nestjs/common';
import { ExercisesService, Exercise } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  async getExercises(
    @Query('topic') topic: string,
    @Query('level') level: string,
  ): Promise<Exercise[]> {
    return this.exercisesService.generateExercises(topic, level);
  }
}
