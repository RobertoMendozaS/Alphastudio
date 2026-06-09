import { Roadmap, Resource } from '../types/roadmap';

const VALID_RESOURCE_TYPES = ['youtube', 'course', 'documentation', 'article', 'google'] as const;
const MAX_NODES = 5;

interface ValidationError {
  field: string;
  message: string;
}

export function parseRoadmap(jsonString: string): Roadmap {
  let parsed: any;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('La IA devolvió un JSON inválido');
  }

  const errors: ValidationError[] = [];

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('La IA devolvió un valor no válido');
  }

  if (!parsed.title || typeof parsed.title !== 'string') {
    errors.push({ field: 'title', message: 'Falta el título del roadmap' });
  }

  if (!Array.isArray(parsed.nodes)) {
    errors.push({ field: 'nodes', message: 'Falta la lista de nodos' });
  } else {
    if (parsed.nodes.length === 0) {
      errors.push({ field: 'nodes', message: 'El roadmap no tiene nodos' });
    }
    if (parsed.nodes.length > MAX_NODES) {
      errors.push({ field: 'nodes', message: `El roadmap tiene más de ${MAX_NODES} nodos` });
    }

    parsed.nodes.forEach((node: any, i: number) => {
      if (!node.id || typeof node.id !== 'string') {
        errors.push({ field: `nodes[${i}].id`, message: 'Nodo sin ID' });
      }
      if (!node.data || typeof node.data !== 'object') {
        errors.push({ field: `nodes[${i}].data`, message: `Nodo ${node.id || i} sin datos` });
      } else {
        if (!node.data.label || typeof node.data.label !== 'string') {
          errors.push({ field: `nodes[${i}].data.label`, message: `Nodo ${node.id || i} sin label` });
        }
        if (typeof node.data.isCompleted !== 'boolean') {
          node.data.isCompleted = false;
        }
        if (Array.isArray(node.data.resources)) {
          node.data.resources.forEach((res: any, j: number) => {
            if (!res.title || typeof res.title !== 'string') {
              errors.push({ field: `nodes[${i}].data.resources[${j}].title`, message: 'Recurso sin título' });
            }
            if (!res.url || typeof res.url !== 'string') {
              errors.push({ field: `nodes[${i}].data.resources[${j}].url`, message: 'Recurso sin URL' });
            }
            if (!VALID_RESOURCE_TYPES.includes(res.type)) {
              errors.push({ field: `nodes[${i}].data.resources[${j}].type`, message: `Tipo de recurso inválido: ${res.type}` });
            }
          });
        }
      }
    });
  }

  if (errors.length > 0) {
    const detail = errors.map(e => `- ${e.field}: ${e.message}`).join('\n');
    throw new Error(`El roadmap generado por IA tiene errores de validación:\n${detail}`);
  }

  return parsed as Roadmap;
}
