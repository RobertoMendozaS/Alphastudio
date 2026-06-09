export interface Resource {
  id?: string;
  title: string;
  url: string;
  type: 'youtube' | 'course' | 'documentation' | 'article' | 'google';
}

export interface RoadmapNode {
  id: string;
  data: {
    label: string;
    description: string;
    resources: Resource[];
    isCompleted: boolean;
  };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
}

export interface Roadmap {
  title: string;
  description: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}
