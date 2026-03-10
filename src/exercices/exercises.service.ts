import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface Exercise {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY no está definida en las variables de entorno',
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
  }

  async generateExercises(topic: string, level: string): Promise<Exercise[]> {
    const prompt = `
      Genera exactamente 20 ejercicios de inglés para el tema "${topic}" nivel ${level}.
      
      REGLAS IMPORTANTES:
      1. Cada ejercicio debe ser una pregunta de selección múltiple (4 opciones)
      2. Incluye la respuesta correcta y una explicación breve en español
      3. Varía los tipos de preguntas: completar espacios, elegir la opción correcta, corregir errores
      4. Adapta la dificultad al nivel ${level}
      5. Devuelve SOLO un array JSON válido sin formato markdown
      
      Formato requerido:
      [
        {
          "id": 1,
          "question": "There ___ a book on the table",
          "options": ["is", "are", "am", "be"],
          "correctAnswer": "is",
          "explanation": "Usamos 'is' con sustantivos singulares (a book)"
        }
      ]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const exercises = this.parseExercises(text);

      if (exercises.length !== 20) {
        this.logger.warn(
          `Se generaron ${exercises.length} ejercicios, se esperaban 20`,
        );
      }

      return exercises;
    } catch (error) {
      this.logger.error('Error generando ejercicios:', error);
      return this.getFallbackExercises(topic, level);
    }
  }

  private parseExercises(text: string): Exercise[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const parsed: unknown = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        throw new Error('La respuesta no es un array');
      }

      const exercises: Exercise[] = parsed.map(
        (item: unknown, index: number) => {
          if (!this.isValidExercise(item)) {
            throw new Error(`Ejercicio ${index + 1} tiene formato inválido`);
          }
          return item;
        },
      );

      return exercises;
    } catch (error) {
      this.logger.error('Error parseando ejercicios:', error);
      throw error;
    }
  }

  private isValidExercise(item: unknown): item is Exercise {
    if (typeof item !== 'object' || item === null) return false;

    const exercise = item as Record<string, unknown>;

    return (
      typeof exercise.id === 'number' &&
      typeof exercise.question === 'string' &&
      Array.isArray(exercise.options) &&
      exercise.options.length === 4 &&
      typeof exercise.correctAnswer === 'string' &&
      typeof exercise.explanation === 'string'
    );
  }

  private getFallbackExercises(topic: string, level: string): Exercise[] {
    this.logger.log('Usando ejercicios de respaldo');

    const fallbackExercises: Record<string, Exercise[]> = {
      'there-is-are': [
        {
          id: 1,
          question: 'There ___ a book on the table',
          options: ['is', 'are', 'am', 'be'],
          correctAnswer: 'is',
          explanation: "Usamos 'is' con sustantivos singulares (a book)",
        },
        {
          id: 2,
          question: 'There ___ many students in the classroom',
          options: ['is', 'are', 'am', 'be'],
          correctAnswer: 'are',
          explanation: "Usamos 'are' con sustantivos plurales (many students)",
        },
      ],
      'many-much': [
        {
          id: 1,
          question: 'How ___ water do you need?',
          options: ['many', 'much', 'a lot', 'few'],
          correctAnswer: 'much',
          explanation: "'Much' se usa con sustantivos incontables (water)",
        },
        {
          id: 2,
          question: 'There are ___ apples in the basket',
          options: ['much', 'many', 'a little', 'less'],
          correctAnswer: 'many',
          explanation:
            "'Many' se usa con sustantivos contables plurales (apples)",
        },
      ],
    };

    const specific = fallbackExercises[topic] || [];
    const generic: Exercise[] = Array.from(
      { length: 20 - specific.length },
      (_, i) => ({
        id: specific.length + i + 1,
        question: `Ejercicio ${specific.length + i + 1} de ${topic} (nivel ${level})`,
        options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        correctAnswer: 'Opción A',
        explanation: `Explicación del tema ${topic} nivel ${level}`,
      }),
    );

    return [...specific, ...generic].slice(0, 20);
  }
}
