/* =========================================================================
   APLICAÇÃO — telas do treinamento, navegação e progresso
   Rotas: #/  #/cadastro  #/modulos  #/modulo/N  #/modulo/N/inicio (recomeçar)
          #/explorar  #/dicas  #/revisao  #/certificado  #/comecar
   ========================================================================= */
(function () {
  const F = TREINO.fmt;
  const KEY = 'bigou-treino-financeiro-v4';
  const app = document.getElementById('app');
  const A = { d: null, mods: [], saved: {}, destino: null, ativo: null };
  const An = TREINO.Analytics;
  const ev = (tipo, d) => { try { An && An.registrar(tipo, d); } catch (e) { /* analytics nunca trava o treino */ } };

  /* ------------------------------ Progresso ------------------------------ */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(A.saved)); } catch (e) { /* sem armazenamento */ } }
  function prog() { return (A.saved.p = A.saved.p || {}); }
  // Último passo visto em cada módulo (para retomar de onde parou)
  function passos() { return (A.saved.passo = A.saved.passo || {}); }
  const status = (n) => prog()[n] || 'novo';
  function setStatus(n, s) { const p = prog(); if (p[n] === 'done' && s === 'prog') return; p[n] = s; save(); }
  const doneCount = () => A.mods.filter((m) => status(m.n) === 'done').length;
  // Passos vistos e resultado da 1ª tentativa de cada pergunta (para o certificado)
  function vistos() { return (A.saved.visto = A.saved.visto || {}); }
  function respostas() { return (A.saved.quiz = A.saved.quiz || {}); }

  /* ------------------------------ Certificado: requisitos ------------------------------ */
  // Libera com 100% do conteúdo visto e mais de 70% de acertos na 1ª tentativa
  const ACERTO_MIN = 0.7;
  function certStatus() {
    let passosTot = 0, passosVistos = 0;
    const perguntas = [];
    A.mods.forEach((m) => {
      const v = vistos()[m.n] || [];
      m.steps.forEach((st, j) => {
        passosTot++;
        if (v.includes(j + 1)) passosVistos++;
        if (st.mode === 'quiz') perguntas.push({ m: m.n, k: `${m.n}:${j + 1}` });
      });
    });
    const R = respostas();
    const acertos = perguntas.filter((q) => R[q.k] === true).length;
    const conteudo = doneCount() === A.mods.length ? passosVistos / passosTot : Math.min(passosVistos / passosTot, 0.99);
    const taxa = perguntas.length ? acertos / perguntas.length : 1;
    const refazer = [...new Set(perguntas.filter((q) => R[q.k] !== true).map((q) => q.m))];
    return { conteudo, acertos, perguntas: perguntas.length, taxa, refazer, conteudoOk: conteudo >= 1, acertoOk: taxa > ACERTO_MIN, ok: conteudo >= 1 && taxa > ACERTO_MIN };
  }
  const pct = (x) => Math.floor(x * 100) + '%';
  const firstPending = () => (A.mods.find((m) => status(m.n) !== 'done') || A.mods[0]).n;

  /* ------------------------------ Tempo estimado ------------------------------ */
  // Cerca de 12 s por passo de leitura e 25 s por passo de clique ou pergunta, mais a abertura
  function segundosModulo(m, aPartirDe) {
    return m.steps.slice(aPartirDe || 0).reduce((t, st) => t + (st.mode === 'click' || st.mode === 'quiz' ? 25 : 12), aPartirDe ? 0 : 20);
  }
  const minutos = (seg) => Math.max(1, Math.round(seg / 60));
  const tempoMod = (m) => `≈ ${minutos(segundosModulo(m))} min`;
  function minutosRestantes() {
    return minutos(A.mods.filter((m) => status(m.n) !== 'done').reduce((t, m) => t + segundosModulo(m, Math.max(0, (passos()[m.n] || 1) - 1)), 0));
  }
  function retomada() {
    const m = A.mods.find((x) => status(x.n) === 'prog' && passos()[x.n] > 1) || null;
    return m ? { n: m.n, passo: passos()[m.n] } : null;
  }
  const lojaNome = () => { const p = An && An.participante(); return p ? p.loja : ''; };

  /* ------------------------------ Utilidades ------------------------------ */
  let toastTimer = 0;
  TREINO.toast = function (msg, acao) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    if (acao) {
      const a = document.createElement('a');
      a.href = acao.href;
      a.textContent = acao.label;
      a.className = 'toast-acao';
      t.appendChild(a);
    }
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), acao ? 6000 : 2800);
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
    // Ícones dos módulos (linha, 24px)
    relatorio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 11h5M10 14.5h5M10 18h3"/></svg>',
    celular: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="M10 9.5l1.6 1.6L14.5 8"/></svg>',
    dinheiro: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/></svg>',
    painel: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M7.5 15.5v-3M11 15.5V9M14.5 15.5v-5M18 15.5V8"/></svg>',
    faturaEntra: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M12 7v6M9.5 10.5L12 13l2.5-2.5"/></svg>',
    faturaSai: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M12 13V7M9.5 9.5L12 7l2.5 2.5"/></svg>',
    moedas: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="9" cy="7" rx="5.5" ry="2.5"/><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5M3.5 11v4c0 1.4 2.5 2.5 5.5 2.5"/><ellipse cx="15.5" cy="13" rx="5" ry="2.3"/><path d="M10.5 13v4c0 1.3 2.2 2.3 5 2.3s5-1 5-2.3v-4"/></svg>',
    foguete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5c3-1.5 5.5-1.5 5.5-1.5s0 2.5-1.5 5.5l-6 6-4-4z"/><path d="M8.5 10.5l-3 .5-2 2 4 1M13.5 15.5l-.5 3-2 2-1-4"/><circle cx="15.5" cy="8.5" r="1.3"/><path d="M6 18c-1 .3-2 1.5-2.5 2.5 1-.5 2.2-1.5 2.5-2.5z"/></svg>',
    trofeu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z"/></svg>',
    medalha: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3l2.5 6M16 3l-2.5 6"/><circle cx="12" cy="14.5" r="5.5"/><path d="M12 11.8l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/></svg>',
    certificado: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 8.5h10M7 11.5h6"/><circle cx="16.5" cy="17" r="2.5"/><path d="M15.2 19.2L14.5 22l2-1 2 1-.7-2.8"/></svg>',
    impressora: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3.5h10V9M7 17.5H4.5v-7a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v7H17"/><rect x="7" y="14" width="10" height="7"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
    percent: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/><path d="M18.5 5.5l-13 13"/></svg>',
    lampada: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
    cadeado: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>',
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
      if (An) An.cadastrar(loja, cidade);
      const destino = A.destino || '#/comecar';
      A.destino = null;
      location.replace(destino);
    });
    if (!p.loja) iLoja.focus({ preventScroll: true });
  }

  function progressBlock() {
    const done = doneCount(), total = A.mods.length, p = Math.round((done / total) * 100);
    return `
      <div class="t-progress" aria-label="Progresso do treinamento">
        <div class="t-progress-top"><span>Seu treinamento</span><b>${p}%</b></div>
        <div class="t-bar"><i style="width:${p}%"></i></div>
        <small>${done} de ${total} módulos concluídos${done < total ? ` · faltam ≈ ${minutosRestantes()} min` : ' · treinamento completo!'}</small>
      </div>`;
  }


  const statusLabel = { novo: 'Não iniciado', prog: 'Em andamento', done: 'Concluído' };

  /* ------------------------------ Tela inicial ------------------------------ */
  const FASES = [
    { t: 'Vendas e pagamentos', s: 'Relatório e as 3 formas de pagamento', m: [1, 2, 3] },
    { t: 'Tela Financeiro', s: 'Resultado e repasses', m: [4] },
    { t: 'A fatura', s: 'O que entrou e o que saiu', m: [5, 6, 7, 8] },
    { t: 'Repasse e prática', s: 'Antecipação e exercício final', m: [9, 10] },
  ];
  const AVISO = 'Todos os dados são fictícios, inclusive os valores de comissão e taxas. Confira no seu contrato os valores praticados na sua loja.';

  function viewHome() {
    const done = doneCount(), total = A.mods.length;
    const started = done > 0 || A.mods.some((m) => status(m.n) === 'prog');
    const tudo = done === total;
    const ret = retomada();
    const loja = lojaNome();
    const cert = certStatus();
    const tituloMod = (n) => A.mods.find((m) => m.n === n).titulo;

    // Uma ação principal, sempre a próxima coisa a fazer
    let main;
    if (tudo && cert.ok) main = { href: '#/certificado', ic: ICON.certificado, t: 'Ver meu certificado', s: 'Você concluiu o treinamento!' };
    else if (tudo) main = { href: '#/certificado', ic: ICON.redo, t: 'Liberar meu certificado', s: `Você acertou ${pct(cert.taxa)}. Precisa de mais de 70%.` };
    else if (ret) main = { href: `#/modulo/${ret.n}`, ic: ICON.play, t: 'Continuar', s: `Módulo ${ret.n} · ${tituloMod(ret.n)}` };
    else if (started) main = { href: '#/comecar', ic: ICON.play, t: 'Continuar', s: `Módulo ${firstPending()} · ${tituloMod(firstPending())}` };
    else main = { href: '#/comecar', ic: ICON.play, t: 'Começar o treinamento', s: 'Passo a passo, no seu ritmo.' };

    const tile = (href, ic, t, sub, extra) => `
      <a class="hm-tile ${extra || ''}" href="${href}">
        <span class="hm-tile-ic">${ic}</span>
        <b>${t}</b>
        <small>${sub}</small>
      </a>`;

    app.innerHTML = `
      <div class="tv tv-home">
        <header class="t-top">
          <div class="t-logo">
            <img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32">
            <span>Treinamento Financeiro</span>
          </div>
          ${vozToggle('bar')}
        </header>
        <main class="hm">
          <h1 class="hm-ola">${tudo ? 'Parabéns' : 'Olá'}${loja ? `, <span>${esc(loja)}</span>` : ''}!</h1>
          <p class="hm-sub">${tudo ? 'Você pode rever qualquer módulo quando quiser.' : 'Aprenda como funcionam suas vendas, taxas e repasses.'}</p>

          <a class="hm-main" href="${main.href}">
            <span class="hm-main-ic">${main.ic}</span>
            <span class="hm-main-t"><b>${main.t}</b><small>${main.s}</small></span>
            ${ICON.arrowR}
            ${started && !tudo ? `<span class="hm-main-bar" aria-label="${done} de ${total} módulos concluídos"><i style="width:${(done / total) * 100}%"></i></span>` : ''}
          </a>

          <nav class="hm-grid" aria-label="Atalhos">
            ${tile('#/modulos', ICON.grid, 'Módulos', started ? `${done} de ${total} concluídos` : `${total} módulos curtos`)}
            ${tile('#/dicas', ICON.lampada, 'Dicas', 'Orientações rápidas')}
            ${tile('#/explorar', ICON.cursor, 'Explorar a tela', 'Clique à vontade')}
            ${tile('#/certificado', cert.ok ? ICON.certificado : ICON.cadeado, 'Certificado', cert.ok ? 'Pronto para baixar' : 'Veja o que falta', cert.ok ? 'ok' : 'lock')}
          </nav>

          <p class="hm-aviso">${ICON.info}<span><b>Treinamento ilustrativo.</b> ${AVISO}</span></p>
          ${loja ? `<p class="hm-loja">Não é a sua loja? <a href="#/cadastro">Trocar loja</a></p>` : ''}
        </main>
      </div>`;
  }

  /* ------------------------------ Dicas ------------------------------ */
  function viewDicas() {
    app.innerHTML = `
      <div class="tv tv-dicas">
        <header class="t-top">
          <a class="t-link" href="#/">${ICON.arrowL}Início</a>
          <div class="t-logo"><img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32"><span>Treinamento Financeiro</span></div>
          <span></span>
        </header>
        <main class="dc">
          <h1>Dicas importantes</h1>
          <p class="hm-sub">Toque em um assunto para ver as orientações.</p>
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
              <h1>Módulos</h1>
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
                    <span class="t-mod-n">${st === 'done' ? ICON.check : ICON[m.icone] || m.n}</span>
                    <span class="t-mod-txt"><small>Módulo ${m.n} · ${tempoMod(m)}</small><b>${m.titulo}</b><span>${m.desc}</span></span>
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
            ${allDone && certStatus().ok ? `<a class="t-extra-card destaque" href="#/certificado">
              <span class="t-extra-ic">${ICON.certificado}</span>
              <span><b>Seu certificado</b><small>Baixe ou imprima o certificado de conclusão.</small></span>
              ${ICON.arrowR}
            </a>` : ''}
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
    A.ativo = { n, inicio: Date.now(), passo: 0, tPasso: Date.now(), concluido: false, respondidas: new Set() };
    ev('modulo_inicio', { modulo: n });

    // Cada passo herda o estado do anterior quando não define um
    let st = m.steps[0].state;
    m.steps.forEach((s) => { if (s.state) st = s.state; else s.state = st; });
    const lastState = Object.assign({}, m.steps[m.steps.length - 1].state, { modals: [] });
    const fase = FASES.find((fz) => fz.m.includes(n));
    const fechaFase = fase && fase.m[fase.m.length - 1] === n;
    const loja = lojaNome();

    const next = A.mods.find((x) => x.n === n + 1);
    const intro = {
      kind: 'intro',
      state: m.steps[0].state,
      fala: [`Módulo ${m.n}: ${m.titulo}.`, m.intro].concat(m.aviso ? [m.aviso] : []),
      html: `
        <div class="tr-intro">
          <div class="tr-intro-top"><span class="tr-intro-ic">${ICON[m.icone] || ''}</span><span class="tr-kicker">Módulo ${m.n} de ${A.mods.length} · ${tempoMod(m)}</span></div>
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
      fala: [`Pronto${loja ? ', ' + loja : ''}! Você concluiu este módulo.`].concat(fechaFase ? [`Fase concluída: ${fase.t}.`] : [], [next ? 'Toque em Continuar para seguir.' : 'Toque em Ver o que aprendi para revisar tudo.']),
      html: `
        <div class="tr-sum">
          <div class="tr-check">${ICON.check}</div>
          <h3>${loja ? `Mandou bem, ${esc(loja)}!` : 'Mandou bem!'}</h3>
          <p class="tr-sum-sub">Você concluiu o Módulo ${m.n}${next ? ` · faltam ${A.mods.length - n} módulos` : ''}.</p>
          ${fechaFase ? `<div class="tr-fase">${ICON.medalha}<span><small>Fase concluída</small><b>${fase.t}</b></span></div>` : ''}
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

    // Retomar de onde parou (o tour reconstrói a tela pelo estado do passo)
    const salvo = passos()[n];
    const inicio = salvo > 1 && salvo < seq.length - 1 ? salvo : 0;
    if (inicio) TREINO.toast(`Continuando do passo ${inicio} de ${m.steps.length}.`, { label: 'Recomeçar', href: `#/modulo/${n}/inicio` });

    window.scrollTo(0, 0);
    TREINO.Tour.play(seq, inicio, {
      chave: `m${n}`,
      barH,
      applyState: (s) => TREINO.Clone.set(s),
      onStep: (i, all, item) => {
        const line = document.getElementById('pb-line');
        if (line) line.style.width = (i / (all.length - 1)) * 100 + '%';
        const at = A.ativo, agora = Date.now();
        if (item.kind === 'step') {
          passos()[n] = i;
          const v = (vistos()[n] = vistos()[n] || []);
          if (!v.includes(i)) v.push(i);
          save();
        }
        if (at && item.kind === 'step') {
          // "anterior"/"ms": quanto tempo a pessoa ficou no passo de antes
          ev('passo', { modulo: n, passo: i, alvo: item.target, detalhe: { titulo: item.title, anterior: at.passo, ms: agora - at.tPasso } });
          at.passo = i;
          at.tPasso = agora;
        }
        if (item.kind === 'summary') {
          setStatus(n, 'done');
          delete passos()[n];
          save();
          refreshDots(n);
          celebrar(doneCount() === A.mods.length ? 'grande' : 'normal');
          if (at && !at.concluido) {
            at.concluido = true;
            ev('modulo_fim', { modulo: n, detalhe: { ms: agora - at.inicio, ultimo_passo_ms: agora - at.tPasso, ultimo_passo: at.passo } });
            if (doneCount() === A.mods.length) {
              const k = 'bigou-treino-concluido-' + (An ? An.id() : '');
              let ja = false;
              try { ja = localStorage.getItem(k) === '1'; localStorage.setItem(k, '1'); } catch (e) { /* sem armazenamento */ }
              if (!ja) ev('treino_concluido');
            }
          }
        }
      },
      onSkip: (i, item) => ev('passo_pulado', { modulo: n, passo: i, alvo: item.target, detalhe: { titulo: item.title } }),
      onQuiz: (i, item, r) => {
        // Vale a 1ª tentativa de cada pergunta nesta passada pelo módulo (refazer o módulo pode melhorar a nota)
        const at = A.ativo;
        if (at && !at.respondidas.has(i)) { at.respondidas.add(i); respostas()[`${n}:${i}`] = !!r.acertou; save(); }
        ev('quiz', { modulo: n, passo: i, alvo: item.target, detalhe: { pergunta: item.title, q: item.q, acertou: r.acertou, tentativa: r.tentativa, opcao: r.opcao } });
      },
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
          <ul class="t-review-list">
            ${items.map(([t, s], i) => `<li style="animation-delay:${i * 70}ms"><span class="t-rv-ic">${ICON.check}</span><span><b>${t}</b><small>${s}</small></span></li>`).join('')}
          </ul>
          <p class="t-review-msg">Agora você já consegue entender de onde vêm os valores apresentados.</p>
          <div class="t-cta center">
            ${doneCount() === A.mods.length ? `<a class="t-btn primary lg" href="#/certificado">${ICON.certificado}${certStatus().ok ? 'Ver meu certificado' : 'Ver o que falta para o certificado'}</a>` : ''}
            <a class="t-btn ${doneCount() === A.mods.length ? 'ghost' : 'primary'} lg" href="#/modulos">Voltar aos módulos</a>
            <a class="t-btn ghost lg" href="#/explorar">${ICON.cursor}Explorar a tela</a>
          </div>
        </main>
      </div>`;
  }

  /* ------------------------------ Celebração ------------------------------ */
  // Confete curto nas cores da marca. Não roda para quem prefere menos movimento.
  function celebrar(tamanho) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.createElement('canvas');
    cv.className = 'confete';
    cv.width = innerWidth * devicePixelRatio;
    cv.height = innerHeight * devicePixelRatio;
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const cores = ['#0b8a47', '#16a36a', '#2a78d6', '#eda100', '#eb6834', '#7fd1a3'];
    const qtd = tamanho === 'grande' ? 160 : 70;
    const ps = Array.from({ length: qtd }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 160, y: innerHeight * 0.38,
      vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 4,
      r: 3 + Math.random() * 4, c: cores[Math.floor(Math.random() * cores.length)],
      a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3,
    }));
    const t0 = performance.now(), dur = tamanho === 'grande' ? 2200 : 1400;
    (function quadro(t) {
      const k = (t - t0) / dur;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach((p) => {
        p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
      });
      if (k < 1) requestAnimationFrame(quadro); else cv.remove();
    })(t0);
  }

  /* ------------------------------ Certificado ------------------------------ */
  function viewRequisitos(c) {
    const item = (ok, t, valor, sub) => `
      <li class="${ok ? 'ok' : ''}">
        <span class="cr-ic">${ok ? ICON.check : ICON.x}</span>
        <span class="cr-t"><b>${t}</b><small>${sub}</small></span>
        <b class="cr-v">${valor}</b>
      </li>`;
    const proximo = A.mods.find((m) => status(m.n) !== 'done');
    app.innerHTML = `
      <div class="tv tv-req">
        <header class="t-top">
          <a class="t-link" href="#/">${ICON.arrowL}Início</a>
          <div class="t-logo"><img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32"><span>Treinamento Financeiro</span></div>
          <span></span>
        </header>
        <main class="cr">
          <div class="cr-badge">${ICON.cadeado}</div>
          <h1>Seu certificado</h1>
          <p class="hm-sub">Para liberar, você precisa cumprir as duas condições:</p>
          <ul class="cr-list">
            ${item(c.conteudoOk, 'Ver todo o conteúdo', pct(c.conteudo), `${doneCount()} de ${A.mods.length} módulos concluídos`)}
            ${item(c.acertoOk, 'Acertar mais de 70% das perguntas', pct(c.taxa), `${c.acertos} de ${c.perguntas} certas na primeira tentativa`)}
          </ul>
          ${proximo
            ? `<a class="t-btn primary lg cr-cta" href="#/modulo/${proximo.n}">${ICON.play}Continuar · Módulo ${proximo.n}</a>`
            : `<p class="cr-dica">Refaça os módulos abaixo para melhorar seus acertos. Vale a primeira resposta de cada pergunta.</p>
               <ul class="cr-refazer">${c.refazer.map((n) => { const m = A.mods.find((x) => x.n === n); return `<li><a href="#/modulo/${n}/inicio"><span class="cr-n">${ICON[m.icone] || n}</span><span><small>Módulo ${n}</small><b>${m.titulo}</b></span>${ICON.redo}</a></li>`; }).join('')}</ul>`}
        </main>
      </div>`;
  }

  function viewCertificado() {
    const c = certStatus();
    if (!c.ok) { viewRequisitos(c); return; }
    const p = (An && An.participante()) || {};
    const k = 'bigou-treino-concluido-em';
    let quando = null;
    try { quando = localStorage.getItem(k); if (!quando) { quando = new Date().toISOString(); localStorage.setItem(k, quando); } } catch (e) { quando = new Date().toISOString(); }
    const data = new Date(quando).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    ev('certificado', { detalhe: { acertos: Math.round(c.taxa * 100) } });
    app.innerHTML = `
      <div class="tv tv-cert">
        <header class="t-top no-print">
          <a class="t-link" href="#/">${ICON.arrowL}Início</a>
          <div class="t-logo"><img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32"><span>Treinamento Financeiro</span></div>
          <span></span>
        </header>
        <main class="cert-wrap">
          <article class="cert" aria-label="Certificado de conclusão">
            <div class="cert-borda">
              <img class="cert-logo" src="assets/bigou-logo.png" alt="Bigou" width="64" height="64">
              <span class="cert-kicker">Certificado de conclusão</span>
              <p class="cert-txt">Certificamos que</p>
              <h1 class="cert-loja">${esc(p.loja || 'Parceiro Bigou')}</h1>
              ${p.cidade ? `<p class="cert-cidade">${esc(p.cidade)}</p>` : ''}
              <p class="cert-txt">concluiu o <b>Treinamento Financeiro</b>, com os ${A.mods.length} módulos: vendas e formas de pagamento, tela Financeiro, fatura, repasse e antecipação.</p>
              <div class="cert-rodape">
                <div><small>Concluído em</small><b>${data}</b></div>
                <div class="cert-selo">${ICON.medalha}</div>
                <div><small>Módulos</small><b>${A.mods.length} de ${A.mods.length} concluídos</b></div>
              </div>
              <p class="cert-nota">Treinamento ilustrativo: os valores usados são fictícios. Confira no seu contrato os valores praticados na sua loja.</p>
            </div>
          </article>
          <div class="t-cta center no-print">
            <button type="button" class="t-btn primary lg" id="cert-print">${ICON.impressora}Baixar ou imprimir</button>
            <a class="t-btn ghost lg" href="#/revisao">${ICON.check}O que você aprendeu</a>
          </div>
          <p class="cert-dica no-print">Para baixar, escolha "Salvar como PDF" na janela de impressão.</p>
        </main>
      </div>`;
    document.getElementById('cert-print').addEventListener('click', () => window.print());
    celebrar('grande');
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
    if (['comecar', 'modulo', 'modulos', 'certificado'].includes(view) && An && !An.participante()) {
      A.destino = location.hash;
      location.replace('#/cadastro');
      return;
    }
    if (An) An.enviar();
    if (view === 'cadastro') viewCadastro();
    else if (view === 'modulos') viewModules();
    else if (view === 'modulo') {
      // "Recomeçar": esquece o passo salvo e abre o módulo do início
      if (parts[2] === 'inicio') { delete passos()[parts[1]]; save(); location.replace('#/modulo/' + parts[1]); return; }
      viewPlayer(parseInt(parts[1], 10) || 1);
    }
    else if (view === 'certificado') viewCertificado();
    else if (view === 'explorar') viewExplore();
    else if (view === 'dicas') viewDicas();
    else if (view === 'revisao') viewReview();
    else if (view === 'comecar') { location.replace('#/modulo/' + firstPending()); return; }
    else viewHome();
    if (view !== 'modulo') window.scrollTo(0, 0);
  }

  /* ------------------------------ Início ------------------------------ */
  A.saved = load();
  A.d = TREINO.calc(TREINO.dados);
  A.mods = TREINO.buildModules(A.d);
  TREINO.Tour.init();
  syncVoz();
  ev('acesso');
  // Dica aberta na tela inicial ("toggle" não borbulha: escuta na captura)
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (d.classList && d.classList.contains('h-dica') && d.open) ev('dica', { detalhe: { dica: d.querySelector('summary b').textContent } });
  }, true);
  window.addEventListener('hashchange', route);
  route();
})();
