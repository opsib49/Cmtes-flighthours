import { getProfile, getHorasReais, criarComentario, listarComentarios, logout } from './main.js'

export class FlightHours {
  constructor() {
    this.profile = null
    this.horas = []
    this.comentarios = []
  }

  async init() {
    this.profile = await getProfile()

    if (!this.profile) {
      window.location.href = '/login.html'
      return
    }

    await this.carregarDados()
    this.render()
  }

  async carregarDados() {
    this.horas = await getHorasReais()
    this.comentarios = await listarComentarios()
  }

  getTotalHorasReais() {
    return this.horas.reduce((total, item) => {
      return total + Number(item.horas_adicionadas || 0)
    }, 0)
  }

  render() {
    const app = document.getElementById('app')

    if (!app) return

    const foto = this.profile.foto_url
      ? `<img src="${this.profile.foto_url}" class="avatar" alt="Foto do comandante">`
      : `<div class="avatar" style="display:flex;align-items:center;justify-content:center;">${this.getIniciais(this.profile.nome)}</div>`

    app.innerHTML = `
      <div class="container">
        <div class="card">
          ${foto}
          <h2>${this.profile.nome}</h2>
          <p style="text-align:center;color:#94a3b8;">${this.profile.email}</p>

          <div style="text-align:center;margin-top:20px;">
            <h1>${this.getTotalHorasReais().toFixed(1)}h</h1>
            <p>Horas reais registradas</p>
          </div>

          <button id="btnJogo">🎲 Corrida Maluca</button>
          <button id="btnLogout" class="secondary">Sair</button>
        </div>

        <div class="card" style="margin-top:15px;">
          <h3>Histórico de Horas</h3>
          <div id="listaHoras">
            ${this.renderHistoricoHoras()}
          </div>
        </div>

        <div class="card" style="margin-top:15px;">
          <h3>Comentário rápido</h3>
          <textarea id="comentarioTexto" placeholder="Deixe um comentário..." style="width:100%;min-height:80px;border-radius:10px;padding:10px;background:#020503;color:white;border:1px solid rgba(16,185,129,.2);"></textarea>
          <button id="btnComentario">Enviar comentário</button>

          <div id="listaComentarios" style="margin-top:15px;">
            ${this.renderComentarios()}
          </div>
        </div>
      </div>
    `

    document.getElementById('btnJogo').addEventListener('click', () => {
      window.location.href = '/game.html'
    })

    document.getElementById('btnLogout').addEventListener('click', logout)

    document.getElementById('btnComentario').addEventListener('click', async () => {
      const texto = document.getElementById('comentarioTexto').value.trim()
      if (!texto) return alert('Digite um comentário.')

      await criarComentario(texto)
      document.getElementById('comentarioTexto').value = ''

      await this.carregarDados()
      this.render()
    })
  }

  renderHistoricoHoras() {
    if (!this.horas.length) {
      return `<p style="color:#94a3b8;text-align:center;">Nenhuma hora registrada ainda.</p>`
    }

    return this.horas.map(item => `
      <div style="border:1px solid rgba(16,185,129,.15);border-radius:12px;padding:10px;margin-top:8px;background:#020503;">
        <strong style="color:#10b981;">+${Number(item.horas_adicionadas || 0).toFixed(1)}h</strong>
        <p style="font-size:13px;color:#cbd5e1;">
          Horímetro: ${item.horimetro_inicial} → ${item.horimetro_final}
        </p>
        <small style="color:#94a3b8;">
          ${new Date(item.created_at).toLocaleString('pt-BR')}
        </small>
        ${item.foto_url ? `<br><a href="${item.foto_url}" target="_blank">📸 Ver evidência</a>` : ''}
      </div>
    `).join('')
  }

  renderComentarios() {
    if (!this.comentarios.length) {
      return `<p style="color:#94a3b8;text-align:center;">Nenhum comentário enviado.</p>`
    }

    return this.comentarios.map(c => `
      <div style="border-left:3px solid #10b981;padding:8px;margin-top:8px;background:#020503;border-radius:8px;">
        <p>${this.escapeHTML(c.texto)}</p>
        <small style="color:#94a3b8;">
          ${new Date(c.created_at).toLocaleString('pt-BR')}
        </small>
      </div>
    `).join('')
  }

  getIniciais(nome) {
    return String(nome || '--')
      .trim()
      .slice(0, 2)
      .toUpperCase()
  }

  escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }
}

window.flightHours = new FlightHours()
