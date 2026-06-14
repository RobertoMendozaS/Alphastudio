import { Roadmap } from '../types/roadmap';
import { parseRoadmap } from '../utils/roadmapValidator';

const XAI_API_KEY = process.env.EXPO_PUBLIC_XAI_API_KEY!;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

export const generateRoadmap = async (userQuery: string, accessToken: string): Promise<Roadmap> => {
  console.log("Usando datos simulados (Mock) porque la API de xAI no tiene créditos.");
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: `Ruta para aprender ${userQuery}`,
        description: `Esta es una ruta generada automáticamente (modo de prueba) para ayudarte a dominar ${userQuery} desde cero hasta un nivel avanzado.`,
        nodes: [
          {
            id: 'n1',
            data: {
              label: '1. Fundamentos Básicos',
              description: `Aprende los conceptos más esenciales de ${userQuery}.`,
              resources: [
                { title: 'Video Introductorio', url: `https://www.youtube.com/results?search_query=introduccion+a+${encodeURIComponent(userQuery)}`, type: 'youtube' },
                { title: 'Documentación Inicial', url: `https://www.google.com/search?q=documentacion+basica+${encodeURIComponent(userQuery)}`, type: 'documentation' }
              ],
              isCompleted: false
            }
          },
          {
            id: 'n2',
            data: {
              label: '2. Práctica Intermedia',
              description: `Aplica lo aprendido construyendo pequeños proyectos.`,
              resources: [
                { title: 'Curso Práctico', url: `https://www.youtube.com/results?search_query=curso+practico+${encodeURIComponent(userQuery)}`, type: 'course' }
              ],
              isCompleted: false
            }
          },
          {
            id: 'n3',
            data: {
              label: '3. Conceptos Avanzados',
              description: `Profundiza en el funcionamiento interno y optimización.`,
              resources: [
                { title: 'Artículos Avanzados', url: `https://www.google.com/search?q=conceptos+avanzados+${encodeURIComponent(userQuery)}`, type: 'article' }
              ],
              isCompleted: false
            }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'n1', target: 'n2' },
          { id: 'e2-3', source: 'n2', target: 'n3' }
        ]
      });
    }, 1500); // Simulamos 1.5 segundos de carga
  });
};
