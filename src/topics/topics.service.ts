import { Injectable } from '@nestjs/common';

export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  levels: string[];
}

@Injectable()
export class TopicsService {
  private topics: Topic[] = [
    {
      id: 'there-is-are',
      title: 'There is / There are',
      description: 'Aprende a expresar existencia y cantidad',
      icon: '🏠',
      color: 'from-blue-500 to-cyan-500',
      levels: ['A1', 'A2', 'B1'],
    },
    {
      id: 'many-much',
      title: 'Many / Much / A lot of',
      description: 'Cuantificadores en inglés',
      icon: '📊',
      color: 'from-purple-500 to-pink-500',
      levels: ['A1', 'A2', 'B1'],
    },
    {
      id: 'present-simple',
      title: 'Present Simple',
      description: 'Hábitos y rutinas diarias',
      icon: '⏰',
      color: 'from-green-500 to-emerald-500',
      levels: ['A1', 'A2', 'B1'],
    },
    {
      id: 'past-simple',
      title: 'Past Simple',
      description: 'Acciones completadas en el pasado',
      icon: '📅',
      color: 'from-orange-500 to-red-500',
      levels: ['A2', 'B1', 'B2'],
    },
    {
      id: 'present-continuous',
      title: 'Present Continuous',
      description: 'Acciones en progreso ahora',
      icon: '🏃',
      color: 'from-yellow-500 to-orange-500',
      levels: ['A1', 'A2'],
    },
    {
      id: 'future-will',
      title: 'Future with Will',
      description: 'Predicciones y decisiones espontáneas',
      icon: '🔮',
      color: 'from-indigo-500 to-purple-500',
      levels: ['A2', 'B1'],
    },
  ];

  findAll(): Topic[] {
    return this.topics;
  }

  findOne(id: string): Topic | undefined {
    return this.topics.find((t) => t.id === id);
  }
}
