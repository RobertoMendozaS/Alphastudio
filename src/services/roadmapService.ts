import { supabase } from './supabaseClient';
import { Roadmap, RoadmapEdge, RoadmapNode } from '../types/roadmap';

// ============================================================
// saved_roadmaps CRUD
// ============================================================

export interface SavedRoadmapRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  nodes_json: RoadmapNode[];
  edges_json: RoadmapEdge[];
  created_at: string;
  updated_at: string;
}

export interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const saveRoadmap = async (
  userId: string,
  title: string,
  description: string | null,
  nodes: RoadmapNode[],
  edges: RoadmapEdge[]
): Promise<SavedRoadmapRow> => {
  const { data, error } = await supabase
    .from('saved_roadmaps')
    .insert({
      user_id: userId,
      title,
      description,
      nodes_json: nodes,
      edges_json: edges,
    })
    .select()
    .single();

  if (error) throw new Error(`Error al guardar la ruta: ${error.message}`);
  return data;
};

export const getRoadmapHistory = async (userId: string): Promise<RoadmapSummary[]> => {
  const { data, error } = await supabase
    .from('saved_roadmaps')
    .select('id, title, description, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al obtener historial: ${error.message}`);
  return data ?? [];
};

export const getRoadmapById = async (roadmapId: string): Promise<SavedRoadmapRow | null> => {
  const { data, error } = await supabase
    .from('saved_roadmaps')
    .select('*')
    .eq('id', roadmapId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error al obtener la ruta: ${error.message}`);
  }
  return data;
};

export const deleteRoadmap = async (roadmapId: string): Promise<void> => {
  const { error } = await supabase
    .from('saved_roadmaps')
    .delete()
    .eq('id', roadmapId);

  if (error) throw new Error(`Error al eliminar la ruta: ${error.message}`);
};

// Convierte una fila guardada a un objeto Roadmap para usar en las pantallas
export const rowToRoadmap = (row: SavedRoadmapRow): Roadmap => ({
  title: row.title,
  description: row.description ?? '',
  nodes: row.nodes_json,
  edges: row.edges_json,
});

// ============================================================
// user_progress (marcar nodos como completados)
// ============================================================

export const toggleNodeComplete = async (
  userId: string,
  roadmapId: string,
  nodeId: string,
  completed: boolean
): Promise<void> => {
  if (completed) {
    const { error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: userId,
          roadmap_id: roadmapId,
          node_id: nodeId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, roadmap_id, node_id' }
      );

    if (error) throw new Error(`Error al marcar nodo: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId)
      .eq('roadmap_id', roadmapId)
      .eq('node_id', nodeId);

    if (error) throw new Error(`Error al desmarcar nodo: ${error.message}`);
  }
};

export const getRoadmapProgress = async (
  userId: string,
  roadmapId: string
): Promise<Record<string, boolean>> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('node_id, completed')
    .eq('user_id', userId)
    .eq('roadmap_id', roadmapId);

  if (error) throw new Error(`Error al obtener progreso: ${error.message}`);

  const progress: Record<string, boolean> = {};
  (data ?? []).forEach((p) => {
    progress[p.node_id] = p.completed;
  });
  return progress;
};
