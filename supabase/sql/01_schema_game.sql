CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    patente TEXT DEFAULT 'Comandante',
    email TEXT UNIQUE NOT NULL,
    perfil TEXT DEFAULT 'cmte' CHECK (perfil IN ('admin', 'cmte')),

    telefone TEXT,
    foto_url TEXT,

    horimetro_atual NUMERIC DEFAULT 0,
    horas_gamificadas INTEGER DEFAULT 0 CHECK (horas_gamificadas >= 0),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_race (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    valor_dado INTEGER CHECK (valor_dado BETWEEN 1 AND 6),
    acao TEXT,
    alvo_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, data)
);

CREATE TABLE IF NOT EXISTS public.vigarista_protection (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    data_protegido_ate TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.game_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mensagem TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.cmte_comentarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    piloto_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    lido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_horas_game
ON public.users(horas_gamificadas DESC);

CREATE INDEX IF NOT EXISTS idx_daily_race_user_data
ON public.daily_race(user_id, data);

CREATE INDEX IF NOT EXISTS idx_protection_until
ON public.vigarista_protection(data_protegido_ate);

CREATE INDEX IF NOT EXISTS idx_feed_timestamp
ON public.game_feed(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_flight_logs_piloto
ON public.flight_hours_logs(piloto_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comentarios_piloto
ON public.cmte_comentarios(piloto_id, created_at DESC);
