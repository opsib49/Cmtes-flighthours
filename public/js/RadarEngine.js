export class RadarEngine {
  constructor(containerId) {
    this.container = document.getElementById(containerId)
  }

  init() {
    if (!this.container) return

    this.container.innerHTML = `
      <div class="radar-container">
        <canvas id="radarCanvas"></canvas>
      </div>
    `

    this.canvas = document.getElementById('radarCanvas')
    this.ctx = this.canvas.getContext('2d')

    this.resize()
    window.addEventListener('resize', () => this.resize())

    this.animate()
  }

  resize() {
    this.canvas.width = this.container.offsetWidth
    this.canvas.height = 300
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    this.drawBackground()
    this.drawGrid()
    this.drawSweep()
  }

  drawBackground() {
    const ctx = this.ctx
    ctx.fillStyle = '#020503'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawGrid() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    ctx.strokeStyle = 'rgba(212,175,55,0.3)' // dourado
    ctx.lineWidth = 1

    // linhas horizontais
    for (let i = 0; i < 6; i++) {
      const y = (h / 5) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // linhas verticais
    for (let i = 0; i < 10; i++) {
      const x = (w / 9) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
  }

  drawSweep() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    const time = Date.now() * 0.002

    const x = (Math.sin(time) + 1) * (w / 2)

    const gradient = ctx.createLinearGradient(x, 0, x + 100, 0)
    gradient.addColorStop(0, 'rgba(16,185,129,0)')
    gradient.addColorStop(0.5, 'rgba(16,185,129,0.5)')
    gradient.addColorStop(1, 'rgba(16,185,129,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(x, 0, 100, h)
  }
}
