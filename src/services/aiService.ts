// src/services/aiService.ts
import { Roadmap } from '../types/roadmap';

const GROQ_API_KEY = (process as any).env?.EXPO_PUBLIC_GROQ_API_KEY || '';

export const generateRoadmap = async (userQuery: string): Promise<Roadmap> => {
    const prompt = `
    Eres un experto creando rutas de aprendizaje visuales. 
    El usuario quiere aprender sobre: "${userQuery}".
    
    REGLAS IMPORTANTES:
    1. Genera un roadmap CORTO de MAXIMO 5 nodos (subtemas). No generes más.
    2. Las descripciones de cada nodo deben ser de MAXIMO 15 palabras.
    3. Para los recursos, NO inventes URLs de videos específicos. Genera enlaces de búsqueda de YouTube o Google.
    4. Asigna posiciones lógicas en x e y (ej: nodo1 en x:0, nodo2 en x:300, etc., y:100).
    
    Ejemplo de recurso válido: 
    {"title": "YouTube", "url": "https://www.youtube.com/results?search_query=aprender+${userQuery}", "type": "youtube"}
    
    El JSON debe cumplir estrictamente con esta estructura:
    {
      "title": "string",
      "description": "string",
      "nodes": [
        {
          "id": "string (ej: nodo1)",
          "position": { "x": number, "y": number },
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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        // Usamos Llama 3, rapidísimo y gratuito en Groq
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error de API de Groq:", JSON.stringify(errorData, null, 2));
      throw new Error(`Error de API: ${errorData.error?.message || 'Desconocido'}`);
    }

    const data = await response.json();
    
    // Extraer el texto de la respuesta (formato OpenAI)
    let content = data.choices[0].message.content;

    // Limpiar el formato markdown que a veces la IA devuelve
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();

    const roadmap: Roadmap = JSON.parse(content);
    return roadmap;
  } catch (error: any) {
    console.error('Error completo generando roadmap:', error);
    throw new Error(error.message || 'No se pudo generar el roadmap');
  }
};