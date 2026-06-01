// src/types/roadmap.ts

// Recurso individual (video, curso, doc)
export interface Resource {
  title: string;
  url: string;
  type: 'youtube' | 'course' | 'documentation' | 'article';
}

// El nodo del mapa visual (Lo que React Flow necesita)
export interface RoadmapNode {
  id: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description: string;
    resources: Resource[];
    isCompleted: boolean;
  };
}

// Las líneas que conectan los nodos (prerrequisitos)
export interface RoadmapEdge {
  id: string;
  source: string; // ID del nodo origen
  target: string; // ID del nodo destino
}

// La estructura completa que devolverá la IA
export interface Roadmap {
  title: string;
  description: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}