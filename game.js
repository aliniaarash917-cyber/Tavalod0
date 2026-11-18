/* ═══════════════════════════════════════════
   game.js — بازی «قلب‌ها رو بگیر»
   ═══════════════════════════════════════════ */

const HeartGame = (() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayText = document.getElementById('overlay-text');
  const startBtn = document.getElementById('game-start');
  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  const bestEl = document.getElementById('best');

  const TARGET = 15;
  const TIME = 45;

  let W = 0, H = 0, dpr = 1;
  let basket = { x: 0, y: 0, w: 92, h: 20, tx: 0 };
  let hearts = [];
  let particles = [];
  let score = 0;
  let timeLeft = TIME;
  let running = false;
  let last = 0;
  let spawnAcc = 0;
  let keys = { left: false, right: false };
  let best = +(localStorage.getItem('nesa-best') || 0);

  bestEl.textContent = best;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    basket.y = H - 44;
    basket.x = W / 2;
    basket.tx = W / 2;
  }

  function reset() {
    hearts = [];
    particles = [];
    score = 0;
    timeLeft = TIME;
    spawnAcc = 0;
    scoreEl.textContent = '0';
    timerEl.textContent = TIME;
    basket.x = W / 2;
    basket.tx = W / 2;
  }

  function start() {
    reset();
    running = true;
    overlay.classList.add('hide');
    last = performance.now();
    requestAnimationFrame(tick);
  }

  function end(win) {
    running = false;
    overlay.classList.remove('hide');
    if (win) {
      overlayTitle.textContent = 'بردی! 🎉';
      overlayText.textContent = `همه‌ی ${TARGET} تا قلب رو گرفتی. معلومه دلِ پُرِ من دستِ کمی نیست!`;
      if (score > best) {
        best = score;
        localStorage.setItem('nesa-best', best);
        bestEl.textContent = best;
      }
      burst(W / 2, H / 2, 60);
      if (window.Confetti) window.Confetti.fire();
    } else {
      overlayTitle.textContent = 'وقت تموم شد ⏳';
      overlayText.textContent = `این بار ${score} تا قلب گرفتی. یه بار دیگه؟ قلب‌ها که کم نمی‌شن.`;
      if (score > best) {
        best = score;
        localStorage.setItem('nesa-best', best);
        bestEl.textContent = best;
      }
    }
    startBtn.textContent = 'دوباره';
  }

  function spawn() {
    const size = 22 + Math.random() * 12;
    hearts.push({
      x: 30 + Math.random() * (W - 60),
      y: -30,
      vy: 70 + Math.random() * 90 + (TIME - timeLeft) * 1.6,
      size,
      rot: (Math.random() - 0.5) * 0.6,
      vr: (Math.random() - 0.5) * 1.2,
      hue: 330 + Math.random() * 40,
      alive: true
    });
  }

  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 220;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 1,
        size: 2 + Math.random() * 4,
        hue: 320 + Math.random() * 60
      });
    }
  }

  function heartPath(cx, cy, s, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    const k = s / 20;
    ctx.moveTo(0, 6 * k);
    ctx.bezierCurveTo(-12 * k, -4 * k, -10 * k, -16 * k, 0, -8 * k);
    ctx.bezierCurveTo(10 * k, -16 * k, 12 * k, -4 * k, 0, 6 * k);
    ctx.closePath();
    ctx.restore();
  }

  function tick(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      timerEl.textContent = '0';
      end(false);
      return;
    }
    timerEl.textContent = Math.ceil(timeLeft);

    // حرکت سبد
    const speed = 620;
    if (keys.left) basket.tx -= speed * dt;
    if (keys.right) basket.tx += speed * dt;
    basket.tx = Math.max(basket.w / 2, Math.min(W - basket.w / 2, basket.tx));
    basket.x += (basket.tx - basket.x) * Math.min(1, dt * 18);

    // اسپاون
    spawnAcc += dt;
    const interval = Math.max(0.22, 0.62 - (TIME - timeLeft) * 0.008);
    while (spawnAcc > interval) {
      spawnAcc -= interval;
      spawn();
    }

    // آپدیت قلب‌ها
    for (const h of hearts) {
      if (!h.alive) continue;
      h.y += h.vy * dt;
      h.rot += h.vr * dt;

      // برخورد با سبد
      if (
        h.y + h.size / 2 > basket.y - 6 &&
        h.y - h.size / 2 < basket.y + basket.h &&
        h.x > basket.x - basket.w / 2 - h.size / 2 &&
        h.x < basket.x + basket.w / 2 + h.size / 2
      ) {
        h.alive = false;
        score++;
        scoreEl.textContent = score;
        burst(h.x, basket.y, 14);
        if (score >= TARGET) { end(true); return; }
      }

      if (h.y > H + 40) h.alive = false;
    }
    hearts = hearts.filter(h => h.alive);

    // آپدیت ذرات
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      p.life -= dt * 1.5;
    }
    particles = particles.filter(p => p.life > 0);

    draw();
    requestAnimationFrame(tick);
  }

  function draw() {
    // پس‌زمینه
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(20,10,32,.9)');
    g.addColorStop(1, 'rgba(8,6,16,.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // ستاره‌های پس‌زمینه
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 137.5) % W;
      const y = (i * 91.3 + performance.now() * 0.012) % H;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // قلب‌ها
    for (const h of hearts) {
      ctx.save();
      ctx.shadowColor = `hsla(${h.hue},100%,65%,.85)`;
      ctx.shadowBlur = 22;
      heartPath(h.x, h.y, h.size, h.rot);
      const hg = ctx.createLinearGradient(h.x, h.y - h.size, h.x, h.y + h.size);
      hg.addColorStop(0, `hsl(${h.hue},100%,72%)`);
      hg.addColorStop(1, `hsl(${h.hue - 25},95%,52%)`);
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.restore();
    }

    // ذرات
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = `hsl(${p.hue},100%,68%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // سبد
    const bx = basket.x - basket.w / 2;
    const by = basket.y;
    ctx.save();
    ctx.shadowColor = 'rgba(255,92,138,.75)';
    ctx.shadowBlur = 26;
    const bg = ctx.createLinearGradient(bx, by, bx, by + basket.h);
    bg.addColorStop(0, '#ff8fb0');
    bg.addColorStop(1, '#c2185b');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(bx, by, basket.w, basket.h, 10);
    ctx.fill();
    ctx.restore();

    // خط نور بالای سبد
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + 8, by + 2);
    ctx.lineTo(bx + basket.w - 8, by + 2);
    ctx.stroke();
  }

  // ── ورودی ──
  function setPointer(clientX) {
    const r = canvas.getBoundingClientRect();
    basket.tx = clientX - r.left;
  }

  canvas.addEventListener('mousemove', e => setPointer(e.clientX));
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    setPointer(e.touches[0].clientX);
  }, { passive: false });
  canvas.addEventListener('touchstart', e => {
    setPointer(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  startBtn.addEventListener('click', start);
  window.addEventListener('resize', () => { resize(); });
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  // شروع اولیه
  resize();
  requestAnimationFrame(() => { resize(); draw(); });

  return { start };
})();
