/* ═══════════════════════════════════════════
   main.js — ذرات، تایپ‌رایتر، کیک، آرزو، کاغذرنگی
   ═══════════════════════════════════════════ */

/* ─────────── لودر ─────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
    document.body.classList.add('ready');
  }, 1900);
});

/* ─────────── ذرات پس‌زمینه ─────────── */
(function bgParticles() {
  const c = document.getElementById('bg-canvas');
  const ctx = c.getContext('2d');
  let W, H, dpr;
  const dots = [];
  const mouse = { x: -999, y: -999 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots.length = 0;
    const count = Math.min(120, Math.floor(W * H / 14000));
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.9 + 0.4,
        a: Math.random() * 0.5 + 0.15
      });
    }
  }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('resize', resize);

  function frame() {
    ctx.clearRect(0, 0, W, H);

    // اتصال خطوط
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > W) d.vx *= -1;
      if (d.y < 0 || d.y > H) d.vy *= -1;

      // دفع از موس
      const dx = d.x - mouse.x;
      const dy = d.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 130 && dist > 0) {
        d.x += (dx / dist) * 0.7;
        d.y += (dy / dist) * 0.7;
      }

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,180,210,${d.a})`;
      ctx.fill();

      for (let j = i + 1; j < dots.length; j++) {
        const o = dots[j];
        const dd = Math.hypot(d.x - o.x, d.y - o.y);
        if (dd < 118) {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(o.x, o.y);
          ctx.strokeStyle = `rgba(180,140,255,${0.13 * (1 - dd / 118)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }

  resize();
  frame();
})();

/* ─────────── ریویل با اسکرول ─────────── */
(function reveal() {
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en, i) => {
      if (en.isIntersecting) {
        setTimeout(() => en.target.classList.add('in'), i * 90);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el => io.observe(el));
})();

/* ─────────── اسکرول نرم ─────────── */
document.querySelectorAll('[data-scroll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = document.querySelector(btn.dataset.scroll);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ─────────── تایپ‌رایتر ─────────── */
(function typewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const text = 'نسا، این صفحه‌ها رو ساختم که بگم: تو تنها کسی هستی که اسمش رو با خیال راحت می‌نویسم.';
  let started = false;

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting && !started) {
        started = true;
        let i = 0;
        const step = () => {
          el.textContent = text.slice(0, ++i);
          if (i < text.length) setTimeout(step, 42 + Math.random() * 40);
          else el.classList.add('done');
        };
        setTimeout(step, 400);
      }
    });
  }, { threshold: 0.4 });
  io.observe(el);
})();

/* ─────────── پلیر ─────────── */
(function player() {
  const playBtn = document.getElementById('play-btn');
  const playerEl = document.getElementById('player');
  const progress = document.querySelector('.progress');
  const totalEl = document.getElementById('time-total');

  Music.buildViz();
  totalEl.textContent = '0:32';

  playBtn.addEventListener('click', () => {
    if (Music.isPlaying()) {
      Music.pause();
      playBtn.innerHTML = '<span>▶</span>';
      playerEl.classList.remove('playing');
    } else {
      Music.play();
      playBtn.innerHTML = '<span>❚❚</span>';
      playerEl.classList.add('playing');
    }
  });

  progress.addEventListener('click', e => {
    const r = progress.getBoundingClientRect();
    Music.seek((e.clientX - r.left) / r.width);
  });
})();

/* ─────────── دکمه‌ی صدا (قطع کل) ─────────── */
(function soundToggle() {
  const btn = document.getElementById('sound-toggle');
  let muted = false;
  btn.addEventListener('click', () => {
    muted = !muted;
    btn.classList.toggle('off', muted);
    btn.querySelector('.sound-icon').textContent = muted ? '🔇' : '🔈';
    const ctx = Music.getCtx();
    if (ctx) {
      if (muted) ctx.suspend();
      else ctx.resume();
    }
  });
})();

