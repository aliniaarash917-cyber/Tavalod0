/* ═══════════════════════════════════════════
   audio.js — آهنگ زنده با Web Audio API
   هیچ فایلی لازم نیست؛ نُت‌ها همین‌جا ساخته می‌شن.
   ═══════════════════════════════════════════ */

const Music = (() => {
  let ctx = null;
  let master = null;
  let analyser = null;
  let playing = false;
  let startTime = 0;
  let pausedAt = 0;
  let rafId = null;
  let timers = [];

  // ── نُت‌ها: [فرکانس، شروع(ثانیه)، مدت(ثانیه)، نوع]
  const N = {
    C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00, B5:987.77,
    C6:1046.50, E6:1318.51, G6:1567.98,
    A3:220.00, G3:196.00, F3:174.61, E3:164.81, D3:146.83, C3:130.81
  };

  // ملودی اصلی — ۳۲ ثانیه، آرام و احساسی
  const MELODY = [
    // فِیز ۱: معرفی
    [N.E5,0.0,1.1,'lead'],[N.G5,1.0,0.9,'lead'],[N.A5,1.9,1.3,'lead'],
    [N.G5,3.2,0.8,'lead'],[N.E5,4.0,1.0,'lead'],[N.D5,5.0,1.4,'lead'],
    [N.C5,6.4,0.9,'lead'],[N.D5,7.3,0.9,'lead'],[N.E5,8.2,1.6,'lead'],

    // فِیز ۲: اوج
    [N.A5,10.0,1.2,'lead'],[N.C6,11.2,1.0,'lead'],[N.B5,12.2,1.4,'lead'],
    [N.A5,13.6,0.9,'lead'],[N.G5,14.5,0.9,'lead'],[N.E5,15.4,1.6,'lead'],

    // فِیز ۳: آرام‌تر
    [N.F5,17.2,1.0,'lead'],[N.E5,18.2,1.0,'lead'],[N.D5,19.2,1.2,'lead'],
    [N.E5,20.4,0.8,'lead'],[N.C5,21.2,1.8,'lead'],

    // فِیز ۴: پایان
    [N.G5,23.2,1.0,'lead'],[N.A5,24.2,1.0,'lead'],[N.C6,25.2,1.4,'lead'],
    [N.B5,26.6,0.9,'lead'],[N.G5,27.5,0.9,'lead'],[N.E5,28.4,2.6,'lead']
  ];

  // آکورد پد (پس‌زمینه)
  const PADS = [
    [N.C3,0,4.2],[N.A3,0,4.2],
    [N.F3,4.0,4.4],[N.C4,4.0,4.4],
    [N.G3,8.0,4.6],[N.D4,8.0,4.6],
    [N.A3,12.0,4.4],[N.E4,12.0,4.4],
    [N.F3,16.0,4.6],[N.C4,16.0,4.6],
    [N.C3,20.0,4.4],[N.G3,20.0,4.4],
    [N.A3,24.0,4.4],[N.E4,24.0,4.4],
    [N.C3,28.0,4.0],[N.G3,28.0,4.0]
  ];

  // بیس
  const BASS = [
    [N.C3,0,1.9],[N.A3,2.0,1.9],[N.F3,4.0,1.9],[N.C4,6.0,1.9],
    [N.G3,8.0,1.9],[N.D4,10.0,1.9],[N.A3,12.0,1.9],[N.E4,14.0,1.9],
    [N.F3,16.0,1.9],[N.C4,18.0,1.9],[N.C3,20.0,1.9],[N.G3,22.0,1.9],
    [N.A3,24.0,1.9],[N.E4,26.0,1.9],[N.C3,28.0,3.6]
  ];

  // زیرنویس‌ها: [زمان، متن]
  const SUBS = [
    [0.0,  'یه آهنگ کوچیک، فقط برای تو…'],
    [3.2,  'هیچ‌کس نمی‌دونه چقدر دلم برات تنگ می‌شه.'],
    [6.4,  'اسمت رو که می‌نویسم، دستم می‌لرزه.'],
    [10.0, 'تو قشنگ‌ترین اتفاقِ این سال‌هایی.'],
    [13.6, 'کاش امروز کنارِ شمع‌ها بودم.'],
    [17.2, 'فاصله سخته، ولی حرفِ دلم نه.'],
    [20.4, 'هر روزت تولد باشه، نسا.'],
    [23.2, 'این نُت‌ها رو از ته دلم ساختم.'],
    [26.6, 'برگرد، بقیه‌ش رو با هم گوش بدیم.'],
    [28.4, 'تولدت مبارک، عزیزِ من 🤍']
  ];

  const DURATION = 32;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.28;

    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;

    // ریورب ساده با convolver
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(2.4, 2.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.22;

    master.connect(analyser);
    master.connect(ctx.destination);
    master.connect(conv);
    conv.connect(wet);
    wet.connect(ctx.destination);
  }

  // ساخت ایمپالس ریورب
  function makeImpulse(seconds, decay) {
    const rate = ctx.sampleRate;
    const len = rate * seconds;
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // ── سازها ──
  function playLead(freq, t, dur) {
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();

    o1.type = 'triangle';
    o2.type = 'sine';
    o1.frequency.value = freq;
    o2.frequency.value = freq * 2.005;

    f.type = 'lowpass';
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(900, t + dur);

    const peak = 0.3;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.14, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const g2 = ctx.createGain();
    g2.gain.value = 0.18;
    o2.connect(g2); g2.connect(f);
    o1.connect(f);
    f.connect(g);
    g.connect(master);

    o1.start(t); o2.start(t);
    o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  function playPad(freq, t, dur) {
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();

    o.type = 'sawtooth';
    o2.type = 'sine';
    o.frequency.value = freq;
    o2.frequency.value = freq * 1.003;
    f.type = 'lowpass';
    f.frequency.value = 700;

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.9);
    g.gain.linearRampToValueAtTime(0.055, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, t + dur);

    o.connect(f); o2.connect(f);
    f.connect(g); g.connect(master);
    o.start(t); o2.start(t);
    o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  function playBass(freq, t, dur) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // ── زمان‌بندی ──
  function scheduleAll(offset) {
    const base = ctx.currentTime + 0.08 - offset;

    MELODY.forEach(([f, s, d]) => {
      if (s + d < offset) return;
      const st = Math.max(s, offset);
      playLead(f, base + st, (s + d) - st);
    });
    PADS.forEach(([f, s, d]) => {
      if (s + d < offset) return;
      const st = Math.max(s, offset);
      playPad(f, base + st, (s + d) - st);
    });
    BASS.forEach(([f, s, d]) => {
      if (s + d < offset) return;
      const st = Math.max(s, offset);
      playBass(f, base + st, (s + d) - st);
    });
  }

  // ── کنترل ──
  function play() {
    init();
    if (ctx.state === 'suspended') ctx.resume();
    if (playing) return;
    playing = true;
    startTime = ctx.currentTime - pausedAt;
    scheduleAll(pausedAt);
    loop();
  }

  function pause() {
    if (!playing) return;
    playing = false;
    pausedAt = ctx.currentTime - startTime;
    if (pausedAt >= DURATION) pausedAt = 0;
    cancelAnimationFrame(rafId);
    // قطع صدا
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    setTimeout(() => {
      if (!playing) {
        // متوقف کردن نُت‌های در حال پخش با ساخت مجدد گین
        master.disconnect();
        master = ctx.createGain();
        master.gain.value = 0.28;
        master.connect(analyser);
        master.connect(ctx.destination);
      }
    }, 200);
  }

  function stop() {
    playing = false;
    pausedAt = 0;
    cancelAnimationFrame(rafId);
  }

  function seek(ratio) {
    const wasPlaying = playing;
    if (playing) pause();
    pausedAt = Math.max(0, Math.min(DURATION - 0.1, ratio * DURATION));
    if (wasPlaying) setTimeout(play, 220);
  }

  function currentTime() {
    if (!playing) return pausedAt;
    return Math.min(DURATION, ctx.currentTime - startTime);
  }

  // ── حلقه‌ی آپدیت ──
  let lastSub = -1;

  function loop() {
    if (!playing) return;
    const t = currentTime();

    // نوار پیشرفت
    const fill = document.getElementById('progress-fill');
    const nowEl = document.getElementById('time-now');
    if (fill) fill.style.width = (t / DURATION * 100) + '%';
    if (nowEl) nowEl.textContent = fmt(t);

    // زیرنویس
    let idx = 0;
    for (let i = 0; i < SUBS.length; i++) if (t >= SUBS[i][0]) idx = i;
    if (idx !== lastSub) {
      lastSub = idx;
      setSubtitle(SUBS[idx][1]);
    }

    // ویژوالایزر
    drawViz();

    if (t >= DURATION) {
      playing = false;
      pausedAt = 0;
      lastSub = -1;
      document.getElementById('player')?.classList.remove('playing');
      const pb = document.getElementById('play-btn');
      if (pb) pb.innerHTML = '<span>▶</span>';
      setSubtitle('تموم شد… دوباره بزن؟ 🤍');
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  function setSubtitle(txt) {
    const el = document.getElementById('sub-line');
    if (!el) return;
    el.classList.add('fade');
    setTimeout(() => {
      el.textContent = txt;
      el.classList.remove('fade');
    }, 220);
  }

  function fmt(s) {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  }

  // ── ویژوالایزر ──
  let vizBars = [];

  function buildViz() {
    const v = document.getElementById('visualizer');
    if (!v || vizBars.length) return;
    for (let i = 0; i < 28; i++) {
      const b = document.createElement('i');
      v.appendChild(b);
      vizBars.push(b);
    }
  }

  function drawViz() {
    if (!analyser || !vizBars.length) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    for (let i = 0; i < vizBars.length; i++) {
      const v = data[i * 2] || 0;
      const h = 4 + (v / 255) * 26;
      vizBars[i].style.height = h + 'px';
      vizBars[i].style.opacity = 0.35 + (v / 255) * 0.65;
    }
  }

  function idleViz() {
    if (vizBars.length) return;
    buildViz();
  }

  return {
    play, pause, stop, seek, currentTime, buildViz, idleViz,
    isPlaying: () => playing,
    duration: DURATION,
    getCtx: () => ctx
  };
})();
