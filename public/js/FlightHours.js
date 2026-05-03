import { getSupabase } from '/js/supabase-config.js';

export class FlightHours {
  constructor() {
    this.supabase = null;
  }

  async init() {
    this.supabase = await getSupabase();
  }

  calcularHoras(horimetroInicial, horimetroFinal) {
    const inicial = Number(horimetroInicial);
    const final = Number(horimetroFinal);

    if (!Number.isFinite(inicial) || !Number.isFinite(final)) {
      throw new Error('Horímetros inválidos.');
    }

    if (final < inicial) {
      throw new Error('Horímetro final menor que o inicial.');
    }

    return Number((final - inicial).toFixed(1));
  }

  async getPerfilUsuario(userId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getEventosCalendario(pilotoId) {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('*')
      .eq('piloto_id', pilotoId)
      .order('data', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getLogsHoras(pilotoId) {
    const { data, error } = await this.supabase
      .from('flight_hours_logs')
      .select('*')
      .eq('piloto_id', pilotoId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  getResumoDia(eventos, data) {
    const evento = eventos.find(e => e.data === data);

    if (!evento) {
      return {
        data,
        status: 'SEM_REGISTRO',
        horas: 0,
        horimetro_inicial: null,
        horimetro_final: null,
        foto_url: null,
        observacao: ''
      };
    }

    return {
      data: evento.data,
      status: evento.status || 'SEM_REGISTRO',
      horas: Number(evento.horas || 0),
      horimetro_inicial: evento.horimetro_inicial,
      horimetro_final: evento.horimetro_final,
      foto_url: evento.foto_url,
      observacao: evento.observacao || ''
    };
  }

  getTotalMes(eventos, ano, mes) {
    return eventos
      .filter(e => {
        const d = new Date(e.data + 'T00:00:00');
        return d.getFullYear() === ano && d.getMonth() + 1 === mes;
      })
      .reduce((total, e) => total + Number(e.horas || 0), 0);
  }

  getDiasVoados(eventos, ano, mes) {
    return eventos.filter(e => {
      const d = new Date(e.data + 'T00:00:00');
      return (
        e.status === 'VOADO' &&
        d.getFullYear() === ano &&
        d.getMonth() + 1 === mes
      );
    }).length;
  }

  getDiasConsecutivosVoados(eventos) {
    const voados = eventos
      .filter(e => e.status === 'VOADO')
      .map(e => e.data)
      .sort();

    if (!voados.length) return 0;

    let maior = 1;
    let atual = 1;

    for (let i = 1; i < voados.length; i++) {
      const anterior = new Date(voados[i - 1] + 'T00:00:00');
      const corrente = new Date(voados[i] + 'T00:00:00');

      const diff = (corrente - anterior) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        atual++;
        maior = Math.max(maior, atual);
      } else {
        atual = 1;
      }
    }

    return maior;
  }

  getProximaFolga(eventos) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const futuras = eventos
      .filter(e => {
        const d = new Date(e.data + 'T00:00:00');
        return d >= hoje && String(e.status || '').includes('FOLGA');
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    return futuras[0] || null;
  }

  preverHoras(horasPorDia, quantidadeDias) {
    const horas = Number(horasPorDia);
    const dias = Number(quantidadeDias);

    if (!Number.isFinite(horas) || !Number.isFinite(dias)) return 0;

    return Number((horas * dias).toFixed(1));
  }

  getTotalComPrevisao(eventos, ano, mes, horasPorDia, quantidadeDias) {
    const totalAtual = this.getTotalMes(eventos, ano, mes);
    const previsto = this.preverHoras(horasPorDia, quantidadeDias);

    return Number((totalAtual + previsto).toFixed(1));
  }

  async solicitarFolga(pilotoId, data, justificativa) {
    const { error } = await this.supabase
      .from('calendar_requests')
      .insert({
        piloto_id: pilotoId,
        data,
        tipo_solicitacao: 'FOLGA',
        justificativa
      });

    if (error) throw new Error(error.message);
  }

  async solicitarAjuste(pilotoId, data, justificativa) {
    const { error } = await this.supabase
      .from('calendar_requests')
      .insert({
        piloto_id: pilotoId,
        data,
        tipo_solicitacao: 'AJUSTE_HORAS',
        justificativa
      });

    if (error) throw new Error(error.message);
  }
}

export default new FlightHours();
