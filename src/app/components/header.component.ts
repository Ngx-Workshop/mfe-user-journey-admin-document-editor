import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';

export type SidenavHeaderData = {
  sectionTitle: string;
  headerSvgPath: string;
  currentWorkshopTitle?: string;
};

@Component({
  selector: 'ngx-menu-management-header',
  template: `
    <div class="header">
      <canvas #bgCanvas class="bg-canvas" aria-hidden="true"></canvas>
      <!-- <h1>Document Editor</h1> -->
      <img [src]="sidenavHeaderData.headerSvgPath" />
      <h1>
        {{ sidenavHeaderData.sectionTitle }}:
        {{ sidenavHeaderData.currentWorkshopTitle ?? 'Workshops' }}
      </h1>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .header {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        overflow: hidden;
        background: linear-gradient(
          135deg,
          var(--mat-sys-primary) 0%,
          var(--mat-sys-surface) 100%
        );
        color: var(--mat-sys-on-primary);
      }
      h1 {
        position: relative;
        z-index: 1;
        font-weight: 100;
        margin: 1.7rem 0;
        font-size: 1.85rem;
      }
      .bg-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        mix-blend-mode: soft-light;
      }
      img {
        width: 64px;
        z-index: 2;
        margin-left: 1.5rem;
        @media (max-width: 959px) {
          width: 35px;
          margin: 0;
        }
      }
    `,
  ],
})
export class HeaderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgCanvas', { static: false })
  bgCanvas?: ElementRef<HTMLCanvasElement>;

  @Input() sidenavHeaderData: SidenavHeaderData = {
    headerSvgPath: 'Default',
    sectionTitle: '/assets/img/dashboard-color.png',
    currentWorkshopTitle: 'Default',
  };

  private ctx?: CanvasRenderingContext2D;
  private rafId = 0;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    a: number;
  }> = [];
  private lastTs = 0;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.bgCanvas?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d') ?? undefined;
    if (!this.ctx) return;

    this.handleResize();
    this.resizeObserver = new ResizeObserver(() =>
      this.handleResize()
    );
    this.resizeObserver.observe(canvas.parentElement as Element);

    this.initParticles();
    this.lastTs = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min(50, ts - this.lastTs);
      this.lastTs = ts;
      this.update(dt / 1000);
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }

  private handleResize(): void {
    const canvas = this.bgCanvas?.nativeElement;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    const parent = canvas.parentElement as HTMLElement;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = parent.clientWidth;
    const height = parent.clientHeight; // 56px

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Re-seed particles to match new size density
    this.seedByArea(width, height);
  }

  private seedByArea(w: number, h: number): void {
    const density = 0.0018; // particles per px^2 (very light)
    const target = Math.max(
      8,
      Math.min(60, Math.floor(w * h * density))
    );
    if (this.particles.length > target) {
      this.particles.length = target;
    } else {
      while (this.particles.length < target)
        this.particles.push(this.makeParticle(w, h));
    }
  }

  private initParticles(): void {
    const canvas = this.bgCanvas?.nativeElement;
    if (!canvas) return;
    this.particles = [];
    this.seedByArea(canvas.clientWidth, canvas.clientHeight);
  }

  private makeParticle(w: number, h: number) {
    const speed = 20 + Math.random() * 20; // px/s
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const r = 0.8 + Math.random() * 1.8; // radius in px
    const a = 0.25 + Math.random() * 0.45; // alpha
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx,
      vy,
      r,
      a,
    };
  }

  private update(dt: number): void {
    const canvas = this.bgCanvas?.nativeElement;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const margin = 20;

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -margin) p.x = w + margin;
      if (p.x > w + margin) p.x = -margin;
      if (p.y < -margin) p.y = h + margin;
      if (p.y > h + margin) p.y = -margin;
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    const canvas = this.bgCanvas?.nativeElement;
    if (!ctx || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // dotted constellations
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      // point
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${(p.a * 0.9).toFixed(3)})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // subtle connections by distance
    const maxDist = 120;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < maxDist * maxDist) {
          const alpha = 0.12 * (1 - Math.sqrt(d2) / maxDist);
          ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}
