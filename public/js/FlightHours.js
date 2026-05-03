export class FlightHours {
  constructor(eventos) {
    this.eventos = eventos || [];
  }

  // =========================
  // 🔹 HORAS DE UM DIA
  // =========================
  getHorasDoDia(data) {
    const dia = this.eventos.find(e => e.data === data);
    return dia?.horas || 0;
  }

  // =========================
  // 🔹 STATUS DO DIA
  // =========================
  getStatusDoDia(data) {
    const dia = this.eventos.find(e => e.data === data);
    return dia?.status || 'SEM REGISTRO';
  }

  // =========================
  // 🔹 TOTAL NO MÊS
  // =========================
  getTotalMes(ano, mes) {
    return this.eventos
      .filter(e => {
        const d = new Date(e.data);
        return d.getFullYear() === ano && (d.getMonth()+1) === mes;
      })
      .reduce((total, e) => total + (e.horas || 0), 0);
  }

  // =========================
  // 🔹 DIAS VOADOS
  // =========================
  getDiasVoados(ano, mes) {
    return this.eventos.filter(e => {
      const d = new Date(e.data);
      return e.status === 'VOADO' &&
             d.getFullYear() === ano &&
             (d.getMonth()+1) === mes;
    }).length;
  }

  // =========================
  // 🔹 DIAS CONSECUTIVOS
  // =========================
  getDiasConsecutivos() {
    const ordenado = this.eventos
      .filter(e => e.status === 'VOADO')
      .sort((a,b) => new Date(a.data) - new Date(b.data));

    let max = 0;
    let atual = 0;
    let anterior = null;

    ordenado.forEach(e => {
      const dataAtual = new Date(e.data);

      if (anterior) {
        const diff = (dataAtual - anterior) / (1000*60*60*24);

        if (diff === 1) {
          atual++;
        } else {
          atual = 1;
        }
      } else {
        atual = 1;
      }

      if (atual > max) max = atual;
      anterior = dataAtual;
    });

    return max;
  }

  // =========================
  // 🔹 PRÓXIMA FOLGA
  // =========================
  getProximaFolga() {
    const hoje = new Date();

    const futura = this.eventos
      .filter(e => {
        const d = new Date(e.data);
        return d > hoje && e.status.includes('FOLGA');
      })
      .sort((a,b) => new Date(a.data) - new Date(b.data));

    return futura[0]?.data || null;
  }

  // =========================
  // 🔹 PREVISÃO DE HORAS
  // =========================
  getPrevisao(horasPorDia, dias) {
    return horasPorDia * dias;
  }

  // =========================
  // 🔹 TOTAL + PREVISÃO
  // =========================
  getTotalComPrevisao(ano, mes, horasPorDia, dias) {
    const atual = this.getTotalMes(ano, mes);
    const previsao = this.getPrevisao(horasPorDia, dias);
    return atual + previsao;
  }
}
