import { supabase } from './supabase-config.js';

class FlightHours {
  async getUsuarioAtual() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error('Usuário não autenticado.');
    return data.user;
  }

  calcularHoras(inicial, final) {
    const ini = Number(inicial);
    const fim = Number(final);

    if (!Number.isFinite(ini) || !Number.isFinite(fim)) {
      throw new Error('Horímetros inválidos.');
    }

    if (fim < ini) {
      throw new Error('Horímetro final menor que o inicial.');
    }

    return Number((fim - ini).toFixed(1));
  }

  async uploadFoto(file, userId) {
    if (!file) throw new Error('Selecione uma foto.');

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `horimetros/${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase
      .storage
      .from('flight-hours')
      .upload(fileName, file, {
        upsert: true
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase
      .storage
      .from('flight-hours')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async registrarHorasComFoto({
    data_voo,
    horimetro_inicial,
    horimetro_final,
    fotoFile,
    observacao = ''
  }) {
    const user = await this.getUsuarioAtual();

    const horas_voadas = this.calcularHoras(
      horimetro_inicial,
      horimetro_final
    );

    const foto_url = await this.uploadFoto(fotoFile, user.id);

    const { data, error } = await supabase
      .from('flight_hours')
      .insert({
        user_id: user.id,
        data_voo,
        horimetro_inicial,
        horimetro_final,
        foto_url,
        status: 'pendente',
        observacao
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      ...data,
      horas_voadas
    };
  }

  async getMinhasHoras() {
    const user = await this.getUsuarioAtual();

    const { data, error } = await supabase
      .from('flight_hours')
      .select('*')
      .eq('user_id', user.id)
      .order('data_voo', { ascending: false });

    if (error) throw new Error(error.message);

    return data || [];
  }

  async getResumoDia(data_voo) {
    const user = await this.getUsuarioAtual();

    const { data, error } = await supabase
      .from('flight_hours')
      .select('*')
      .eq('user_id', user.id)
      .eq('data_voo', data_voo);

    if (error) throw new Error(error.message);

    const registros = data || [];

    const totalHoras = registros.reduce((total, item) => {
      return total + Number(item.horas_voadas || 0);
    }, 0);

    return {
      data_voo,
      totalHoras,
      registros
    };
  }

  async getEventosCalendario() {
    const user = await this.getUsuarioAtual();

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: true });

    if (error) throw new Error(error.message);

    return data || [];
  }

  async solicitarFolga(data, mensagem) {
    const user = await this.getUsuarioAtual();

    const { error } = await supabase
      .from('requests')
      .insert({
        user_id: user.id,
        data,
        tipo: 'folga',
        mensagem,
        status: 'pendente'
      });

    if (error) throw new Error(error.message);
  }

  async solicitarAjuste(data, mensagem) {
    const user = await this.getUsuarioAtual();

    const { error } = await supabase
      .from('requests')
      .insert({
        user_id: user.id,
        data,
        tipo: 'ajuste',
        mensagem,
        status: 'pendente'
      });

    if (error) throw new Error(error.message);
  }

  async getTotalMes(ano, mes) {
    const user = await this.getUsuarioAtual();

    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const fim = new Date(ano, mes, 0).toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('flight_hours')
      .select('horas_voadas')
      .eq('user_id', user.id)
      .gte('data_voo', inicio)
      .lte('data_voo', fim)
      .eq('status', 'aprovado');

    if (error) throw new Error(error.message);

    return (data || []).reduce((total, item) => {
      return total + Number(item.horas_voadas || 0);
    }, 0);
  }

  preverHoras(horasPorDia, dias) {
    return Number((Number(horasPorDia || 0) * Number(dias || 0)).toFixed(1));
  }
}

export default new FlightHours();
