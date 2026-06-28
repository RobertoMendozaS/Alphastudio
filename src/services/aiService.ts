import { Roadmap, RoadmapNode } from '../types/roadmap';
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

function generateTestMock(topic: string, difficulty: 'basic' | 'advanced', nodes?: RoadmapNode[]): TestQuestion[] {
  const lower = topic.toLowerCase();

  if (difficulty === 'basic') {
    return [
      {
        question: `¿Cuál es la definición más simple de "${topic}"?`,
        options: ['Un concepto complejo de entender', `La base fundamental de ${topic}`, 'Algo que solo expertos usan', 'Una tecnología obsoleta'],
        correctIndex: 1,
        difficulty: 'basic',
      },
      {
        question: `¿Qué necesitas saber antes de empezar con "${topic}"?`,
        options: ['Nada, puedes empezar de cero', 'Ser experto en matemáticas', 'Tener 5 años de experiencia', 'Saber todos los lenguajes'],
        correctIndex: 0,
        difficulty: 'basic',
      },
      {
        question: `¿Cuál de estas opciones describe mejor "${topic}"?`,
        options: ['Un framework complejo', 'Un conjunto de herramientas y conceptos', 'Solo un lenguaje', 'Una base de datos'],
        correctIndex: 1,
        difficulty: 'basic',
      },
      {
        question: `Al comenzar con "${topic}", ¿qué deberías hacer primero?`,
        options: ['Leer documentación avanzada', 'Practicar con ejemplos simples', 'Construir un proyecto completo', 'Comparar con otras tecnologías'],
        correctIndex: 1,
        difficulty: 'basic',
      },
      {
        question: `¿Qué recurso es más útil para un principiante en "${topic}"?`,
        options: ['Artículos de investigación', 'Tutoriales paso a paso', 'Código de producción', 'Documentación técnica densa'],
        correctIndex: 1,
        difficulty: 'basic',
      },
    ];
  }

  // advanced
  return [
    {
      question: `¿Cuál es una mala práctica común al trabajar con "${topic}"?`,
      options: ['Seguir estándares establecidos', 'Ignorar el manejo de errores', 'Documentar el código', 'Hacer pruebas unitarias'],
      correctIndex: 1,
      difficulty: 'advanced',
    },
    {
      question: `En "${topic}", ¿cómo optimizarías el rendimiento de una solución compleja?`,
      options: ['Agregando más funcionalidades', 'Analizando cuellos de botella y aplicando patrones adecuados', 'Usando más memoria', 'Evitando el uso de herramientas'],
      correctIndex: 1,
      difficulty: 'advanced',
    },
    {
      question: `Cuando trabajas en un proyecto grande con "${topic}", ¿qué estrategia de arquitectura recomendarías?`,
      options: ['Sin planificación previa', 'Un diseño modular con separación de responsabilidades', 'Todo en un solo archivo', 'Copiar y pegar código'],
      correctIndex: 1,
      difficulty: 'advanced',
    },
    {
      question: `¿Qué enfoque usarías para depurar un problema complejo en "${topic}"?`,
      options: ['Reiniciar todo', 'Aislar variables, revisar logs y usar herramientas de debugging', 'Ignorar el error', 'Reescribir todo desde cero'],
      correctIndex: 1,
      difficulty: 'advanced',
    },
    {
      question: `En un escenario de producción con "${topic}", ¿qué práctica es crítica?`,
      options: ['No hacer respaldos', 'Implementar monitoreo, logging y pruebas automatizadas', 'Trabajar sin control de versiones', 'Hacer cambios directamente en producción'],
      correctIndex: 1,
      difficulty: 'advanced',
    },
  ];
}

export const generateTestQuestions = async (
  topic: string,
  difficulty: 'basic' | 'advanced' = 'basic',
  nodes?: RoadmapNode[],
): Promise<TestQuestion[]> => {
  const nodeContext = nodes && nodes.length > 0
    ? `Los temas cubiertos en la ruta son: ${nodes.map((n) => n.data.label).join(', ')}. Descripciones: ${nodes.map((n) => n.data.description).join('; ')}.`
    : '';

  const systemPrompt = difficulty === 'basic'
    ? `Eres un evaluador de conocimientos. Genera 5 preguntas de opción múltiple de NIVEL BÁSICO a INTERMEDIO sobre el tema solicitado. Las preguntas deben evaluar fundamentos, definiciones y conceptos esenciales. ${nodeContext} Responde SOLO con un array JSON donde cada elemento tiene: question (string), options (array de 4 strings), correctIndex (number 0-3).`
    : `Eres un evaluador de conocimientos. Genera 5 preguntas de opción múltiple de NIVEL AVANZADO sobre el tema solicitado. Las preguntas deben evaluar optimización, arquitectura, buenas prácticas y resolución de problemas complejos. ${nodeContext} Responde SOLO con un array JSON donde cada elemento tiene: question (string), options (array de 4 strings), correctIndex (number 0-3).`;

  try {
    if (!XAI_API_KEY || XAI_API_KEY === 'undefined' || XAI_API_KEY === '') {
      return generateTestMock(topic, difficulty, nodes);
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${topic}${nodeContext ? `\n\nContexto de la ruta:\n${nodeContext}` : ''}` },
        ],
      }),
    });
    if (!response.ok) return generateTestMock(topic, difficulty, nodes);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return generateTestMock(topic, difficulty, nodes);
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return generateTestMock(topic, difficulty, nodes);
  } catch {
    return generateTestMock(topic, difficulty, nodes);
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
