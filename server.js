import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POWER_AUTOMATE_WEBHOOK_URL = process.env.POWER_AUTOMATE_WEBHOOK_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️ Variáveis do Supabase ausentes. Configure o .env ou o Render.');
}

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// =============================
// HELPERS SUPABASE
// =============================
function serviceHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

function anonHeaders(token, extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function supabaseRest(pathname, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      ...serviceHeaders(),
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.message || data?.error || text || 'Erro Supabase');
  }

  return data;
}

async function getUserFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();

  if (!token) {
    throw new Error('Sessão ausente.');
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: anonHeaders(token)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.msg || data?.message || 'Sessão inválida.');
  }

  return data;
}

async function getProfile(userId) {
  const data = await supabaseRest(`users?id=eq.${userId}&select=*`, {
    method: 'GET'
  });

  if (!data?.length) {
    throw new Error('Perfil não encontrado.');
  }

  return data[0];
}

async function requireAdmin(req) {
  const authUser = await getUserFromRequest(req);
  const profile = await getProfile(authUser.id);

  if (profile.perfil !== 'admin') {
    throw new Error('Acesso restrito ao administrador.');
  }

  return profile;
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function limparNomeArquivo(value = 'arquivo') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();
}

async function uploadBase64ToStorage(base64, bucket, filePath) {
  if (!base64 || !base64.includes(',')) {
    throw new Error('Imagem inválida.');
  }

  const [meta, data] = base64.split(',');
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const buffer = Buffer.from(data, 'base64');

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`,
    {
      method: 'PUT',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: buffer
    }
  );

  const result = await res.text();

  if (!res.ok) {
    throw new Error(result || 'Erro ao salvar imagem.');
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
}

async function dispararAutomacaoHoras(payload) {
  if (!POWER_AUTOMATE_WEBHOOK_URL) {
    console.log('Automação não configurada:', payload);
    return;
  }

  try {
    await fetch(POWER_AUTOMATE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Falha na automação:', e.message);
  }
}

async function updateUserHours(userId, delta) {
  const profile = await getProfile(userId);
  const atual = Number(profile.horas_gamificadas || 0);
  const novo = Math.max(0, atual + Number(delta || 0));

  await supabaseRest(`users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      horas_gamificadas: novo
    })
  });

  return novo;
}

// =============================
// CONFIG PÚBLICA
// =============================
app.get('/api/public-config', (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY
  });
});

// =============================
// HEALTH
// =============================
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// =============================
// PERFIL LOGADO
// =============================
app.get('/api/me', async (req, res) => {
  try {
    const authUser = await getUserFromRequest(req);
    const profile = await getProfile(authUser.id);

    res.json({
      ok: true,
      user: profile
    });
  } catch (e) {
    res.status(401).json({
      ok: false,
      erro: e.message
    });
  }
});

