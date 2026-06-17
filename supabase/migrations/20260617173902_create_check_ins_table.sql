-- 1. Crear la tabla check_ins
CREATE TABLE public.check_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Índice único para evitar dobles check-ins el mismo día
-- (Dispara el error '23505' esperado por la aplicación)
CREATE UNIQUE INDEX check_ins_user_date_idx ON public.check_ins (user_id, ((created_at AT TIME ZONE 'UTC')::date));

-- 3. Habilitar la seguridad a nivel de fila (RLS)
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- 4. Crear política para que los usuarios puedan ver sus propios check-ins
CREATE POLICY "Los usuarios pueden ver sus propios check-ins" 
    ON public.check_ins
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 5. Crear política para que los usuarios puedan registrar sus check-ins
CREATE POLICY "Los usuarios pueden insertar sus propios check-ins" 
    ON public.check_ins
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
