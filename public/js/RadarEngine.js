import FlightHours from './FlightHours.js';

class RadarEngine {

    constructor() {
        this.currentDate = new Date();
        this.eventos = [];
        this.userId = null;
    }

    async init(userId) {
        this.userId = userId;
        await FlightHours.init();
        this.eventos = await FlightHours.getEventosCalendario(userId);

        this.renderCalendario();
    }

    // =========================
    // RENDER CALENDÁRIO
    // =========================
    renderCalendario() {

        const container = document.getElementById('calendar');
        if (!container) return;

        container.innerHTML = '';

        const ano = this.currentDate.getFullYear();
        const mes = this.currentDate.getMonth();

        const primeiroDia = new Date(ano, mes, 1).getDay();
        const totalDias = new Date(ano, mes + 1, 0).getDate();

        for (let i = 0; i < primeiroDia; i++) {
            container.innerHTML += `<div class="day empty"></div>`;
        }

        for (let dia = 1; dia <= totalDias; dia++) {

            const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

            const resumo = FlightHours.getResumoDia(this.eventos, dataStr);

            container.innerHTML += `
                <div class="day" data-date="${dataStr}">
                    <div class="numero">${dia}</div>
                    <div class="horas">${resumo.horas || ''}</div>
                </div>
            `;
        }

        this.bindEventosDias();
    }

    // =========================
    // CLICK NO DIA
    // =========================
    bindEventosDias() {
        document.querySelectorAll('.day').forEach(el => {
            el.addEventListener('click', () => {
                const data = el.dataset.date;

                if (!data) return;

                this.toggleModal(data);
            });
        });
    }

    // =========================
    // MODAL FLUTUANTE
    // =========================
    toggleModal(data) {

        let modal = document.getElementById('dayModal');

        if (modal) {
            modal.remove();
            return;
        }

        const resumo = FlightHours.getResumoDia(this.eventos, data);

        modal = document.createElement('div');
        modal.id = 'dayModal';

        modal.innerHTML = `
            <div class="modal-box">
                <h3>${data}</h3>

                <p><strong>Status:</strong> ${resumo.status}</p>
                <p><strong>Horas:</strong> ${resumo.horas}</p>

                ${resumo.horimetro_inicial ? `<p>Inicial: ${resumo.horimetro_inicial}</p>` : ''}
                ${resumo.horimetro_final ? `<p>Final: ${resumo.horimetro_final}</p>` : ''}

                ${resumo.foto_url ? `<img src="${resumo.foto_url}" style="width:100%; border-radius:10px;">` : ''}

                <textarea id="justificativa" placeholder="Justificativa..." style="width:100%; margin-top:10px;"></textarea>

                <button id="btnFolga">Solicitar Folga</button>
                <button id="btnAjuste">Solicitar Ajuste</button>
                <button id="btnFechar">Fechar</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Eventos dos botões
        document.getElementById('btnFechar').onclick = () => modal.remove();

        document.getElementById('btnFolga').onclick = async () => {
            const justificativa = document.getElementById('justificativa').value;

            await FlightHours.solicitarFolga(this.userId, data, justificativa);

            alert('Solicitação de folga enviada!');
            modal.remove();
        };

        document.getElementById('btnAjuste').onclick = async () => {
            const justificativa = document.getElementById('justificativa').value;

            await FlightHours.solicitarAjuste(this.userId, data, justificativa);

            alert('Solicitação de ajuste enviada!');
            modal.remove();
        };
    }

    // =========================
    // RESUMOS AVANÇADOS
    // =========================
    renderResumoMensal() {

        const ano = this.currentDate.getFullYear();
        const mes = this.currentDate.getMonth() + 1;

        const total = FlightHours.getTotalMes(this.eventos, ano, mes);
        const dias = FlightHours.getDiasVoados(this.eventos, ano, mes);
        const consecutivos = FlightHours.getDiasConsecutivosVoados(this.eventos);
        const folga = FlightHours.getProximaFolga(this.eventos);

        document.getElementById('totalHoras').textContent = total;
        document.getElementById('diasVoados').textContent = dias;
        document.getElementById('diasConsecutivos').textContent = consecutivos;

        if (folga) {
            document.getElementById('proximaFolga').textContent = folga.data;
        }
    }

}

export default new RadarEngine();
