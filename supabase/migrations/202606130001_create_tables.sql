-- ============================================================
-- Migration: Crear tablas para AlphaStudio AI
-- Fecha: 2026-06-13
-- ============================================================

-- 1. saved_roadmaps: Rutas de aprendizaje guardadas
CREATE TABLE IF NOT EXISTS saved_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  nodes_json JSONB NOT NULL DEFAULT '[]',
  edges_json JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. user_progress: Progreso del usuario en nodos de rutas
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES saved_roadmaps(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, roadmap_id, node_id)
);

-- 3. check_ins: Check-in diario del usuario
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evitar múltiples check-ins por día (usando índice funcional)
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_user_date
  ON check_ins(user_id, CAST(created_at AS DATE));

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_saved_roadmaps_user_id ON saved_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_roadmaps_created_at ON saved_roadmaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_roadmap ON user_progress(user_id, roadmap_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- saved_roadmaps
ALTER TABLE saved_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roadmaps"
  ON saved_roadmaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roadmaps"
  ON saved_roadmaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps"
  ON saved_roadmaps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps"
  ON saved_roadmaps FOR DELETE
  USING (auth.uid() = user_id);

-- user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- check_ins
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-ins"
  ON check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Trigger: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_saved_roadmaps_updated_at
  BEFORE UPDATE ON saved_roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
