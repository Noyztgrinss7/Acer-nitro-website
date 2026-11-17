/* ==========================================================
   NITRO//X  -  shared script for every page
   ========================================================== */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const isTurbo = () => document.body.classList.contains('turbo');

  /* ---------- loader + page transitions ---------- */
  const ready = () => document.body.classList.add('ready');
  window.addEventListener('load', () => setTimeout(ready, 900));
  setTimeout(ready, 3000);
  window.addEventListener('pageshow', e => {
    document.body.classList.remove('leaving');
    if (e.persisted) ready();
  });
  $$('a[href$=".html"]').forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    e.preventDefault();
    const href = a.href;
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = href; }, 550);
  }));

  /* ---------- nav, progress bar, turbo mode ---------- */
  const nav = $('.nav'), prog = $('.progress'), burger = $('.burger'), tb = $('.turbo-btn');
  if (burger) burger.addEventListener('click', () => nav.classList.toggle('open'));
  const setTurbo = on => {
    document.body.classList.toggle('turbo', on);
    if (tb) tb.setAttribute('aria-pressed', String(on));
    store.set('turbo', on ? '1' : '0');
  };
  setTurbo(store.get('turbo') === '1');
  if (tb) tb.addEventListener('click', () => setTurbo(!isTurbo()));

  /* ---------- cursor glow ---------- */
  const glow = $('#glow');
  let gx = innerWidth / 2, gy = innerHeight / 2, mx = gx, my = gy;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });

  /* ---------- keyboard builder ---------- */
  function buildKeys(kb) {
    const rows = [
      Array(15).fill(1), Array(15).fill(1), Array(15).fill(1), Array(15).fill(1),
      [1, 1, 1, 7, 1, 1, 1, 1, 1]
    ];
    rows.forEach((row, ri) => {
      let col = 0;
      row.forEach(span => {
        const k = document.createElement('i');
        k.style.setProperty('--i', col + ri * 2);
        if (span > 1) k.style.gridColumn = 'span ' + span;
        kb.appendChild(k);
        col += span;
      });
    });
  }
  $$('.kb').forEach(buildKeys);

  /* ---------- 3D laptop markup (injected into every [data-laptop]) ---------- */
  const laptopHTML = `
  <div class="scale"><div class="shift"><div class="laptop">
    <div class="p floor"></div>
    <div class="p bt"><div class="kb"></div><div class="tp"></div></div>
    <div class="p bb"></div>
    <div class="p bf"><i class="led"></i></div>
    <div class="p bk"></div><div class="p bl"></div><div class="p br"></div>
    <div class="hinge"><div class="lid">
      <div class="p lf"><div class="bezel"><div class="display">
        <div class="gl"></div>
        <div class="hud"><b>NITRO</b>FPS <em class="fps" style="font-style:normal">144</em></div>
        <div class="sun"></div><div class="grid3d"></div>
      </div></div></div>
      <div class="p lb"><span>NITRO</span></div>
      <div class="p lt"></div><div class="p ll"></div><div class="p lr"></div>
    </div></div>
  </div></div></div>`;

  const L = $$('[data-laptop]').map(el => {
    el.innerHTML = laptopHTML;
    buildKeys($('.kb', el));
    const o = {
      el, mode: el.dataset.laptop, lap: $('.laptop', el), sc: $('.scale', el),
      ry: 25, tilt: -16, vel: 0, drag: false, lastX: 0, vis: true
    };
    if (o.mode === 'drag') {
      el.addEventListener('pointerdown', e => { o.drag = true; o.lastX = e.clientX; o.vel = 0; });
      addEventListener('pointerup', () => { o.drag = false; });
      addEventListener('pointermove', e => {
        if (!o.drag) return;
        const dx = e.clientX - o.lastX; o.lastX = e.clientX;
        o.ry += dx * .6; o.vel = dx * .6;
      });
    }
    new IntersectionObserver(es => es.forEach(e => { o.vis = e.isIntersecting; })).observe(el);
    return o;
  });

  const fitLaptops = () => L.forEach(o => {
    const r = o.el.getBoundingClientRect();
    o.sc.style.setProperty('--sc', clamp(Math.min(r.width / 560, r.height / 620), .35, 2.2).toFixed(3));
  });
  addEventListener('resize', fitLaptops);
  fitLaptops();

  /* fake live FPS in the laptop screens */
  setInterval(() => {
    const base = isTurbo() ? 190 : 144;
    $$('.fps').forEach(f => { f.textContent = Math.round(base + rnd(0, 22)); });
  }, 450);

  /* ---------- main animation loop ---------- */
  const stage = $('#stage'), hs = $('.hscroll');
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    const speed = isTurbo() ? 2.4 : 1;

    // page scroll progress + nav
    const max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (nav) nav.classList.toggle('scrolled', scrollY > 30);

    // cursor glow
    gx += (mx - gx) * .12; gy += (my - gy) * .12;
    if (glow) glow.style.transform = `translate(${gx}px,${gy}px)`;

    // sticky spinning stage (home)
    let p = 0;
    if (stage) {
      const r = stage.getBoundingClientRect();
      p = clamp(-r.top / (r.height - innerHeight), 0, 1);
      stage.style.setProperty('--hr', (p * 360).toFixed(1) + 'deg');
      const caps = $$('.cap', stage);
      const idx = Math.min(caps.length - 1, Math.floor(p * caps.length));
      caps.forEach((c, i) => c.classList.toggle('active', i === idx));
      const w = $('.bgword', stage);
      if (w) w.style.transform = `translateX(${(.5 - p) * 60}vw)`;
      const h = $('.hint', stage);
      if (h) h.style.opacity = p < .02 ? 1 : 0;
    }

    // laptops
    const t = now / 1000;
    L.forEach(o => {
      if (!o.vis) return;
      if (o.mode === 'scroll') {
        const target = 25 + p * 1080;                 // 3 full spins while you scroll
        o.ry += (target - o.ry) * .08;
        o.tilt = -16 + Math.sin(p * Math.PI * 4) * 11;
        o.sc.style.setProperty('--z', (1 + .16 * Math.abs(Math.sin(p * Math.PI * 3))).toFixed(3));
      } else if (o.mode === 'drag') {
        if (!o.drag) { o.ry += o.vel; o.vel *= .94; o.ry += dt * .02 * speed; }
        o.tilt = -16 + Math.sin(t * .8) * 4;
      } else {
        o.ry += dt * .03 * speed;
        o.tilt = -16 + Math.sin(t * .8) * 5;
      }
      o.lap.style.transform = `translateY(${(Math.sin(t * 1.6) * 7).toFixed(2)}px) rotateX(${o.tilt.toFixed(2)}deg) rotateY(${o.ry.toFixed(2)}deg)`;
    });

    // horizontal pinned slides
    if (hs) {
      const r = hs.getBoundingClientRect();
      const hp = clamp(-r.top / (r.height - innerHeight), 0, 1);
      const tr = $('.htrack', hs);
      tr.style.transform = `translateX(${-hp * Math.max(0, tr.scrollWidth - innerWidth)}px)`;
      hs.style.setProperty('--hp', hp.toFixed(4));
      $$('.slide', hs).forEach(s => {
        const sr = s.getBoundingClientRect();
        s.style.setProperty('--off', ((sr.left + sr.width / 2) / innerWidth - .5).toFixed(3));
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- scroll reveal + counters + bars ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1800;
    (function tick(n) {
      const k = clamp((n - t0) / dur, 0, 1), v = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(end * v).toLocaleString() + suf;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- 3D tilt cards + magnetic buttons ---------- */
  $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(800px) rotateY(${((x - .5) * 14).toFixed(2)}deg) rotateX(${((.5 - y) * 14).toFixed(2)}deg) translateZ(8px)`;
      el.style.setProperty('--mx', x * 100 + '%');
      el.style.setProperty('--my', y * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  $$('.mag').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* ---------- typed text ---------- */
  $$('[data-type]').forEach(el => {
    const words = el.dataset.type.split('|');
    let w = 0, c = 0, del = false;
    (function tick() {
      const word = words[w];
      c += del ? -1 : 1;
      el.textContent = word.slice(0, c);
      let d = del ? 40 : 90;
      if (!del && c === word.length) { del = true; d = 1400; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; d = 300; }
      setTimeout(tick, d);
    })();
  });

  /* ---------- flip cards (tap on touch screens) ---------- */
  $$('.flip').forEach(f => f.addEventListener('click', () => f.classList.toggle('on')));

  /* ---------- RGB keyboard demo ---------- */
  $$('[data-kh]').forEach(b => b.addEventListener('click', () => {
    const kb = $('#demoKb'); if (!kb) return;
    $$('[data-kh],[data-wave]').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    kb.classList.add('static');
    kb.style.setProperty('--kh', b.dataset.kh + 'deg');
  }));
  $$('[data-wave]').forEach(b => b.addEventListener('click', () => {
    const kb = $('#demoKb'); if (!kb) return;
    $$('[data-kh],[data-wave]').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    kb.classList.remove('static');
  }));

  /* ---------- FAQ ---------- */
  $$('.faq button').forEach(b => b.addEventListener('click', () => {
    const d = b.parentElement, open = d.classList.contains('open');
    $$('.faq div').forEach(x => x.classList.remove('open'));
    if (!open) d.classList.add('open');
  }));

  /* ---------- FPS gauge (performance page) ---------- */
  const g = $('#gauge');
  if (g) {
    g.width = 800; g.height = 480;
    const c = g.getContext('2d');
    let cur = 0, tgt = 0;
    const draw = () => {
      const w = g.width, h = g.height, cx = w / 2, cy = h * .86, R = w * .4;
      const k = clamp(cur / 240, 0, 1);
      c.clearRect(0, 0, w, h);
      c.lineWidth = 28; c.lineCap = 'round';
      c.strokeStyle = '#1c1c27';
      c.beginPath(); c.arc(cx, cy, R, Math.PI, 2 * Math.PI); c.stroke();
      const grd = c.createLinearGradient(0, 0, w, 0);
      grd.addColorStop(0, '#00e5ff'); grd.addColorStop(.5, '#ffb000'); grd.addColorStop(1, '#ff3b1d');
      c.strokeStyle = grd; c.shadowColor = '#ff3b1d'; c.shadowBlur = 26;
      c.beginPath(); c.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * k); c.stroke();
      c.shadowBlur = 0; c.lineWidth = 2; c.strokeStyle = '#ffffff33';
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + i / 12 * Math.PI;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * (R - 32), cy + Math.sin(a) * (R - 32));
        c.lineTo(cx + Math.cos(a) * (R - 46), cy + Math.sin(a) * (R - 46));
        c.stroke();
      }
      const a = Math.PI + Math.PI * k;
      c.strokeStyle = '#fff'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (R - 58), cy + Math.sin(a) * (R - 58)); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, 10, 0, 7); c.fill();
    };
    (function loop() {
      cur += (tgt + (tgt ? Math.sin(performance.now() / 180) * 3 : 0) - cur) * .05;
      const n = $('#gnum'); if (n) n.textContent = Math.round(cur);
      draw();
      requestAnimationFrame(loop);
    })();
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (e.isIntersecting) { tgt = 165; ob.disconnect(); }
    }), { threshold: .4 }).observe(g);
    $$('[data-fps]').forEach(b => b.addEventListener('click', () => {
      $$('[data-fps]').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); tgt = +b.dataset.fps;
    }));
  }

  /* ---------- contact form + confetti ---------- */
  const form = $('form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = $('button', form);
    btn.textContent = 'Sent! 🚀 We will reply soon';
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('span');
      s.className = 'confetti';
      s.style.left = rnd(0, 100) + 'vw';
      s.style.background = `hsl(${rnd(0, 60)},100%,55%)`;
      s.style.setProperty('--dx', rnd(-150, 150) + 'px');
      s.style.animationDelay = rnd(0, .6) + 's';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 3200);
    }
    form.reset();
  });

  /* ---------- ember particles background ---------- */
  const cv = $('#fx');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H;
    const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
    size(); addEventListener('resize', size);
    const mk = () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(.6, 2.4), v: rnd(.2, .8), h: rnd(5, 50), a: Math.random() });
    const ps = Array.from({ length: innerWidth < 700 ? 35 : 80 }, mk);
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      const sp = isTurbo() ? 3 : 1;
      ps.forEach(p => {
        p.y -= p.v * sp;
        p.x += Math.sin((p.y + p.a * 100) / 60) * .4;
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy) || 1;
        if (d < 120) { p.x += dx / d * 2; p.y += dy / d * 2; }
        if (p.y < -10) { p.y = H + 10; p.x = rnd(0, W); }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = `hsla(${p.h},100%,60%,${.25 + p.a * .5})`;
        ctx.shadowColor = `hsl(${p.h},100%,55%)`;
        ctx.shadowBlur = 10;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    })();
  }
})();