/* =========================================================================
   PRODUCT TOUR + SPOTLIGHT
   - Escurece a tela e recorta um "buraco" em volta do elemento explicado.
   - Acompanha o elemento em tempo real (scroll, resize, animações de modal).
   - Posiciona o balão no lado com mais espaço, sem sair da tela.
   - Tipos de passo: 'next' (botão Entendi), 'click' (o parceiro clica na
     tela) e 'quiz' (pergunta com alternativas).
   ========================================================================= */
(function () {
  const F = TREINO.fmt;
  const Tour = {};
  let layer, spot, tip, blk = [];
  let seq = [], idx = 0, cur = null, target = null, rafId = 0, last = '', opts = {}, advancing = false, token = 0;
  let answered = false;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // requestAnimationFrame com reserva: abas em segundo plano não disparam quadros
  const frame = () => new Promise((r) => { let done = false; const ok = () => { if (!done) { done = true; r(); } }; requestAnimationFrame(ok); setTimeout(ok, 60); });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sel = (t) => (/^[.#\[]/.test(t) ? t : `[data-tour="${t}"]`);
  const el = (tag, cls) => { const e = document.createElement(tag); e.className = cls; return e; };
  const bulb = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/></svg>';
  const speaker = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  const vozBtn = () =>
    TREINO.Voz && TREINO.Voz.temVozPt()
      ? `<button type="button" class="tr-voz" data-tr="voz" aria-label="Ouvir de novo" title="Ouvir de novo">${speaker}</button>`
      : '';
  const hand = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.3 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16"/></svg>';

  Tour.init = function () {
    layer = document.getElementById('tour-layer');
    spot = el('div', 'tr-spot');
    layer.appendChild(spot);
    for (let i = 0; i < 5; i++) { const b = el('div', 'tr-block'); layer.appendChild(b); blk.push(b); }
    tip = el('div', 'tr-tip');
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-live', 'polite');
    layer.appendChild(tip);

    tip.addEventListener('click', onTipClick);
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', () => { last = ''; });
  };

  Tour.play = function (sequence, startAt, o) {
    seq = sequence;
    opts = o || {};
    if (TREINO.Voz) TREINO.Voz.esquecerPasso();
    layer.classList.add('on');
    show(startAt || 0);
  };

  Tour.stop = function () {
    token++;
    cancelAnimationFrame(rafId);
    cur = null;
    target = null;
    clearFocus();
    if (layer) layer.classList.remove('on');
    if (tip) tip.classList.remove('in');
    if (TREINO.Voz) TREINO.Voz.parar();
  };

  Tour.current = () => cur && { idx, total: seq.length, kind: cur.kind, mode: cur.mode, target: cur.target, click: cur.click, found: !!target };
  // Lê o balão atual (usado quando a narração é ligada no meio de um passo)
  // Narração: cada passo tem uma chave própria, para ser falado uma única vez
  const chave = () => (opts.chave || '') + ':' + idx;
  const falarPasso = (forcar) => { if (cur && TREINO.Voz) TREINO.Voz.falarPasso(chave(), TREINO.Voz.roteiro(cur), { forcar }); };
  Tour.falarAtual = () => { if (cur && tip.classList.contains('in')) falarPasso(true); };
  Tour.next = () => go(idx + 1);
  Tour.back = () => go(idx - 1);

  const barH = () => (opts.barH ? opts.barH() : 0);

  function go(i) {
    if (i < 0) return;
    if (i >= seq.length) { opts.onEnd && opts.onEnd(); return; }
    show(i);
  }

  function clearFocus() {
    document.querySelectorAll('.tr-focus').forEach((e) => e.classList.remove('tr-focus', 'tr-clickme'));
  }

  function findTarget() {
    return cur && cur.target ? document.querySelector(sel(cur.target)) : null;
  }

  async function show(i) {
    const my = ++token;
    idx = i;
    cur = seq[i];
    advancing = false;
    answered = false;
    clearFocus();
    tip.classList.remove('in');
    if (TREINO.Voz) TREINO.Voz.parar();

    const changed = cur.state ? opts.applyState(cur.state) : false;
    opts.onStep && opts.onStep(i, seq, cur);
    await frame();
    await frame();
    if (changed) await wait(260);
    if (my !== token) return;

    target = findTarget();
    if (target) {
      const r = target.getBoundingClientRect();
      const top = barH() + 12, bottom = window.innerHeight - 12;
      const small = window.innerWidth < 640;
      if (r.top < top || r.bottom > bottom) {
        target.scrollIntoView({ block: small || r.height > (bottom - top) * 0.55 ? 'start' : 'center', behavior: 'smooth' });
        await scrollSettled(target);
        if (my !== token) return;
      }
    }

    renderTip();
    last = '';
    loop();
    await frame();
    if (my !== token) return;
    tip.classList.add('in');
    // Fala depois que o spotlight parou; se o passo mudar antes, não fala
    setTimeout(() => { if (my === token) falarPasso(false); }, 300);

    if (target) {
      target.classList.add('tr-focus');
      if (cur.mode === 'click') target.classList.add('tr-clickme');
      if (cur.countUp) countUp(target);
    }
    const btn = tip.querySelector('.tr-next:not([disabled])');
    if (btn && window.innerWidth >= 640) btn.focus({ preventScroll: true });
  }

  // Espera o scroll suave terminar (posição estável por alguns quadros)
  async function scrollSettled(t) {
    let prev = null, still = 0;
    const t0 = performance.now();
    await wait(80);
    while (performance.now() - t0 < 1200) {
      await frame();
      const y = Math.round(t.getBoundingClientRect().top);
      still = y === prev ? still + 1 : 0;
      prev = y;
      if (still >= 4) break;
    }
  }

  function loop() {
    cancelAnimationFrame(rafId);
    const tick = () => {
      if (!cur) return;
      if (target && !document.body.contains(target)) target = findTarget();
      const r = target ? target.getBoundingClientRect() : null;
      const key = (r ? [r.left, r.top, r.width, r.height].map(Math.round).join(',') : 'none') + '|' + window.innerWidth + 'x' + window.innerHeight + '|' + tip.offsetHeight;
      if (key !== last) { last = key; layout(r); }
      rafId = requestAnimationFrame(tick);
    };
    tick();
  }

  function layout(r) {
    const vw = window.innerWidth, vh = window.innerHeight, top0 = barH();
    const pad = cur.pad != null ? cur.pad : 8;
    let h = null;
    if (r && r.width > 0 && r.height > 0) {
      let x = r.left - pad, y = r.top - pad;
      const x2 = Math.min(vw - 3, r.right + pad), y2 = Math.min(vh - 3, r.bottom + pad);
      x = Math.max(3, x);
      y = Math.max(top0 + 3, y);
      if (x2 > x && y2 > y) h = { x, y, w: x2 - x, h: y2 - y };
    }

    if (h) {
      Object.assign(spot.style, { left: h.x + 'px', top: h.y + 'px', width: h.w + 'px', height: h.h + 'px' });
      spot.classList.toggle('pulse', cur.mode === 'click');
      spot.classList.remove('empty');
      const S = (b, x, y, w, hh) => Object.assign(b.style, { display: 'block', left: x + 'px', top: y + 'px', width: Math.max(0, w) + 'px', height: Math.max(0, hh) + 'px' });
      S(blk[0], 0, 0, vw, h.y);
      S(blk[1], 0, h.y + h.h, vw, vh - h.y - h.h);
      S(blk[2], 0, h.y, h.x, h.h);
      S(blk[3], h.x + h.w, h.y, vw - h.x - h.w, h.h);
      if (cur.mode === 'click') blk[4].style.display = 'none';
      else S(blk[4], h.x, h.y, h.w, h.h);
    } else {
      Object.assign(spot.style, { left: vw / 2 + 'px', top: (vh + top0) / 2 + 'px', width: '0px', height: '0px' });
      spot.classList.remove('pulse');
      spot.classList.add('empty');
      Object.assign(blk[0].style, { display: 'block', left: 0, top: 0, width: vw + 'px', height: vh + 'px' });
      for (let i = 1; i < 5; i++) blk[i].style.display = 'none';
    }
    placeTip(h);
  }

  function placeTip(h) {
    const vw = window.innerWidth, vh = window.innerHeight, m = 12, g = 16, top0 = barH();
    const small = vw < 640;
    const centered = !h || cur.kind === 'intro' || cur.kind === 'summary';
    const w = centered ? Math.min(cur.kind === 'summary' ? 460 : 440, vw - 2 * m) : Math.min(cur.wide ? 400 : 356, vw - 2 * m);
    tip.style.width = w + 'px';
    const maxH = vh - top0 - 2 * m;
    tip.style.maxHeight = maxH + 'px';
    // Só rola quando o balão não cabe; assim a setinha não é cortada
    tip.style.overflowY = tip.scrollHeight > maxH + 1 ? 'auto' : 'visible';
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x, y, place = 'center';

    if (centered) {
      x = (vw - tw) / 2;
      y = top0 + (vh - top0 - th) / 2;
    } else {
      const fits = {
        bottom: h.y + h.h + g + th <= vh - m,
        top: h.y - g - th >= top0 + m,
        right: h.x + h.w + g + tw <= vw - m,
        left: h.x - g - tw >= m,
      };
      const order = small ? ['bottom', 'top'] : [cur.place, 'bottom', 'top', 'right', 'left'].filter(Boolean);
      place = order.find((p) => fits[p]) || 'dock';
      const cx = h.x + h.w / 2, cy = h.y + h.h / 2;
      if (place === 'bottom') { y = h.y + h.h + g; x = cx - tw / 2; }
      else if (place === 'top') { y = h.y - g - th; x = cx - tw / 2; }
      else if (place === 'right') { x = h.x + h.w + g; y = cy - th / 2; }
      else if (place === 'left') { x = h.x - g - tw; y = cy - th / 2; }
      else { x = (vw - tw) / 2; y = vh - th - m; }
      x = clamp(x, m, vw - tw - m);
      y = clamp(y, top0 + m, Math.max(top0 + m, vh - th - m));

      const arrow = tip.querySelector('.tr-arrow');
      if (arrow) {
        if (place === 'bottom' || place === 'top') arrow.style.left = clamp(cx - x, 22, tw - 22) + 'px';
        else arrow.style.left = '';
        if (place === 'left' || place === 'right') arrow.style.top = clamp(cy - y, 22, th - 22) + 'px';
        else arrow.style.top = '';
      }
    }
    tip.dataset.place = place;
    tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  /* ------------------------------ Conteúdo do balão ------------------------------ */
  function calcHtml(rows) {
    return `<div class="tr-calc">${rows
      .map((r) => `<div class="tc-r ${r.total ? 'tot' : ''} ${r.hl ? 'hl' : ''}"><span class="tc-op">${r.op || ''}</span><span class="tc-l">${r.l}</span><b class="tc-v">${r.v != null ? F(r.v) : r.txt || ''}</b></div>`)
      .join('')}</div>`;
  }

  function stepNumbers() {
    const steps = seq.filter((s) => s.kind === 'step');
    return { n: steps.indexOf(cur) + 1, total: steps.length };
  }

  function renderTip() {
    tip.className = 'tr-tip k-' + (cur.kind || 'step') + ' m-' + (cur.mode || 'next');
    if (cur.kind === 'intro' || cur.kind === 'summary') {
      tip.innerHTML = `<div class="tr-voz-float">${vozBtn()}</div>` + cur.html;
      return;
    }
    const { n, total } = stepNumbers();
    const body = typeof cur.body === 'function' ? cur.body() : cur.body || '';
    let actions = '';
    const back = `<button type="button" class="tr-back" data-tr="back">Voltar</button>`;
    if (cur.mode === 'click') {
      actions = `
        <div class="tr-hint">${hand}<span>${cur.hint || 'Clique no item destacado'}</span></div>
        <div class="tr-actions">${back}<button type="button" class="tr-skip" data-tr="next">Pular esta etapa</button></div>`;
    } else if (cur.mode === 'quiz') {
      actions = `
        <div class="tr-quiz">${cur.options.map((o, i) => `<button type="button" class="tr-opt" data-tr="opt" data-i="${i}"><span class="tr-radio"></span><span>${o.t}</span></button>`).join('')}</div>
        <div class="tr-fb" aria-live="polite"></div>
        <div class="tr-actions">${back}<button type="button" class="tr-next" data-tr="next" disabled>Próximo</button></div>`;
    } else {
      actions = `<div class="tr-actions">${idx > 0 ? back : '<span></span>'}<button type="button" class="tr-next" data-tr="next">${cur.btn || 'Entendi'}</button></div>`;
    }
    tip.innerHTML = `
      <div class="tr-arrow"></div>
      <div class="tr-head"><span class="tr-kicker">${cur.kicker || ''}</span><span class="tr-head-r">${vozBtn()}<span class="tr-count">${n} de ${total}</span></span></div>
      <div class="tr-title"><span class="tr-bulb">${bulb}</span><h4>${cur.title || ''}</h4></div>
      ${body ? `<div class="tr-body">${body}</div>` : ''}
      ${cur.calc ? calcHtml(cur.calc) : ''}
      ${cur.foot ? `<div class="tr-foot">${cur.foot}</div>` : ''}
      ${cur.mode === 'quiz' ? `<div class="tr-q">${cur.q}</div>` : ''}
      ${actions}
      <div class="tr-progress"><i style="width:${(n / total) * 100}%"></i></div>`;
  }

  function onTipClick(e) {
    const b = e.target.closest('[data-tr]');
    if (!b || !cur) return;
    const a = b.dataset.tr;
    if (a === 'next') { if (!b.disabled) Tour.next(); }
    else if (a === 'back') Tour.back();
    else if (a === 'opt') answer(+b.dataset.i, b);
    else if (a === 'voz') falarPasso(true);
    else if (a.startsWith('cb:')) opts.onAction && opts.onAction(a.slice(3));
  }

  function answer(i, btn) {
    if (answered) return;
    const o = cur.options[i];
    const fb = tip.querySelector('.tr-fb');
    tip.querySelectorAll('.tr-opt').forEach((x) => x.classList.remove('wrong'));
    if (o.ok) {
      answered = true;
      btn.classList.add('right');
      tip.querySelectorAll('.tr-opt').forEach((x) => { x.disabled = true; });
      fb.className = 'tr-fb ok';
      fb.innerHTML = '✓ ' + (cur.ok || 'Isso mesmo!');
      if (TREINO.Voz) TREINO.Voz.falar(['Isso mesmo!', cur.ok || '']);
      const nx = tip.querySelector('.tr-next');
      nx.disabled = false;
      nx.focus({ preventScroll: true });
    } else {
      btn.classList.add('wrong');
      fb.className = 'tr-fb no';
      fb.innerHTML = o.fb || cur.no || 'Ainda não. Olhe de novo o item destacado.';
      if (TREINO.Voz) TREINO.Voz.falar([fb.textContent]);
    }
    last = '';
  }

  function onDocClick(e) {
    if (!cur || cur.mode !== 'click' || advancing) return;
    if (tip.contains(e.target)) return;
    const t = e.target.closest(sel(cur.click || cur.target));
    if (t) {
      advancing = true;
      spot.classList.remove('pulse');
      if (TREINO.Voz) TREINO.Voz.parar();
      setTimeout(() => { if (cur) Tour.next(); }, 380);
    }
  }

  function onKey(e) {
    if (!cur || /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.target.closest('button'))) {
      const nx = tip.querySelector('.tr-next');
      if (nx && !nx.disabled) { e.preventDefault(); nx.click(); }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      Tour.back();
    }
  }

  function countUp(t) {
    const list = t.matches('.money') ? [t] : Array.from(t.querySelectorAll('.money'));
    list.slice(0, 6).forEach((m) => {
      const to = +m.dataset.money, pre = m.dataset.pre || '';
      const t0 = performance.now(), dur = 750;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        m.textContent = pre + F(Math.round(to * e));
        if (k < 1 && document.body.contains(m)) requestAnimationFrame(step);
        else m.textContent = pre + F(to);
      };
      requestAnimationFrame(step);
    });
  }

  TREINO.Tour = Tour;
})();