// =============================
// GAME
// =============================
app.get('/api/game/ranking', async (req, res) => {
  try {
    const players = await supabaseRest(
      'users?select=id,nome,email,patente,horas_gamificadas&order=horas_gamificadas.desc',
      { method: 'GET' }
    );

    res.json({ ok: true, players });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

app.get('/api/game/feed', async (req, res) => {
  try {
    const feed = await supabaseRest(
      'game_feed?select=*&order=timestamp.desc&limit=20',
      { method: 'GET' }
    );

    res.json({ ok: true, feed });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

app.get('/api/game/status', async (req, res) => {
  try {
    const authUser = await getUserFromRequest(req);
    const today = hojeISO();

    const jogadas = await supabaseRest(
      `daily_race?user_id=eq.${authUser.id}&data=eq.${today}&select=id`,
      { method: 'GET' }
    );

    res.json({
      ok: true,
      hasPlayedToday: jogadas.length > 0
    });
  } catch (e) {
    res.status(401).json({ ok: false, erro: e.message });
  }
});

app.post('/api/game/roll', async (req, res) => {
  try {
    const authUser = await getUserFromRequest(req);
    const profile = await getProfile(authUser.id);
    const today = hojeISO();

    const jogadas = await supabaseRest(
      `daily_race?user_id=eq.${authUser.id}&data=eq.${today}&select=id`,
      { method: 'GET' }
    );

    if (jogadas.length) {
      throw new Error('Você já correu hoje.');
    }

    const valorDado = Math.floor(Math.random() * 6) + 1;

    const regras = {
      1: { acao: 'penalty', delta: -2, mensagem: '💥 Pneu furado! Perdeu 2h fictícias.' },
      2: { acao: 'boost', delta: 1, mensagem: '🏎️ Atalho encontrado! Ganhou 1h fictícia.' },
      3: { acao: 'neutral', delta: 0, mensagem: '🚗 Dia normal. Sem ganhos ou perdas.' },
      4: { acao: 'vision', delta: 0, mensagem: '🦅 Olho de águia! Nada muda nas horas.' },
      5: { acao: 'boost', delta: 3, mensagem: '⚡ Turbo! Ganhou 3h fictícias.' },
      6: { acao: 'sabotage', delta: 0, mensagem: '🦊 Dick Vigarista! Escolha uma vítima.' }
    };

    const regra = regras[valorDado];

    await supabaseRest('daily_race', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: authUser.id,
        data: today,
        valor_dado: valorDado,
        acao: regra.acao
      })
    });

    if (regra.delta !== 0) {
      await updateUserHours(authUser.id, regra.delta);
    }

    await supabaseRest('game_feed', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: authUser.id,
        mensagem: `${profile.nome}: ${regra.mensagem}`,
        timestamp: new Date().toISOString()
      })
    });

    res.json({
      ok: true,
      valorDado,
      mensagem: regra.mensagem,
      precisaEscolherAlvo: regra.acao === 'sabotage'
    });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

app.get('/api/game/victims', async (req, res) => {
  try {
    const authUser = await getUserFromRequest(req);

    const users = await supabaseRest(
      `users?id=neq.${authUser.id}&select=id,nome,patente,horas_gamificadas`,
      { method: 'GET' }
    );

    const protections = await supabaseRest(
      'vigarista_protection?select=user_id,data_protegido_ate',
      { method: 'GET' }
    );

    const now = new Date();

    const victims = users.map(u => {
      const prot = protections.find(p => p.user_id === u.id);
      return {
        ...u,
        protegido: prot ? new Date(prot.data_protegido_ate) > now : false
      };
    });

    res.json({ ok: true, victims });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

app.post('/api/game/sabotage', async (req, res) => {
  try {
    const authUser = await getUserFromRequest(req);
    const attacker = await getProfile(authUser.id);
    const { victimId } = req.body || {};

    if (!victimId) throw new Error('Vítima não informada.');

    const victim = await getProfile(victimId);

    const protections = await supabaseRest(
      `vigarista_protection?user_id=eq.${victimId}&select=*`,
      { method: 'GET' }
    );

    if (protections.length && new Date(protections[0].data_protegido_ate) > new Date()) {
      throw new Error('Esse comandante está protegido.');
    }

    await updateUserHours(victimId, -2);
    await updateUserHours(authUser.id, 2);

    const protectedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await supabaseRest('vigarista_protection', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        user_id: victimId,
        data_protegido_ate: protectedUntil
      })
    });

    const mensagem = `🦊 ${attacker.nome} sabotou ${victim.nome} e roubou 2h fictícias.`;

    await supabaseRest('game_feed', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: authUser.id,
        mensagem,
        timestamp: new Date().toISOString()
      })
    });

    res.json({
      ok: true,
      mensagem
    });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

// =============================
// ADMIN
// =============================
app.post('/api/admin/flight-hours', async (req, res) => {
  try {
    const admin = await requireAdmin(req);

    const {
      piloto_id,
      horimetro_inicial,
      horimetro_final,
      horas_adicionadas,
      foto_base64,
      observacao
    } = req.body || {};

    if (!piloto_id) throw new Error('Comandante não informado.');

    const piloto = await getProfile(piloto_id);

    const inicial = Number(horimetro_inicial);
    const final = Number(horimetro_final);
    const horas = Number(horas_adicionadas);

    if (!Number.isFinite(inicial) || !Number.isFinite(final) || !Number.isFinite(horas)) {
      throw new Error('Dados de horímetro inválidos.');
    }

    if (final < inicial || horas <= 0) {
      throw new Error('Horímetro final precisa ser maior que o inicial.');
    }

    const filePath = `evidencias/${piloto_id}/${Date.now()}-${limparNomeArquivo(piloto.nome)}.jpg`;

    const fotoUrl = await uploadBase64ToStorage(
      foto_base64,
      'flight-hours',
      filePath
    );

    await supabaseRest(`users?id=eq.${piloto_id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        horimetro_atual: final
      })
    });

    await supabaseRest('flight_hours_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        piloto_id,
        admin_id: admin.id,
        tipo: 'adicao',
        horimetro_inicial: inicial,
        horimetro_final: final,
        horas_adicionadas: horas,
        horas_antes: Number(piloto.horimetro_atual || 0),
        horas_depois: final,
        foto_url: fotoUrl,
        observacao: observacao || null
      })
    });

    await supabaseRest('calendar_events', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        piloto_id,
        data: hojeISO(),
        status: 'VOADO',
        horas,
        horimetro_inicial: inicial,
        horimetro_final: final,
        foto_url: fotoUrl,
        observacao: observacao || null,
        origem: 'ADMIN',
        aprovado: true
      })
    });

    await dispararAutomacaoHoras({
      piloto_id,
      nome: piloto.nome,
      telefone: piloto.telefone,
      admin_id: admin.id,
      admin_nome: admin.nome,
      horimetro_inicial: inicial,
      horimetro_final: final,
      horas_adicionadas: horas,
      foto_url: fotoUrl,
      observacao: observacao || ''
    });

    res.json({
      ok: true,
      piloto_id,
      mensagem: `Lançamento confirmado: +${horas.toFixed(1)}h para ${piloto.nome}.`,
      foto_url: fotoUrl
    });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

app.post('/api/admin/profile-photo', async (req, res) => {
  try {
    await requireAdmin(req);

    const { piloto_id, foto_base64 } = req.body || {};

    if (!piloto_id) throw new Error('Comandante não informado.');
    if (!foto_base64) throw new Error('Foto não enviada.');

    const piloto = await getProfile(piloto_id);
    const filePath = `perfis/${piloto_id}/perfil.jpg`;

    const fotoUrl = await uploadBase64ToStorage(
      foto_base64,
      'flight-hours',
      filePath
    );

    await supabaseRest(`users?id=eq.${piloto_id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        foto_url: fotoUrl
      })
    });

    res.json({
      ok: true,
      mensagem: `Foto de ${piloto.nome} atualizada.`,
      foto_url: fotoUrl
    });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

app.post('/api/admin/delete-profile-photo', async (req, res) => {
  try {
    await requireAdmin(req);

    const { piloto_id } = req.body || {};
    if (!piloto_id) throw new Error('Comandante não informado.');

    const piloto = await getProfile(piloto_id);

    await supabaseRest(`users?id=eq.${piloto_id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        foto_url: null
      })
    });

    res.json({
      ok: true,
      mensagem: `Foto de ${piloto.nome} removida.`
    });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

// =============================
// ARQUIVOS ESTÁTICOS
// =============================
app.use(express.static(path.join(__dirname, 'public')));

// =============================
// FALLBACK
// =============================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================
// START
// =============================
app.listen(PORT, () => {
  console.log(`🚀 VOARE FlightHours rodando na porta ${PORT}`);
});
