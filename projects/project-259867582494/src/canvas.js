// Animated particle/flow-field background. Respects reduced-motion and visibility.
// No external dependencies — pure Canvas 2D.

const PALETTE = [
  [124, 92, 255],   // accent purple
  [45, 212, 191],   // teal
  [255, 122, 198],  // pink
  [92, 139, 255],   // blue
];

export function initBackground(canvas) {
  if (!canvas || !canvas.getContext) return () => {};
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let rafId = 0;
  let running = true;
  let t = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    // Density scales with area, capped for performance.
    const count = Math.min(90, Math.max(30, Math.floor((width * height) / 16000)));
    particles = new Array(count).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      life: Math.random() * 200,
      maxLife: 180 + Math.random() * 160,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      r: 0.8 + Math.random() * 1.8,
    }));
  }

  // Cheap pseudo-noise field built from sines.
  function fieldAngle(x, y, time) {
    const s = 0.0016;
    return (
      Math.sin(x * s + time) +
      Math.cos(y * s * 1.3 - time * 0.8) +
      Math.sin((x + y) * s * 0.7 + time * 0.5)
    ) * Math.PI;
  }

  function step() {
    if (!running) return;
    t += 0.0025;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = fieldAngle(p.x, p.y, t);
      p.vx += Math.cos(a) * 0.06;
      p.vy += Math.sin(a) * 0.06;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      // Wrap around edges.
      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      else if (p.y > height + 10) p.y = -10;

      const fadeIn = Math.min(1, p.life / 30);
      const fadeOut = Math.min(1, (p.maxLife - p.life) / 60);
      const alpha = Math.max(0, Math.min(fadeIn, fadeOut)) * 0.6;
      const [r, g, b] = p.color;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (p.life > p.maxLife) {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
        p.life = 0;
        p.vx = p.vy = 0;
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    rafId = window.requestAnimationFrame(step);
  }

  function start() {
    if (running && reduce) { drawStatic(); return; }
    if (running) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(step); }
  }

  function drawStatic() {
    // Reduced-motion: draw one calm frame and stop.
    resize();
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      const [r, g, b] = p.color;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  resize();
  start();

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  };
  const onVisibility = () => {
    running = !document.hidden;
    if (running && !reduce) { rafId = requestAnimationFrame(step); }
    else { cancelAnimationFrame(rafId); }
  };
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  // Cleanup.
  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