/* ─────────── کیک ─────────── */
(function cake() {
  const cakeEl = document.getElementById('cake');
  const btn = document.getElementById('blow-btn');
  const msg = document.getElementById('cake-msg');
  let blown = false;

  const messages = [
    'آرزوت رو کردی؟ منم دقیقاً همون رو می‌خوام 🤍',
    'شمع‌ها خاموش شدن، ولی این یکی هیچ‌وقت خاموش نمی‌شه.',
    'امیدوارم هر آرزویی که کردی، سالِ دیگه جشنش رو بگیریم.',
    'دودش رفت، آرزوش موند. مثل بعضی آدم‌ها که از فاصله هم می‌مونن.'
  ];

  function blow() {
    if (blown) {
      msg.textContent = 'دیگه فوت نکن، آتیشش که نیست! 😄';
      return;
    }
    blown = true;
    cakeEl.classList.add('blown');
    msg.textContent = messages[Math.floor(Math.random() * messages.length)];
    if (window.Confetti) window.Confetti.fire(90);
  }

  cakeEl.addEventListener('click', blow);
  btn.addEventListener('click', blow);
})();

/* ─────────── شیشه‌ی آرزو ─────────── */
(function wishJar() {
  const btn = document.getElementById('wish-btn');
  const out = document.getElementById('wish-text');

  const wishes = [
    'کاش یه روز صبح بیدار شم و ببینم پیامت اولین چیز گوشیمه.',
    'آرزو می‌کنم هیچ‌وقت نتونی جلوی خنده‌ت رو بگیری.',
    'کاش فاصله فقط یه عدد باشه، نه یه احساس.',
    'دلم می‌خواد یه روز برات فسنجون بپزم و خودت بگی «بهترین بود».',
    'آرزو می‌کنم همیشه یه نفر داشته باشی که وقتی خسته‌ای، بغلت کنه. من داوطلبم.',
    'کاش سالِ دیگه این سایت رو با هم و از یه جا بخونیم.',
    'آرزو می‌کنم هیچ‌وقت فکر نکنی یادم رفته. هیچ‌وقت.',
    'دلم می‌خواد صدای خنده‌ت رو ضبط کنم و بذارم رو زنگ ساعت.',
    'کاش یه روز بریم استادیوم و تو با من هوادار رئال بشی 😏',
    'آرزو می‌کنم این آهنگ رو یه روز کنارِ هم گوش بدیم.'
  ];

  let last = -1;
  btn.addEventListener('click', () => {
    let i;
    do { i = Math.floor(Math.random() * wishes.length); } while (i === last && wishes.length > 1);
    last = i;
    out.classList.remove('pop');
    void out.offsetWidth;
    out.textContent = wishes[i];
    out.classList.add('pop');
    if (window.Confetti) window.Confetti.fire(24);
  });
})();

/* ─────────── کاغذرنگی ─────────── */
window.Confetti = (() => {
  const c = document.getElementById('confetti-canvas');
  const ctx = c.getContext('2d');
  let W, H, dpr;
  let pieces = [];
  let raf = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const COLORS = ['#ff5c8a', '#ffd166', '#8b5cf6', '#38e8ff', '#ffffff', '#ff9bb6', '#c084fc'];

  function fire(n = 120) {
    for (let i = 0; i < n; i++) {
      pieces.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.35,
        vx: (Math.random() - 0.5) * 3.2,
        vy: 1.6 + Math.random() * 3.4,
        w: 5 + Math.random() * 8,
        h: 8 + Math.random() * 12,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.22,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        sway: Math.random() * Math.PI * 2
      });
    }
    if (!raf) loop();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const p of pieces) {
      p.sway += 0.04;
      p.x += p.vx + Math.sin(p.sway) * 1.1;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.045;

      if (p.y > H + 40) p.life = 0;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    pieces = pieces.filter(p => p.life > 0);
    if (pieces.length) {
      raf = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, W, H);
      raf = null;
    }
  }

  return { fire };
})();

document.getElementById('confetti-btn')?.addEventListener('click', () => {
  Confetti.fire(220);
});

/* ─────────── کیک: کاغذرنگی موقع ریویل ─────────── */
(function autoConfetti() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        Confetti.fire(70);
        io.disconnect();
      }
    });
  }, { threshold: 0.5 });
  const f = document.getElementById('finale');
  if (f) io.observe(f);
})();
