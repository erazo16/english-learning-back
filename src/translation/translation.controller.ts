import { Controller, Get, Query } from '@nestjs/common';
import { TranslationService, Translation } from './translation.service';

@Controller('translate')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  async translate(
    @Query('word') word: string,
    @Query('context') context?: string,
  ): Promise<Translation> {
    return this.translationService.translateWord(word, context);
  }
}
