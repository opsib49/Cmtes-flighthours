import { apiFetch } from '/js/supabase-config.js'

export default class RaceGame {
  constructor() {
    this.user = null
    this.ranking = []
    this.feed = []
  }

  async init() {
    await this.loadUser()
    await this.loadRanking()
    await this.loadFeed()
    await this.loadStatus()
  }

  async loadUser() {
    const data = await apiFetch('/api/me')
    this.user = data.user
    return this.user
  }

  async loadRanking() {
    const data = await apiFetch('/api/game/ranking')
    this.ranking = data.players || []
    return this.ranking
  }

  async loadFeed() {
    const data = await apiFetch('/api/game/feed')
    this.feed = data.feed || []
    return this.feed
  }

  async loadStatus() {
    const data = await apiFetch('/api/game/status')
    return data
  }

  async roll() {
    return await apiFetch('/api/game/roll', {
      method: 'POST'
    })
  }

  async getVictims() {
    const data = await apiFetch('/api/game/victims')
    return data.victims || []
  }

  async sabotage(victimId) {
    return await apiFetch('/api/game/sabotage', {
      method: 'POST',
      body: JSON.stringify({ victimId })
    })
  }

  getMyRankingPosition() {
    if (!this.user || !this.ranking.length) return null

    const index = this.ranking.findIndex(p => p.id === this.user.id)
    return index >= 0 ? index + 1 : null
  }

  renderRanking(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return

    if (!this.ranking.length) {
      container.innerHTML = `<p style="color:#94a3b8;text-align:center;">Ranking vazio.</p>`
      return
    }

    container.innerHTML = this.ranking.map((p, i) => {
      const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
      const souEu = this.user && p.id === this.user.id

      return `
        <div class="ranking-line" style="${souEu ? 'border-color:#facc15;' : ''}">
          <span>${medalha} ${this.escapeHTML(p.nome)}</span>
          <strong>${Number(p.horas_gamificadas || 0)}h</strong>
        </div>
      `
    }).join('')
  }

  renderFeed(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return

    if (!this.feed.length) {
      container.innerHTML = `<p style="color:#94a3b8;text-align:center;">Nenhuma atividade ainda.</p>`
      return
    }

    container.innerHTML = this.feed.map(item => `
      <div class="feed-line">
        ${this.escapeHTML(item.mensagem)}
        <small>${new Date(item.timestamp).toLocaleString('pt-BR')}</small>
      </div>
    `).join('')
  }

  async abrirModalSabotagem(onDone = null) {
    const victims = await this.getVictims()

    const modal = document.createElement('div')
    modal.className = 'modal-sabotagem'

    modal.innerHTML = `
      <div class="modal-card">
        <h2>🦊 DICK VIGARISTA</h2>
        <p>Escolha uma vítima para roubar 2 horas fictícias.</p>

        <div class="victim-list">
          ${
            victims.length
              ? victims.map(v => `
                <button 
                  class="victim-btn ${v.protegido ? 'disabled' : ''}" 
                  data-id="${v.id}" 
                  ${v.protegido ? 'disabled' : ''}
                >
                  <strong>${this.escapeHTML(v.nome)}</strong>
                  <span>${Number(v.horas_gamificadas || 0)}h fictícias</span>
                  ${v.protegido ? '<small>Protegido</small>' : ''}
                </button>
              `).join('')
              : '<p style="color:#94a3b8;">Nenhum comandante disponível.</p>'
          }
        </div>

        <button id="cancelarSabotagem" class="btn-cancelar">Cancelar</button>
      </div>
    `

    document.body.appendChild(modal)

    modal.querySelectorAll('.victim-btn:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const result = await this.sabotage(btn.dataset.id)
          alert(result.mensagem)

          modal.remove()

          await this.init()

          if (typeof onDone === 'function') {
            onDone(result)
          }
        } catch (e) {
          alert(e.message)
        }
      })
    })

    modal.querySelector('#cancelarSabotagem')?.addEventListener('click', () => {
      modal.remove()
    })
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
