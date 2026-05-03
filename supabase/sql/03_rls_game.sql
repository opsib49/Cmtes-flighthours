-- ATIVAR RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_race ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_hours_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmte_comentarios ENABLE ROW LEVEL SECURITY;

-- ============================
-- 👤 USERS
-- ============================

-- Todos podem ver perfis
CREATE POLICY "ver_perfis"
ON public.users
FOR SELECT
USING (true);

-- Usuário só atualiza próprio perfil
CREATE POLICY "editar_proprio_perfil"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- ============================
-- 🎲 JOGO
-- ============================

-- Inserir jogada
CREATE POLICY "inserir_jogada"
ON public.daily_race
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ver jogadas
CREATE POLICY "ver_jogadas"
ON public.daily_race
FOR SELECT
USING (true);

-- ============================
-- 📢 FEED
-- ============================

CREATE POLICY "ver_feed"
ON public.game_feed
FOR SELECT
USING (true);

CREATE POLICY "inserir_feed"
ON public.game_feed
FOR INSERT
WITH CHECK (true);

-- ============================
-- ✈️ HORAS DE VOO (ADMIN)
-- ============================

-- Apenas admin pode inserir logs
CREATE POLICY "admin_insere_logs"
ON public.flight_hours_logs
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND perfil = 'admin'
    )
);

-- Comandante pode ver suas horas
CREATE POLICY "cmte_ver_proprias_horas"
ON public.flight_hours_logs
FOR SELECT
USING (
    piloto_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND perfil = 'admin'
    )
);

-- ============================
-- 💬 COMENTÁRIOS
-- ============================

CREATE POLICY "cmte_criar_comentario"
ON public.cmte_comentarios
FOR INSERT
WITH CHECK (piloto_id = auth.uid());

CREATE POLICY "ver_comentarios"
ON public.cmte_comentarios
FOR SELECT
USING (
    piloto_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND perfil = 'admin'
    )
);
