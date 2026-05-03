export class RadarEngine {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;
    this.angle = 0;
    this.animationFrame = null;

    this.options = {
      height: options.height || 300,
      gridColor: options.gridColor || 'rgba(212, 175, 55, 0.32)',
      sweepColor: options.sweepColor || 'rgba(16, 185, 129, 0.55)',
      mapColor: options.mapColor || 'rgba(212, 175, 55, 0.18)'
    };
  }

  init() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="radar-premium">
        <canvas id="radarCanvas"></canvas>
      </div>
    `;

    this.canvas = document.getElementById('radarCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.start();
  }

  resize() {
    if (!this.canvas || !this.container) return;

    const ratio = window.devicePixelRatio || 1;
    const width = this.container.offsetWidth;
    const height = this.options.height;

    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  start() {
    if (this.animationFrame) return;

    const loop = () => {
      this.draw();
      this.angle += 0.018;
      this.animationFrame = requestAnimationFrame(loop);
    };

    loop();
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.container.offsetWidth;
    const h = this.options.height;

    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);

    this.drawBackground(ctx, w, h);
    this.drawWorldMap(ctx, w, h);
    this.drawGrid(ctx, w, h);
    this.drawSweep(ctx, w, h);
    this.drawCenter(ctx, w, h);
  }

  drawBackground(ctx, w, h) {
    const gradient = ctx.createRadialGradient(
      w / 2, h / 2, 10,
      w / 2, h / 2, Math.max(w, h) / 1.2
    );

    gradient.addColorStop(0, '#04140b');
    gradient.addColorStop(0.45, '#020a05');
    gradient.addColorStop(1, '#020503');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  drawWorldMap(ctx, w, h) {
    ctx.save();

    ctx.strokeStyle = this.options.mapColor;
    ctx.lineWidth = 1;

    const continents = [
      [[0.12,0.38],[0.18,0.30],[0.25,0.33],[0.28,0.43],[0.24,0.55],[0.18,0.60],[0.13,0.52]],
      [[0.30,0.58],[0.34,0.65],[0.36,0.78],[0.33,0.88],[0.29,0.74],[0.27,0.64]],
      [[0.45,0.35],[0.52,0.28],[0.63,0.32],[0.69,0.42],[0.63,0.52],[0.51,0.50],[0.44,0.44]],
      [[0.54,0.54],[0.60,0.62],[0.59,0.75],[0.53,0.83],[0.49,0.70],[0.50,0.60]],
      [[0.68,0.36],[0.78,0.30],[0.88,0.38],[0.86,0.50],[0.75,0.54],[0.67,0.48]],
      [[0.78,0.64],[0.86,0.70],[0.84,0.80],[0.76,0.76]]
    ];

    continents.forEach(shape => {
      ctx.beginPath();
      shape.forEach((p, i) => {
        const x = p[0] * w;
        const y = p[1] * h;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    });

    ctx.restore();
  }

  drawGrid(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rMax = Math.min(w, h) * 0.42;

    ctx.save();
    ctx.strokeStyle = this.options.gridColor;
    ctx.lineWidth = 1;

    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (rMax / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 / 12) * i;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * rMax, cy + Math.sin(a) * rMax);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawSweep(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.42;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.angle);

    const gradient = ctx.createLinearGradient(0, 0, r, 0);
    gradient.addColorStop(0, 'rgba(16,185,129,0.85)');
    gradient.addColorStop(0.5, this.options.sweepColor);
    gradient.addColorStop(1, 'rgba(16,185,129,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -0.08, 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(16,255,150,.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawCenter(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();

    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
