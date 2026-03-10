import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface VocabularyItem {
  word: string;
  baseForm: string;
  meaning: string;
  pronunciation: string;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Story {
  title: string;
  content: string;
  level: string;
  vocabulary: VocabularyItem[];
  questions: Question[];
}

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no definida');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateStory(level: string): Promise<Story> {
    const prompt = `
      Crea un cuento corto en inglés (nivel ${level}) apropiado para estudiantes de inglés.
      
      REQUISITOS DEL CUENTO:
      - Longitud: 200-300 palabras
      - Historia interesante, coherente y entretenida
      - Vocabulario apropiado para nivel ${level}
      - Temática: puede ser sobre la vida cotidiana, una aventura, una historia de amistad, etc.
      
      REQUISITOS DE PREGUNTAS:
      - Genera exactamente 5 preguntas de comprensión lectora
      - Cada pregunta debe tener 4 opciones de respuesta (A, B, C, D)
      - Solo UNA respuesta correcta por pregunta
      - Preguntas sobre: personajes, lugar, acciones, motivos, moraleja
      
      Devuelve SOLO este JSON válido:
      {
        "title": "Título del cuento",
        "content": "Texto completo del cuento...",
        "level": "${level}",
        "vocabulary": [
          {
            "word": "palabra_en_texto", 
            "baseForm": "forma_base",
            "meaning": "significado_español",
            "pronunciation": "pronunciación"
          }
        ],
        "questions": [
          {
            "id": 1,
            "question": "¿Pregunta sobre el cuento?",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctAnswer": "Opción B",
            "explanation": "Explicación de por qué es correcta"
          }
        ]
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido');
      }

      const parsed: unknown = JSON.parse(jsonMatch[0]);
      return this.validateStory(parsed);
    } catch (error) {
      this.logger.error('Error generando cuento:', error);
      return this.getFallbackStory(level);
    }
  }

  private validateStory(parsed: unknown): Story {
    const getString = (value: unknown): string => {
      if (typeof value === 'string') return value;
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return String(value);
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.text === 'string') return obj.text;
        if (typeof obj.content === 'string') return obj.content;
      }
      return '';
    };

    const story = parsed as Record<string, unknown>;

    const getVocabulary = (v: unknown): VocabularyItem[] => {
      if (!Array.isArray(v)) return [];
      return v.map((item: unknown) => {
        if (typeof item !== 'object' || item === null) {
          return { word: '', baseForm: '', meaning: '', pronunciation: '' };
        }
        const vocab = item as Record<string, unknown>;
        return {
          word: getString(vocab.word),
          baseForm: getString(vocab.baseForm),
          meaning: getString(vocab.meaning),
          pronunciation: getString(vocab.pronunciation),
        };
      });
    };

    const getQuestions = (q: unknown): Question[] => {
      if (!Array.isArray(q)) return [];
      return q.map((item: unknown, index: number) => {
        if (typeof item !== 'object' || item === null) {
          return {
            id: index + 1,
            question: '',
            options: [],
            correctAnswer: '',
            explanation: '',
          };
        }
        const question = item as Record<string, unknown>;
        return {
          id: typeof question.id === 'number' ? question.id : index + 1,
          question: getString(question.question),
          options: Array.isArray(question.options)
            ? question.options.map((o: unknown) => getString(o))
            : [],
          correctAnswer: getString(question.correctAnswer),
          explanation: getString(question.explanation),
        };
      });
    };

    return {
      title: getString(story.title),
      content: getString(story.content),
      level: getString(story.level),
      vocabulary: getVocabulary(story.vocabulary),
      questions: getQuestions(story.questions),
    };
  }

  private getFallbackStory(level: string): Story {
    const storiesByLevel: Record<string, Story> = {
      A1: {
        title: "Tom's Morning",
        content:
          "Tom is a young boy. He wakes up at seven o'clock every day. He eats breakfast with his family. Tom likes cereal and milk. After breakfast, he goes to school. He walks with his friend Sarah. They talk about their favorite games. At school, Tom learns English and Math. He likes his teacher, Mrs. Brown. She is very kind. In the afternoon, Tom plays soccer with his friends. He goes home at four o'clock. He does his homework and eats dinner. Then he reads a book and goes to bed at nine o'clock. Tom has a happy day.",
        level: 'A1',
        vocabulary: [],
        questions: [
          {
            id: 1,
            question: 'What time does Tom wake up?',
            options: [
              `Six o'clock', 'Seven o'clock', 'Eight o'clock', 'Nine o'clock`,
            ],
            correctAnswer: `Seven o'clock`,
            explanation: `The text says "He wakes up at seven o'clock every day."`,
          },
          {
            id: 2,
            question: 'Who does Tom walk to school with?',
            options: ['His brother', 'His sister', 'His friend Sarah', 'Alone'],
            correctAnswer: 'His friend Sarah',
            explanation: 'The text says "He walks with his friend Sarah."',
          },
          {
            id: 3,
            question: 'What subjects does Tom learn at school?',
            options: [
              'English and Science',
              'Math and History',
              'English and Math',
              'Art and Music',
            ],
            correctAnswer: 'English and Math',
            explanation: 'The text says "Tom learns English and Math."',
          },
          {
            id: 4,
            question: 'What sport does Tom play in the afternoon?',
            options: ['Basketball', 'Soccer', 'Tennis', 'Baseball'],
            correctAnswer: 'Soccer',
            explanation: 'The text says "Tom plays soccer with his friends."',
          },
          {
            id: 5,
            question: 'What time does Tom go to bed?',
            options: [
              `Eight o'clock', 'Nine o'clock', 'Ten o'clock', 'Eleven o'clock`,
            ],
            correctAnswer: `Nine o'clock`,
            explanation: `The text says "goes to bed at nine o'clock'.`,
          },
        ],
      },
      A2: {
        title: 'A Trip to the Beach',
        content:
          "Last summer, Maria and her family went to the beach. They drove for two hours to get there. The weather was perfect - sunny and warm. Maria built a big sandcastle with her little brother. Her parents relaxed under a big umbrella. At noon, they ate sandwiches and drank lemonade. In the afternoon, Maria swam in the ocean. She saw colorful fish near the rocks. Her father taught her how to surf small waves. They stayed until the sunset painted the sky orange and pink. It was the best day of Maria's summer vacation. She took many photos to remember this special day.",
        level: 'A2',
        vocabulary: [],
        questions: [
          {
            id: 1,
            question: 'How did Maria and her family get to the beach?',
            options: ['By bus', 'By train', 'By car', 'By plane'],
            correctAnswer: 'By car',
            explanation:
              'The text says "They drove for two hours to get there."',
          },
          {
            id: 2,
            question: 'What did Maria build with her brother?',
            options: ['A boat', 'A sandcastle', 'A house', 'A kite'],
            correctAnswer: 'A sandcastle',
            explanation:
              'The text says "Maria built a big sandcastle with her little brother."',
          },
          {
            id: 3,
            question: 'What did they eat at noon?',
            options: [
              'Pizza and soda',
              'Sandwiches and lemonade',
              'Hamburgers and juice',
              'Salad and water',
            ],
            correctAnswer: 'Sandwiches and lemonade',
            explanation:
              'The text says "they ate sandwiches and drank lemonade."',
          },
          {
            id: 4,
            question: 'What did Maria see in the ocean?',
            options: ['Sharks', 'Dolphins', 'Colorful fish', 'Whales'],
            correctAnswer: 'Colorful fish',
            explanation:
              'The text says "She saw colorful fish near the rocks."',
          },
          {
            id: 5,
            question: 'When did they leave the beach?',
            options: ['At noon', 'In the morning', 'At sunset', 'At night'],
            correctAnswer: 'At sunset',
            explanation:
              'The text says "They stayed until the sunset painted the sky orange and pink."',
          },
        ],
      },
      B1: {
        title: 'The Lost Key',
        content:
          "Emma had been planning her trip to Paris for months. She had saved money, booked a charming hotel near the Eiffel Tower, and made a list of all the museums she wanted to visit. However, on the morning of her departure, disaster struck - she couldn't find her house key anywhere. She searched frantically through her bags, pockets, and drawers, but it was nowhere to be found. Her taxi to the airport was arriving in thirty minutes. Just as panic began to set in, she remembered leaving the key in her jacket pocket after her morning walk. The jacket was hanging by the door, exactly where she had left it. Emma grabbed the key, took a deep breath, and rushed out the door. Despite the stressful start, her trip to Paris was absolutely wonderful, and she learned that sometimes the smallest setbacks can lead to the greatest adventures.",
        level: 'B1',
        vocabulary: [],
        questions: [
          {
            id: 1,
            question: 'How long had Emma been planning her trip?',
            options: ['A few days', 'Several weeks', 'For months', 'A year'],
            correctAnswer: 'For months',
            explanation:
              'The text says "Emma had been planning her trip to Paris for months."',
          },
          {
            id: 2,
            question: 'Where was her hotel located?',
            options: [
              'Near the Louvre',
              'Near the Eiffel Tower',
              'In the city center',
              'By the river Seine',
            ],
            correctAnswer: 'Near the Eiffel Tower',
            explanation:
              'The text says "booked a charming hotel near the Eiffel Tower."',
          },
          {
            id: 3,
            question:
              'What problem did Emma face on the morning of her departure?',
            options: [
              'She missed her flight',
              'She lost her passport',
              "She couldn't find her house key",
              'Her taxi never arrived',
            ],
            correctAnswer: "She couldn't find her house key",
            explanation:
              'The text says "she couldn\'t find her house key anywhere."',
          },
          {
            id: 4,
            question: 'Where did she finally find the key?',
            options: [
              'In her bag',
              'On the table',
              'In her jacket pocket',
              'Under the bed',
            ],
            correctAnswer: 'In her jacket pocket',
            explanation:
              'The text says "she remembered leaving the key in her jacket pocket."',
          },
          {
            id: 5,
            question: 'What lesson did Emma learn from this experience?',
            options: [
              'To never travel alone',
              'To keep keys in a safe place',
              'That small setbacks can lead to great adventures',
              'To always take taxis early',
            ],
            correctAnswer: 'That small setbacks can lead to great adventures',
            explanation:
              'The text says "she learned that sometimes the smallest setbacks can lead to the greatest adventures."',
          },
        ],
      },
    };

    return storiesByLevel[level] || storiesByLevel['A1'];
  }
}
