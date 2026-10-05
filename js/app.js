/* =========================================================================
   APLICAÇÃO — telas do treinamento, navegação e progresso
   Rotas: #/  #/cadastro  #/modulos  #/modulo/N  #/explorar  #/revisao  #/comecar
   Cenário: ?cenario=1|2|3 na URL (definido para cada parceiro)
   ========================================================================= */
(function () {
  const F = TREINO.fmt;
  const KEY = 'bigou-treino-financeiro-v2';
  const app = document.getElementById('app');
  const A = { sc: 1, d: null, mods: [], saved: {}, destino: null, ativo: null };
  const An = TREINO.Analytics;
  const ev = (tipo, d) => { try { An && An.registrar(tipo, d); } catch (e) { /* analytics nunca trava o treino */ } };

  /* ------------------------------ Progresso ------------------------------ */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(A.saved)); } catch (e) { /* sem armazenamento */ } }
  function prog() { A.saved.p = A.saved.p || {}; return (A.saved.p[A.sc] = A.saved.p[A.sc] || {}); }
  const status = (n) => prog()[n] || 'novo';
  function setStatus(n, s) { const p = prog(); if (p[n] === 'done' && s === 'prog') return; p[n] = s; save(); }
  const doneCount = () => A.mods.filter((m) => status(m.n) === 'done').length;
  const firstPending = () => (A.mods.find((m) => status(m.n) !== 'done') || A.mods[0]).n;

  function setScenario(id) {
    A.sc = TREINO.cenarios[id] ? id : 1;
    A.saved.sc = A.sc;
    save();
    A.d = TREINO.calc(TREINO.cenarios[A.sc]);
    A.mods = TREINO.buildModules(A.d);
  }

  /* ------------------------------ Utilidades ------------------------------ */
  let toastTimer = 0;
  TREINO.toast = function (msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2800);
  };

  const ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/></svg>',
    redo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg>',
    cursor: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 7-6 2-2 6z"/></svg>',
    som: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    mudo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  };

  /* ------------------------------ Narração ------------------------------ */
  const Voz = TREINO.Voz;
  function vozToggle(variant) {
    if (!Voz || !Voz.disponivel) return '';
    const ok = Voz.temVozPt(), on = ok && Voz.ligada;
    const label = variant === 'home' ? 'Narração por voz' : 'Narração';
    return `<button type="button" class="t-voz ${variant} ${on ? 'on' : ''}" data-voz aria-pressed="${on}" ${ok ? '' : 'disabled title="Este navegador não tem voz em português instalada"'}>
      <span class="t-voz-ic">${on ? ICON.som : ICON.mudo}</span><span class="t-voz-l">${label}</span>${variant === 'home' ? `<span class="t-switch" aria-hidden="true"><i></i></span>` : ''}
    </button>`;
  }
  function syncVoz() {
    const on = !!(Voz && Voz.ligada && Voz.temVozPt());
    document.body.classList.toggle('voz-on', on);
    document.querySelectorAll('[data-voz]').forEach((b) => {
      const variant = b.classList.contains('home') ? 'home' : 'bar';
      const tmp = document.createElement('div');
      tmp.innerHTML = vozToggle(variant);
      if (tmp.firstElementChild) b.replaceWith(tmp.firstElementChild);
    });
  }
  if (Voz) {
    Voz.aoMudar(syncVoz);
    Voz.aoEstado((e) => document.body.classList.toggle('voz-falando', e === 'falando'));
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-voz]');
      if (!b || b.disabled) return;
      Voz.ligar(!Voz.ligada);
      ev('voz', { detalhe: { ligada: Voz.ligada } });
      if (Voz.ligada) {
        TREINO.toast('Narração ligada.');
        if (TREINO.Tour.current()) TREINO.Tour.falarAtual();
        else Voz.falar(['Narração ligada. Durante o treinamento, eu leio cada explicação para você.']);
      } else TREINO.toast('Narração desligada.');
    });
  }

  /* ------------------------------ Cadastro da loja ------------------------------ */
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const semAcento = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function lojaLinha() {
    const p = An && An.participante();
    if (!p) return '';
    return `<p class="h-loja">Loja: <b>${esc(p.loja)}</b> · ${esc(p.cidade)} <a href="#/cadastro" class="h-loja-trocar">trocar</a></p>`;
  }

  function viewCadastro() {
    const p = (An && An.participante()) || {};
    app.innerHTML = `
      <div class="tv tv-cad">
        <header class="t-top">
          <a class="t-link" href="#/">${ICON.arrowL}Início</a>
          <div class="t-logo"><img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32"><span>Treinamento Financeiro</span></div>
          <span></span>
        </header>
        <main class="cad">
          <form class="cad-card" id="cad-form" novalidate>
            <span class="cad-kicker">Antes de começar</span>
            <h1>Conte qual é a sua loja</h1>
            <p class="t-lead sm">Assim conseguimos acompanhar o treinamento e melhorar as explicações. Os valores do treinamento continuam fictícios.</p>
            <label class="cad-f">
              <span>Nome da loja</span>
              <input id="cad-loja" name="loja" type="text" maxlength="60" autocomplete="organization" placeholder="Ex.: Lanchonete da Ana" value="${esc(p.loja || '')}" required>
              <small class="cad-err" id="cad-loja-err"></small>
            </label>
            <div class="cad-f cad-combo">
              <label for="cad-cidade">Cidade</label>
              <input id="cad-cidade" type="text" role="combobox" aria-expanded="false" aria-controls="cad-lista" aria-autocomplete="list" autocomplete="off" placeholder="Digite para buscar a cidade" value="${esc(p.cidade || '')}">
              <ul id="cad-lista" role="listbox" class="cad-lista" hidden></ul>
              <small class="cad-err" id="cad-cidade-err"></small>
            </div>
            <button type="submit" class="t-btn primary lg cad-ok">${ICON.play}Continuar</button>
          </form>
        </main>
      </div>`;

    const form = document.getElementById('cad-form');
    const iLoja = document.getElementById('cad-loja');
    const iCid = document.getElementById('cad-cidade');
    const lista = document.getElementById('cad-lista');
    let ativo = -1, opcoes = [];

    function abrir(filtro) {
      const f = semAcento(filtro.trim());
      // Primeiro as cidades que começam com o texto digitado, depois as que contêm
      opcoes = TREINO.cidades
        .filter((c) => !f || semAcento(c).includes(f))
        .sort((a, b) => (f ? (semAcento(a).startsWith(f) ? 0 : 1) - (semAcento(b).startsWith(f) ? 0 : 1) : 0))
        .slice(0, 60);
      lista.innerHTML = opcoes.length
        ? opcoes.map((c, i) => `<li role="option" id="cad-op-${i}" data-c="${esc(c)}" aria-selected="${i === ativo}">${esc(c)}</li>`).join('')
        : '<li class="cad-vazio">Nenhuma cidade encontrada</li>';
      lista.hidden = false;
      iCid.setAttribute('aria-expanded', 'true');
    }
    function fechar() { lista.hidden = true; ativo = -1; iCid.setAttribute('aria-expanded', 'false'); iCid.removeAttribute('aria-activedescendant'); }
    function escolher(c) { iCid.value = c; fechar(); document.getElementById('cad-cidade-err').textContent = ''; }
    function marcar() {
      lista.querySelectorAll('[role=option]').forEach((li, i) => li.setAttribute('aria-selected', i === ativo));
      const el = document.getElementById('cad-op-' + ativo);
      if (el) { el.scrollIntoView({ block: 'nearest' }); iCid.setAttribute('aria-activedescendant', el.id); }
    }

    iCid.addEventListener('focus', () => abrir(TREINO.cidades.includes(iCid.value) ? '' : iCid.value));
    iCid.addEventListener('input', () => { ativo = -1; abrir(iCid.value); });
    iCid.addEventListener('keydown', (e) => {
      if (lista.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) abrir(iCid.value);
      if (e.key === 'ArrowDown') { e.preventDefault(); ativo = Math.min(opcoes.length - 1, ativo + 1); marcar(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); ativo = Math.max(0, ativo - 1); marcar(); }
      else if (e.key === 'Enter' && !lista.hidden && ativo >= 0) { e.preventDefault(); escolher(opcoes[ativo]); }
      else if (e.key === 'Escape') fechar();
    });
    lista.addEventListener('mousedown', (e) => { const li = e.target.closest('[data-c]'); if (li) { e.preventDefault(); escolher(li.dataset.c); } });
    iCid.addEventListener('blur', () => setTimeout(fechar, 120));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const loja = iLoja.value.trim().replace(/\s+/g, ' ');
      // Aceita a cidade digitada sem acento/maiúscula, desde que seja da lista
      const cidade = TREINO.cidades.find((c) => semAcento(c) === semAcento(iCid.value.trim())) || '';
      const eL = document.getElementById('cad-loja-err'), eC = document.getElementById('cad-cidade-err');
      eL.textContent = loja.length < 2 ? 'Digite o nome da sua loja.' : '';
      eC.textContent = cidade ? '' : 'Escolha uma cidade da lista.';
      if (loja.length < 2) { iLoja.focus(); return; }
      if (!cidade) { iCid.focus(); return; }
      if (An) An.cadastrar(loja, cidade, A.sc);
      const destino = A.destino || '#/comecar';
      A.destino = null;
      location.replace(destino);
    });
    if (!p.loja) iLoja.focus({ preventScroll: true });
  }

  const storePill = () => `<div class="t-store"><span class="t-dot"></span>Loja de Treinamento - Rio Pomba - MG</div>`;

  function progressBlock() {
    const done = doneCount(), total = A.mods.length, p = Math.round((done / total) * 100);
    return `
      <div class="t-progress" aria-label="Progresso do treinamento">
        <div class="t-progress-top"><span>Seu treinamento</span><b>${p}%</b></div>
        <div class="t-bar"><i style="width:${p}%"></i></div>
        <small>${done} de ${total} módulos concluídos</small>
      </div>`;
  }


  const statusLabel = { novo: 'Não iniciado', prog: 'Em andamento', done: 'Concluído' };

  /* ------------------------------ Tela inicial ------------------------------ */
  const FASES = [
    { t: 'Vendas e pagamentos', s: 'Relatório e as 3 formas de pagamento', m: [1, 2, 3] },
    { t: 'Tela Financeiro', s: 'Resultado e repasses', m: [4] },
    { t: 'A fatura', s: 'O que entrou e o que saiu', m: [5, 6] },
    { t: 'Repasse e prática', s: 'Antecipação e exercício', m: [7, 8] },
  ];
  const AVISO = 'Todos os dados são fictícios, inclusive os valores de comissão e taxas. Confira no seu contrato os valores praticados na sua loja.';

  function viewHome() {
    const started = doneCount() > 0 || A.mods.some((m) => status(m.n) === 'prog');
    const mod = (n) => {
      const m = A.mods.find((x) => x.n === n), st = status(n);
      return `
        <li><a class="h-mod s-${st}" href="#/modulo/${n}">
          <span class="h-mod-n">${st === 'done' ? ICON.check : n}</span>
          <span class="h-mod-t"><b>${m.titulo}</b><small>${m.desc}</small></span>
          <span class="h-mod-st">${statusLabel[st]}</span>
        </a></li>`;
    };
    app.innerHTML = `
      <div class="tv tv-home">
        <header class="t-top">
          <div class="t-logo">
            <img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32">
            <span>Treinamento Financeiro</span>
          </div>
          ${vozToggle('bar')}
        </header>
        <main class="h-main">
          <section class="h-hero">
            <div class="h-hero-card">
              <div class="h-hero-content">
                <div class="h-hero-top">
                  ${storePill()}
                  <ul class="h-meta">
                    <li>${ICON.clock}Cerca de 15 min</li>
                    <li>${ICON.grid}${A.mods.length} módulos</li>
                  </ul>
                </div>
                ${lojaLinha()}
                <h1>Vamos entender suas vendas?</h1>
                <p class="t-lead">Em poucos minutos, você vai entender como os valores da sua loja aparecem no sistema.</p>
                <div class="h-cta">
                  <a class="t-btn primary lg" href="#/comecar">${ICON.play}${started ? 'Continuar treinamento' : 'Começar treinamento'}</a>
                  <a class="t-btn ghost lg" href="#/modulos">${ICON.grid}Ver módulos</a>
                </div>
                <div class="h-hero-voz">
                  ${vozToggle('home')}
                </div>
              </div>
              <div class="h-hero-side">
                ${started ? progressBlock() : `
                  <div class="h-quick-card">
                    <div class="h-quick-ic">${ICON.grid}</div>
                    <div>
                      <b>100% Interativo</b>
                      <p>Aprenda com telas reais e explicações simples passo a passo.</p>
                    </div>
                  </div>
                `}
                <aside class="h-aviso" role="note">
                  <span class="h-aviso-ic">${ICON.info}</span>
                  <div><b>Treinamento ilustrativo</b><p>${AVISO}</p></div>
                </aside>
              </div>
            </div>
          </section>

          <section class="h-sec h-trilha" aria-labelledby="h-trilha-t">
            <div class="h-sec-head">
              <h2 id="h-trilha-t">Sua trilha de aprendizado</h2>
              <p class="h-sub">Do mais simples ao mais completo. Você pode começar por qualquer módulo.</p>
            </div>
            <div class="h-fases">
              ${FASES.map((fz, i) => `
                <div class="h-fase">
                  <div class="h-fase-h"><span class="h-fase-n">${i + 1}</span><div><b>${fz.t}</b><small>${fz.s}</small></div></div>
                  <ol class="h-mods">${fz.m.map(mod).join('')}</ol>
                </div>`).join('')}
            </div>
          </section>

          <section class="h-sec h-dicas" aria-labelledby="h-dicas-t">
            <div class="h-sec-head">
              <h2 id="h-dicas-t">Dicas importantes</h2>
              <p class="h-sub">Toque em um assunto para expandir as orientações.</p>
            </div>
            <div class="h-dicas-list">
              ${(TREINO.dicas || []).map((dc, i) => `
                <details class="h-dica">
                  <summary><span class="h-dica-n">${i + 1}</span><b>${dc.t}</b><span class="h-dica-chev" aria-hidden="true"></span></summary>
                  <div class="h-dica-c">
                    ${dc.p.map((x) => `<p>${x}</p>`).join('')}
                    ${dc.passos ? `<div class="h-dica-passos"><small>Como solicitar</small><ol>${dc.passos.map((x) => `<li>${x}</li>`).join('')}</ol></div>` : ''}
                  </div>
                </details>`).join('')}
            </div>
          </section>
        </main>
      </div>`;
  }

  /* ------------------------------ Módulos ------------------------------ */
  function viewModules() {
    const allDone = doneCount() === A.mods.length;
    app.innerHTML = `
      <div class="tv tv-mods">
        <header class="t-top">
          <a class="t-link" href="#/">${ICON.arrowL}Início</a>
          <div class="t-logo"><img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32"><span>Treinamento Financeiro</span></div>
          <span></span>
        </header>
        <main class="t-mods">
          <div class="t-mods-head">
            <div>
              ${storePill()}
              <h1>Treinamento</h1>
              <p class="t-lead sm">Escolha qualquer módulo. Você pode repetir quando quiser.</p>
            </div>
            ${progressBlock()}
          </div>
          <ol class="t-list">
            ${A.mods
              .map((m) => {
                const st = status(m.n);
                const btn = st === 'done' ? `${ICON.redo}Repetir` : st === 'prog' ? `${ICON.play}Continuar` : `${ICON.play}Começar`;
                return `
                <li class="t-mod s-${st}">
                  <a href="#/modulo/${m.n}" class="t-mod-a">
                    <span class="t-mod-n">${st === 'done' ? ICON.check : m.n}</span>
                    <span class="t-mod-txt"><small>Módulo ${m.n}</small><b>${m.titulo}</b><span>${m.desc}</span></span>
                    <span class="t-mod-st"><i></i>${statusLabel[st]}</span>
                    <span class="t-btn ${st === 'done' ? 'ghost' : 'primary'} sm">${btn}</span>
                  </a>
                </li>`;
              })
              .join('')}
          </ol>
          <div class="t-extra">
            <a class="t-extra-card" href="#/explorar">
              <span class="t-extra-ic">${ICON.cursor}</span>
              <span><b>Explorar a tela livremente</b><small>Clique onde quiser na tela, sem explicações.</small></span>
              ${ICON.arrowR}
            </a>
            <a class="t-extra-card ${allDone ? '' : 'muted'}" href="#/revisao">
              <span class="t-extra-ic">${ICON.check}</span>
              <span><b>O que você aprendeu</b><small>${allDone ? 'Revise tudo em uma tela.' : 'Disponível ao concluir todos os módulos.'}</small></span>
              ${ICON.arrowR}
            </a>
          </div>
        </main>
      </div>`;
  }

  /* ------------------------------ Player (módulo guiado) ------------------------------ */
  function dots(curN) {
    return A.mods
      .map((m) => `<a href="#/modulo/${m.n}" class="pb-dot s-${status(m.n)} ${m.n === curN ? 'cur' : ''}" title="Módulo ${m.n}: ${m.titulo}" aria-label="Módulo ${m.n}: ${m.titulo}">${m.n}</a>`)
      .join('');
  }

  function playerBar(title, sub, n) {
    return `
      <div class="pb" id="pb">
        <a class="pb-back" href="#/modulos">${ICON.arrowL}<span>Módulos</span></a>
        <div class="pb-mid"><small>${sub}<span class="pb-tag">Ilustrativo</span></small><b>${title}</b></div>
        <div class="pb-dots">${n ? dots(n) : ''}</div>
        ${vozToggle('bar')}
        <a class="pb-exit" href="#/" aria-label="Sair do treinamento">${ICON.x}<span>Sair</span></a>
        <div class="pb-line"><i id="pb-line"></i></div>
      </div>`;
  }

  const barH = () => { const b = document.getElementById('pb'); return b ? b.offsetHeight : 0; };

  function viewPlayer(n) {
    const m = A.mods.find((x) => x.n === n);
    if (!m) { location.hash = '#/modulos'; return; }
    document.body.classList.add('in-player');
    app.innerHTML = playerBar(m.titulo, `Módulo ${m.n} de ${A.mods.length}`, m.n) + '<div id="clone"></div>';
    TREINO.Clone.reset();
    TREINO.Clone.mount(document.getElementById('clone'), A.d);
    setStatus(n, 'prog');
    refreshDots(n);
    A.ativo = { n, inicio: Date.now(), passo: 0, tPasso: Date.now(), concluido: false };
    ev('modulo_inicio', { modulo: n });

    // Cada passo herda o estado do anterior quando não define um
    let st = m.steps[0].state;
    m.steps.forEach((s) => { if (s.state) st = s.state; else s.state = st; });
    const lastState = Object.assign({}, m.steps[m.steps.length - 1].state, { modals: [], xp: null });

    const next = A.mods.find((x) => x.n === n + 1);
    const intro = {
      kind: 'intro',
      state: m.steps[0].state,
      fala: [`Módulo ${m.n}: ${m.titulo}.`, m.intro].concat(m.aviso ? [m.aviso] : []),
      html: `
        <div class="tr-intro">
          <span class="tr-kicker">Módulo ${m.n} de ${A.mods.length}</span>
          <h3>${m.titulo}</h3>
          <p>${m.intro}</p>
          ${m.aviso ? `<div class="tr-aviso">${ICON.info}<span>${m.aviso}</span></div>` : ''}
          <div class="tr-learn-t">Neste módulo:</div>
          <ul class="tr-learn">${m.aprender.map((x) => `<li>${x}</li>`).join('')}</ul>
          <div class="tr-actions">
            <button type="button" class="tr-back" data-tr="cb:modules">Ver módulos</button>
            <button type="button" class="tr-next" data-tr="next">Vamos lá</button>
          </div>
        </div>`,
    };
    const summary = {
      kind: 'summary',
      state: lastState,
      fala: ['Pronto, você concluiu este módulo.', next ? 'Toque em Continuar para seguir.' : 'Toque em Ver o que aprendi para revisar tudo.'],
      html: `
        <div class="tr-sum">
          <div class="tr-check">${ICON.check}</div>
          <h3>Você entendeu este assunto.</h3>
          <ul class="tr-sum-list">${m.resumo.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join('')}</ul>
          <div class="tr-actions col">
            <button type="button" class="tr-next" data-tr="cb:continue">${next ? 'Continuar' : 'Ver o que aprendi'}</button>
            <div class="tr-row">
              <button type="button" class="tr-back" data-tr="back">Voltar</button>
              <button type="button" class="tr-back" data-tr="cb:repeat">Repetir módulo</button>
              <button type="button" class="tr-back" data-tr="cb:modules">Ver módulos</button>
            </div>
          </div>
        </div>`,
    };
    const seq = [intro].concat(m.steps.map((s) => Object.assign({ kind: 'step' }, s)), [summary]);

    window.scrollTo(0, 0);
    TREINO.Tour.play(seq, 0, {
      chave: `${A.sc}-${n}`,
      barH,
      applyState: (s) => TREINO.Clone.set(s),
      onStep: (i, all, item) => {
        const line = document.getElementById('pb-line');
        if (line) line.style.width = (i / (all.length - 1)) * 100 + '%';
        const at = A.ativo, agora = Date.now();
        if (at && item.kind === 'step') {
          // "anterior"/"ms": quanto tempo a pessoa ficou no passo de antes
          ev('passo', { modulo: n, passo: i, alvo: item.target, detalhe: { titulo: item.title, anterior: at.passo, ms: agora - at.tPasso } });
          at.passo = i;
          at.tPasso = agora;
        }
        if (item.kind === 'summary') {
          setStatus(n, 'done');
          refreshDots(n);
          if (at && !at.concluido) {
            at.concluido = true;
            ev('modulo_fim', { modulo: n, detalhe: { ms: agora - at.inicio, ultimo_passo_ms: agora - at.tPasso, ultimo_passo: at.passo } });
            if (doneCount() === A.mods.length) {
              const k = 'bigou-treino-concluido-' + (An ? An.id() : '') + '-' + A.sc;
              let ja = false;
              try { ja = localStorage.getItem(k) === '1'; localStorage.setItem(k, '1'); } catch (e) { /* sem armazenamento */ }
              if (!ja) ev('treino_concluido', { detalhe: { cenario: A.sc } });
            }
          }
        }
      },
      onSkip: (i, item) => ev('passo_pulado', { modulo: n, passo: i, alvo: item.target, detalhe: { titulo: item.title } }),
      onQuiz: (i, item, r) => ev('quiz', { modulo: n, passo: i, alvo: item.target, detalhe: { pergunta: item.title, q: item.q, acertou: r.acertou, tentativa: r.tentativa, opcao: r.opcao } }),
      onAction: (a) => {
        if (a === 'continue') location.hash = next ? '#/modulo/' + next.n : '#/revisao';
        else if (a === 'repeat') route();
        else if (a === 'modules') location.hash = '#/modulos';
      },
      onEnd: () => { location.hash = '#/modulos'; },
    });
  }

  function refreshDots(n) {
    const el = document.querySelector('.pb-dots');
    if (el) el.innerHTML = dots(n);
  }

  /* ------------------------------ Modo livre ------------------------------ */
  function viewExplore() {
    document.body.classList.add('in-player');
    app.innerHTML = playerBar('Explore à vontade', 'Modo livre', 0) + '<div id="clone"></div>';
    TREINO.Clone.reset();
    TREINO.Clone.mount(document.getElementById('clone'), A.d);
    ev('explorar');
    TREINO.toast('Clique onde quiser. Use o menu para trocar entre Relatório e Financeiro.');
  }

  /* ------------------------------ Revisão ------------------------------ */
  function viewReview() {
    const items = TREINO.buildReview(A.d);
    ev('revisao');
    app.innerHTML = `
      <div class="tv tv-review">
        <header class="t-top">
          <a class="t-link" href="#/modulos">${ICON.arrowL}Módulos</a>
          <div class="t-logo"><img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32"><span>Treinamento Financeiro</span></div>
          <span></span>
        </header>
        <main class="t-review">
          <div class="t-review-badge">${ICON.check}</div>
          <h1>O que você aprendeu?</h1>
          ${storePill()}
          <ul class="t-review-list">
            ${items.map(([t, s], i) => `<li style="animation-delay:${i * 70}ms"><span class="t-rv-ic">${ICON.check}</span><span><b>${t}</b><small>${s}</small></span></li>`).join('')}
          </ul>
          <p class="t-review-msg">Agora você já consegue entender de onde vêm os valores apresentados.</p>
          <div class="t-cta center">
            <a class="t-btn primary lg" href="#/modulos">Voltar aos módulos</a>
            <a class="t-btn ghost lg" href="#/explorar">${ICON.cursor}Explorar a tela</a>
          </div>
        </main>
      </div>`;
  }

  /* ------------------------------ Rotas ------------------------------ */
  // Saiu de um módulo sem chegar ao resumo: registra onde parou
  function registrarSaida(motivo) {
    const at = A.ativo;
    if (at && !at.concluido) ev('modulo_saida', { modulo: at.n, passo: at.passo, detalhe: { motivo, ms: Date.now() - at.inicio, ms_no_passo: Date.now() - at.tPasso } });
    A.ativo = null;
  }
  window.addEventListener('pagehide', () => { registrarSaida('fechou'); if (An) An.enviar(true); });

  function route() {
    registrarSaida('navegou');
    TREINO.Tour.stop();
    document.body.classList.remove('in-player');
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    const view = parts[0];
    // Pede o cadastro da loja antes de começar
    if (['comecar', 'modulo', 'modulos'].includes(view) && An && !An.participante()) {
      A.destino = location.hash;
      location.replace('#/cadastro');
      return;
    }
    if (An) An.enviar();
    if (view === 'cadastro') viewCadastro();
    else if (view === 'modulos') viewModules();
    else if (view === 'modulo') viewPlayer(parseInt(parts[1], 10) || 1);
    else if (view === 'explorar') viewExplore();
    else if (view === 'revisao') viewReview();
    else if (view === 'comecar') { location.replace('#/modulo/' + firstPending()); return; }
    else viewHome();
    if (view !== 'modulo') window.scrollTo(0, 0);
  }

  /* ------------------------------ Início ------------------------------ */
  A.saved = load();
  const urlScen = parseInt(new URLSearchParams(location.search).get('cenario'), 10);
  setScenario(urlScen || A.saved.sc || 1);
  TREINO.Tour.init();
  syncVoz();
  ev('acesso', { detalhe: { cenario: A.sc } });
  // Dica aberta na tela inicial ("toggle" não borbulha: escuta na captura)
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (d.classList && d.classList.contains('h-dica') && d.open) ev('dica', { detalhe: { dica: d.querySelector('summary b').textContent } });
  }, true);
  window.addEventListener('hashchange', route);
  route();
})();
