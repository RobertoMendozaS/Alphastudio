import { Roadmap } from '../types/roadmap';
import { parseRoadmap } from '../utils/roadmapValidator';

const XAI_API_KEY = process.env.EXPO_PUBLIC_XAI_API_KEY!;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

type ErrorCategory = 'auth' | 'rate_limit' | 'server' | 'network';

function categorizeError(error: any): ErrorCategory {
  if (error?.status === 401 || error?.status === 403) return 'auth';
  if (error?.status === 429) return 'rate_limit';
  if (error?.status && error?.status >= 500) return 'server';
  return 'network';
}

async function generateRoadmapReal(userQuery: string): Promise<Roadmap> {
  if (!XAI_API_KEY || XAI_API_KEY === 'undefined' || XAI_API_KEY === '') {
    throw Object.assign(new Error('API key de xAI no configurada'), { status: 401 });
  }

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'Eres un planificador de rutas de aprendizaje. Genera una ruta en formato JSON con title, description, nodes (label, description, resources con title/url/type), y edges. Responde SOLO con el JSON.',
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = new Error(`Error de API: ${response.status} ${response.statusText}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('La API devolvió una respuesta vacía');
  }

  return parseRoadmap(content);
}

async function generateRoadmapMock(userQuery: string): Promise<Roadmap> {
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
    }, 1500);
  });
}

export const generateRoadmap = async (userQuery: string, accessToken: string): Promise<Roadmap> => {
  const delays = [1000, 2000];
  let lastError: any;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await generateRoadmapReal(userQuery);
    } catch (error: any) {
      lastError = error;
      const category = categorizeError(error);

      if (category === 'auth') {
        console.warn('API key no configurada — usando mock como fallback');
        return generateRoadmapMock(userQuery);
      }

      if (attempt === 2) break;

      if (category === 'rate_limit') {
        await new Promise(r => setTimeout(r, delays[attempt] * 2));
      } else {
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
    }
  }

  console.log("Usando datos simulados (Mock) como fallback tras fallo de API.");
  return generateRoadmapMock(userQuery);
};
