-- Garante colunas necessárias na tabela users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS horimetro_atual NUMERIC DEFAULT 0;

-- Logs de horas reais
CREATE TABLE IF NOT EXISTS public.flight_hours_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    piloto_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tipo TEXT CHECK (tipo IN ('adicao', 'correcao', 'ocr')),
    horimetro_inicial NUMERIC,
    horimetro_final NUMERIC,
    horas_adicionadas NUMERIC,
    horas_antes NUMERIC,
    horas_depois NUMERIC,
    foto_url TEXT,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários dos comandantes
CREATE TABLE IF NOT EXISTS public.cmte_comentarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    piloto_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    lido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flight_logs_piloto
ON public.flight_hours_logs(piloto_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comentarios_piloto
ON public.cmte_comentarios(piloto_id, created_at DESC);
