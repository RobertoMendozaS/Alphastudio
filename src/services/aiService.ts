import { Roadmap } from '../types/roadmap';
import { parseRoadmap } from '../utils/roadmapValidator';
import type { TestQuestion } from '../types/test';

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

  const bodyPayload = {
    model: 'grok-2-latest',
    messages: [
      {
        role: 'user',
        content: `Eres un planificador de rutas de aprendizaje. Genera una ruta en formato JSON con title, description, nodes (label, description, resources con title/url/type), y edges. Responde SOLO con el JSON.\n\nTema: ${userQuery}`,
      }
    ],
  };

  const response = await fetch(XAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[xAI] 400 Bad Request - Body:`, errorText);
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

function generateTestMock(topic: string): TestQuestion[] {
  const lower = topic.toLowerCase();
  const questions: TestQuestion[] = [
    {
      question: `¿Cuál es el primer paso recomendado para aprender "${topic}"?`,
      options: ['Leer documentación avanzada', 'Entender los fundamentos', 'Crear un proyecto complejo', 'Ver videos sin práctica'],
      correctIndex: 1,
    },
    {
      question: `¿Qué recurso es más útil al empezar con "${topic}"?`,
      options: ['Foros de discusión', 'Tutoriales interactivos para principiantes', 'Código fuente de proyectos grandes', 'Artículos de investigación'],
      correctIndex: 1,
    },
    {
      question: `¿Cuál es una buena práctica al estudiar "${topic}"?`,
      options: ['Solo leer teoría', 'Practicar con ejercicios pequeños', 'Memorizar sin entender', 'Evitar preguntar dudas'],
      correctIndex: 1,
    },
    {
      question: `¿Qué herramienta usarías para aplicar "${topic}"?`,
      options: ['Un bloc de notas', ['VS Code', 'un editor de código'].includes(lower) ? 'Un editor de código' : 'Un entorno de desarrollo adecuado', 'Solo papel y lápiz', 'Ninguna, solo teoría'],
      correctIndex: 1,
    },
    {
      question: `Después de aprender "${topic}", ¿qué deberías hacer?`,
      options: ['Olvidarlo', 'Construir un proyecto personal', 'No volver a practicar', 'Solo ver más videos'],
      correctIndex: 1,
    },
  ];
  return questions;
}

export const generateTestQuestions = async (topic: string): Promise<TestQuestion[]> => {
  try {
    if (!XAI_API_KEY || XAI_API_KEY === 'undefined' || XAI_API_KEY === '') {
      return generateTestMock(topic);
    }
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          {
            role: 'system',
            content: 'Eres un evaluador de conocimientos. Genera 5 preguntas de opción múltiple sobre el tema solicitado. Responde SOLO con un array JSON donde cada elemento tiene: question (string), options (array de 4 strings), correctIndex (number 0-3).',
          },
          { role: 'user', content: topic },
        ],
      }),
    });
    if (!response.ok) return generateTestMock(topic);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return generateTestMock(topic);
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return generateTestMock(topic);
  } catch {
    return generateTestMock(topic);
  }
};

export interface DynamicBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  topic: string;
}

function generateBadgeMock(topic: string): DynamicBadge {
  const hash = Array.from(topic).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const color = colors[hash % colors.length];
  
  return {
    id: `badge_${Date.now()}_${hash}`,
    name: `Explorador de ${topic}`,
    icon: 'star',
    color,
    desc: `Otorgado por aventurarte a estudiar ${topic}.`,
    topic,
  };
}

export const generateDynamicBadge = async (topic: string): Promise<DynamicBadge> => {
  try {
    if (!XAI_API_KEY || XAI_API_KEY === 'undefined' || XAI_API_KEY === '') {
      return generateBadgeMock(topic);
    }
    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          {
            role: 'system',
            content: 'Eres un diseñador de recompensas. Genera una insignia basada en el tema que el usuario quiere estudiar. Responde SOLO con un objeto JSON que tenga: "name" (string, un título épico corto), "icon" (string, el nombre de un icono de Ionicons compatible como "code-slash", "planet", "bulb", "rocket", "laptop", "library", "color-palette"), "color" (string, código hex representativo), "desc" (string, una descripción motivadora muy breve). No incluyas markdown, solo el JSON puro.',
          },
          { role: 'user', content: topic },
        ],
      }),
    });
    
    if (!response.ok) return generateBadgeMock(topic);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return generateBadgeMock(topic);
    
    // Attempt to extract json if it wrapped it in markdown code blocks by accident
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    
    if (parsed.name && parsed.icon && parsed.color && parsed.desc) {
      return {
        id: `badge_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: parsed.name,
        icon: parsed.icon,
        color: parsed.color,
        desc: parsed.desc,
        topic,
      };
    }
    return generateBadgeMock(topic);
  } catch (err) {
    console.error('Error generating badge:', err);
    return generateBadgeMock(topic);
  }
};
