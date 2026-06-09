import { Roadmap } from '../types/roadmap';
import { parseRoadmap } from '../utils/roadmapValidator';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/groq-proxy`;

export const generateRoadmap = async (userQuery: string, accessToken: string): Promise<Roadmap> => {
  const prompt = `
    Eres un experto creando rutas de aprendizaje visuales.
    El usuario quiere aprender sobre: "${userQuery}".

    REGLAS IMPORTANTES:
    1. Genera un roadmap CORTO de MAXIMO 5 nodos (subtemas). No generes más.
    2. Las descripciones de cada nodo deben ser de MAXIMO 15 palabras.
    3. Para los recursos, NO inventes URLs de videos específicos. Genera enlaces de búsqueda de YouTube o Google.

    Ejemplo de recurso válido:
    {"title": "YouTube", "url": "https://www.youtube.com/results?search_query=aprender+${userQuery}", "type": "youtube"}

    El JSON debe cumplir estrictamente con esta estructura:
    {
      "title": "string",
      "description": "string",
      "nodes": [
        {
          "id": "string (ej: nodo1)",
          "data": {
            "label": "string",
            "description": "string (max 15 palabras)",
            "resources": [{ "title": "string", "url": "string", "type": "youtube" | "course" | "documentation" | "article" }],
            "isCompleted": false
          }
        }
      ],
      "edges": [
        { "id": "string (ej: e1-2)", "source": "string (id origen)", "target": "string (id destino)" }
      ]
    }

    Devuelve SOLO el JSON puro, sin markdown (sin \`\`\`), sin explicaciones.
  `;

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        prompt,
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error de API de Groq:", JSON.stringify(errorData, null, 2));
      throw new Error(`Error de API: ${errorData.error?.message || 'Desconocido'}`);
    }

    const data = await response.json();

    let content = data.choices[0].message.content;
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();

    return parseRoadmap(content);
  } catch (error: any) {
    console.error('Error completo generando roadmap:', error);
    throw new Error(error.message || 'No se pudo generar el roadmap');
  }
};
