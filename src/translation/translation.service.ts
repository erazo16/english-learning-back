import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface Translation {
  word: string;
  translation: string;
  pronunciation: string;
  partOfSpeech: string;
  example: string;
  exampleTranslation: string;
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no definida');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async translateWord(word: string, context?: string): Promise<Translation> {
    const prompt = `
      Traduce la palabra "${word}" al español.
      ${context ? `Contexto: "${context}"` : ''}
      
      Devuelve SOLO este JSON:
      {
        "word": "${word}",
        "translation": "traducción principal",
        "pronunciation": "pronunciación aproximada",
        "partOfSpeech": "sustantivo/verbo/adjetivo/etc",
        "example": "una oración de ejemplo en inglés",
        "exampleTranslation": "traducción de la oración"
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo parsear la traducción');
      }

      const parsed: unknown = JSON.parse(jsonMatch[0]);
      return this.validateTranslation(parsed, word);
    } catch (error) {
      this.logger.error(`Error traduciendo "${word}":`, error);
      return this.getFallbackTranslation(word);
    }
  }

  private validateTranslation(
    parsed: unknown,
    originalWord: string,
  ): Translation {
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Respuesta inválida: no es un objeto');
    }

    const t = parsed as Record<string, unknown>;

    const getString = (value: unknown, defaultValue: string): string => {
      if (typeof value === 'string') {
        return value;
      }
      if (value === null || value === undefined) {
        return defaultValue;
      }
      if (typeof value === 'number') {
        return String(value);
      }
      return defaultValue;
    };

    return {
      word: originalWord,
      translation: getString(t.translation, 'No disponible'),
      pronunciation: getString(t.pronunciation, 'N/A'),
      partOfSpeech: getString(t.partOfSpeech, 'desconocido'),
      example: getString(t.example, ''),
      exampleTranslation: getString(t.exampleTranslation, ''),
    };
  }

  private getFallbackTranslation(word: string): Translation {
    return {
      word,
      translation: 'Traducción no disponible',
      pronunciation: 'N/A',
      partOfSpeech: 'desconocido',
      example: '',
      exampleTranslation: '',
    };
  }
}
