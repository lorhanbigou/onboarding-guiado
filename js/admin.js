/* =========================================================================
   PAINEL ADMIN — analytics do treinamento
   - Login (senha do usuário admin do Supabase) e leitura das tabelas.
   Todos os números são calculados no navegador por calcular(dados, filtros).
   ========================================================================= */
(function () {
  const CFG = window.TREINO_ANALYTICS || {};
  const root = document.getElementById('adm');
  const tip = document.getElementById('adm-tip');
  const DIA = 864e5;
  const COR = { a: '#2a78d6', b: '#eb6834' };            // validados (dataviz): série 1 e 2
  const SEQ = ['#eef5f0', '#cfeedb', '#a5dcb9', '#72c592', '#43a96f', '#22894f', '#126b3a', '#0a4f2a'];   // mapa de calor (verde)
  const LINHA = { a: '#2563eb', b: '#12a150' };   // acessos (azul) e conclusões (verde)
  const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const configurado = !!(CFG.url && CFG.anonKey && CFG.adminEmail);
  // Verificação em duas etapas (TOTP) no login. Desligada por enquanto; para religar, troque para
  // true e aplique de novo a regra aal2 em private.eh_admin() (ver supabase/migrations).
  const EXIGIR_MFA = false;

  /* ------------------------------ Metadados do treinamento ------------------------------ */
  const MODS = TREINO.buildModules(TREINO.calc(TREINO.dados));
  const NMOD = MODS.length;
  const tituloMod = (m) => (MODS[m - 1] ? MODS[m - 1].titulo : 'Módulo ' + m);
  const passoDe = (m, p) => MODS[m - 1] && MODS[m - 1].steps[p - 1];
  const tituloPasso = (m, p) => { const s = passoDe(m, p); return s ? (s.desafio ? 'Desafio rápido' : s.title) : 'Passo ' + p; };
  const semValor = (t) => String(t || '').replace(/R\$[\d.,]+/g, 'R$…');
  const NPERG = MODS.reduce((t, m) => t + m.steps.filter((x) => x.mode === 'quiz').length, 0);
  const POUCOS = 5;              // abaixo disso, a % é mostrada como "poucos dados"
  const plural = (x, um, varios) => `${n(x)} ${x === 1 ? um : varios}`;

  /* Alternativas da versão 1 (até 10/2026). As respostas antigas não têm id: são ligadas à
     pergunta atual pela posição (módulo e passo). A alternativa vale pela posição: toda resposta
     conta na alternativa atual da mesma posição, inclusive depois de uma edição no painel.
     Estes textos só servem para achar a posição quando o evento não a trouxe. */
  const QUIZ_V1 = {
    d1: ['Só o que foi pago online', 'A soma de todas as vendas do mês', 'O valor que vai cair na sua conta'],
    d2: ['Só a comissão das vendas online', 'Nada: o valor vai inteiro para você', 'A comissão e as taxas de todas as vendas'],
    d3: ['Entra direto no seu caixa', 'Passa pela plataforma antes de chegar a você', 'Não conta como venda'],
    d4: ['Repasses recebidos', 'Repasse disponível', 'Recebido pela Loja'],
    d5: ['Você', 'O cliente, depois', 'A plataforma, que devolve o valor na fatura'],
    d6: ['Ele continua esperando até você abrir', 'Ele é cancelado e entra na conta da comissão', 'Ele é aceito automaticamente'],
    d7: ['Só se você pedir a antecipação', 'Em todas as faturas', 'Só nas vendas em dinheiro'],
    d8: ['Porque é uma multa', 'Porque o cliente pagou a taxa para você, e ela é da plataforma', 'Porque a comissão foi cobrada duas vezes'],
    d9: ['Todos os dias', 'Só quando você pedir', 'No 2º dia útil do mês seguinte às vendas'],
    f1: ['R$201,99', 'R$728,87', 'R$271,94'],
    f2: ['3 vendas', '7 vendas', '13 vendas'],
    f3: ['Só as vendas online', 'Todas as vendas, sem a taxa de serviço', 'Só as vendas em dinheiro'],
    f4: ['Porque o cliente desistiu do pedido', 'Porque foi paga em dinheiro', 'Porque o pedido não foi aceito nem recusado em 15 minutos'],
    f5: ['Todo mês, sempre', 'Quando a loja atinge o faturamento mínimo (R$500,00 em Total Bruto)', 'Só quando há vendas em dinheiro'],
    f6: ['Porque a plataforma ficou com quase tudo', 'Porque o valor das vendas em dinheiro e maquininha já estava com você, e as deduções saem do valor online', 'Porque houve um erro na conta'],
    f7: ['Sou obrigado a pagar o boleto na hora', 'A diferença vai para a próxima fatura como Débitos remanescentes, mas posso pagar o boleto também', 'A diferença é perdoada'],
    f8: ['Repasse disponível', 'Repasses recebidos', 'Recebido pela Loja'],
    f9: ['R$728,87', 'R$473,93', 'R$201,99'],
    f10: ['Na tela Relatório', 'Na fatura, em Ver comprovante', 'Em Boletos'],
  };
  // Dados de uma resposta: pergunta (id fixo), versão, enunciado e a alternativa escolhida
  // detalhe é JSON livre enviado por qualquer visitante: só os campos usados, com tipo garantido.
  function lerAvaliacao(e) {
    const d = e.detalhe, est = Number(d.estrelas);
    return {
      t: e.t,
      ajudou: d.ajudou === true,
      estrelas: Number.isInteger(est) && est >= 1 && est <= 5 ? est : 0,
      comentario: typeof d.comentario === 'string' && d.comentario ? d.comentario : null,
    };
  }

  // Respostas de qualquer versão viram a alternativa atual da mesma posição; o acerto segue a correta de hoje.
  function lerResposta(e) {
    const d = e.detalhe || {}, st = passoDe(e.modulo, e.passo);
    const id = d.id || (st && st.id) || `${e.modulo}:${e.passo}`;
    const ops = st && st.mode === 'quiz' ? st.options : [];
    let i = Number.isInteger(d.opcao) && d.opcao >= 0 && d.opcao < ops.length ? d.opcao : -1;
    if (i < 0 && typeof d.resposta === 'string' && ops.length) {
      const antigas = Object.prototype.hasOwnProperty.call(QUIZ_V1, id) ? QUIZ_V1[id] : [];
      const listas = [antigas, (st.original || st).options.map((o) => o.t), ops.map((o) => o.t)];
      for (const l of listas) { const k = l.indexOf(d.resposta); if (k >= 0 && k < ops.length) { i = k; break; } }
    }
    const op = i >= 0 ? ops[i] : null;
    return {
      id, st, opcao: i, tema: st ? st.tema : 'Outro',
      q: semValor(st && st.q ? st.q : typeof d.q === 'string' ? d.q : 'Pergunta'),
      resposta: op ? op.t : typeof d.resposta === 'string' ? d.resposta : null,
      acertou: op ? !!op.ok : !!d.acertou,
    };
  }
  const ASSUNTO_CONTATO = 'Contato feito';   // anotação que registra o contato com a loja
  const ACERTO_MIN = 0.7;        // certificado: mais de 70% de acerto (igual ao treinamento)
  const PARADA_DIAS = 7;         // começou e está sem atividade há 7 dias ou mais
  const SEM_INICIO_DIAS = 3;     // cadastrou há 3 dias ou mais e não abriu nenhum módulo

  /* ------------------------------ Ícones ------------------------------ */
  const sv = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    loja: sv('<path d="M4 9.5l1.5-5h13l1.5 5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8M10 20v-4.5h4V20"/>'),
    play: sv('<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>'),
    trofeu: sv('<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z"/>'),
    andamento: sv('<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/>'),
    parado: sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9v6M14.5 9v6"/>'),
    tempo: sv('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M10 2.5h4"/>'),
    olho: sv('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    raio: sv('<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>'),
    ok: sv('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>'),
    alerta: sv('<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.3v.2"/>'),
    critico: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v6M12 16.3v.2"/>'),
    sobe: sv('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    desce: sv('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    sair: sv('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
    atualizar: sv('<path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/>'),
    baixar: sv('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    casa: sv('<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>'),
    rota: sv('<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>'),
    lista: sv('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/>'),
    livro: sv('<path d="M12 6.5C10.5 5.3 8.5 5 4 5v13c4.5 0 6.5.3 8 1.5 1.5-1.2 3.5-1.5 8-1.5V5c-4.5 0-6.5.3-8 1.5zM12 6.5v13"/>'),
    pergunta: sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.7M12 17h.01"/>'),
    nota: sv('<path d="M5 4h10l4 4v12H5z"/><path d="M14.5 4v4.5H19M8.5 12.5h7M8.5 16h5"/>'),
    estrela: sv('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>'),
    cidade: sv('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    grafico: sv('<path d="M4 20h16"/><path d="M7 16v-4M11 16V8M15 16v-6M19 16V5"/>'),
    chat: sv('<path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/>'),
    menu: sv('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    calendario: sv('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    seta: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    chevron: sv('<path d="M9.5 6l6 6-6 6"/>'),
    abaixo: sv('<path d="M6 9.5l6 6 6-6"/>'),
    x: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    joinha: sv('<path d="M7.5 10.5V20H4.5v-9.5zM7.5 10.5l3.8-6.2a1.8 1.8 0 0 1 3.2 1.5L13.6 9.5h5a2 2 0 0 1 2 2.4l-1.3 6.5a2 2 0 0 1-2 1.6H7.5"/>'),
    naojoinha: sv('<path d="M16.5 13.5V4h3v9.5zM16.5 13.5l-3.8 6.2a1.8 1.8 0 0 1-3.2-1.5l.9-3.7h-5a2 2 0 0 1-2-2.4l1.3-6.5A2 2 0 0 1 6.7 4h9.8"/>'),
    medalha: sv('<circle cx="12" cy="9" r="5.5"/><path d="M12 6.5l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z"/><path d="M8.5 13.3L7 21l5-2.5 5 2.5-1.5-7.7"/>'),
    foguete: sv('<path d="M12.5 15.5l-4-4c1.5-4.5 5-8 11-8.5-.5 6-4 9.5-7 12.5z"/><path d="M8.5 11.5l-3.5-.5 2.5-3.5h4M12.5 15.5l.5 3.5 3.5-2.5v-4"/><circle cx="15" cy="9" r="1.5"/><path d="M6.5 15.5c-1.5.5-2.5 2.5-2.5 4.5 2 0 4-1 4.5-2.5"/>'),
    lampada: sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'),
    lupa: sv('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    pulso: sv('<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>'),
    clique: sv('<path d="M9 3.5v3M4.2 5.2l2.1 2.1M3 10h3M12 10l8 3.3-3.4 1.4 3.2 3.2-1.9 1.9-3.2-3.2-1.4 3.4z"/>'),
    aparelho: sv('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
    feedback: sv('<path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/><path d="M12 7.6l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"/>'),
    lapis: sv('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    cartoes: sv('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
    lua: sv('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    sol: sv('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'),
    funil: sv('<path d="M4 5h16l-6 7.5V19l-4 1.5v-8z"/>'),
    alvo: sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>'),
  };
  // Alvo com flecha (ilustração do "O que fazer agora?"): disco inclinado com volume, flecha cravada no centro
  const ALVO3D = `<svg class="alvo3d" viewBox="0 0 240 280" role="presentation" focusable="false">
    <defs>
      <radialGradient id="a3-v" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#9be86f"/><stop offset=".45" stop-color="#43c447"/><stop offset="1" stop-color="#17892e"/></radialGradient>
      <radialGradient id="a3-b" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f3f8f3"/><stop offset="1" stop-color="#d9e8db"/></radialGradient>
      <linearGradient id="a3-borda" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#1f9a35"/><stop offset="1" stop-color="#0e6424"/></linearGradient>
      <linearGradient id="a3-haste" x1="0" x2="1"><stop offset="0" stop-color="#1c8a31"/><stop offset=".5" stop-color="#3fbf45"/><stop offset="1" stop-color="#2aa83a"/></linearGradient>
      <linearGradient id="a3-pena1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7fdc63"/><stop offset="1" stop-color="#2fae3e"/></linearGradient>
      <linearGradient id="a3-pena2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a9f3a"/><stop offset="1" stop-color="#167a2b"/></linearGradient>
      <filter id="a3-sombra" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="a3-luz" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <ellipse cx="128" cy="258" rx="74" ry="11" fill="#0b5a24" opacity=".22" filter="url(#a3-sombra)"/>
    <g transform="rotate(-14 112 168)">
      <ellipse cx="121" cy="172" rx="76" ry="86" fill="url(#a3-borda)"/>
      <ellipse cx="117" cy="170" rx="76" ry="86" fill="#14772a"/>
      <ellipse cx="112" cy="168" rx="76" ry="86" fill="url(#a3-v)"/>
      <ellipse cx="112" cy="168" rx="60" ry="68" fill="url(#a3-b)"/>
      <ellipse cx="112" cy="168" rx="44" ry="50" fill="url(#a3-v)"/>
      <ellipse cx="112" cy="168" rx="28" ry="32" fill="url(#a3-b)"/>
      <ellipse cx="112" cy="168" rx="13" ry="15" fill="url(#a3-v)"/>
      <path d="M58 118 A76 86 0 0 1 120 82" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".45" filter="url(#a3-luz)"/>
    </g>
    <ellipse cx="113" cy="169" rx="5" ry="4" fill="#0c4d1d" opacity=".55"/>
    <g transform="translate(113 168) rotate(-47)">
      <rect x="-2" y="-4.5" width="124" height="9" rx="4.5" fill="url(#a3-haste)"/>
      <rect x="4" y="-2" width="110" height="2.2" rx="1.1" fill="#c4f5ad" opacity=".6"/>
      <path d="M92 -4 Q110 -8 134 -30 Q138 -14 126 -4 Z" fill="url(#a3-pena1)"/>
      <path d="M92 4 Q110 8 134 30 Q138 14 126 4 Z" fill="url(#a3-pena2)"/>
      <path d="M100 -4 Q112 -6 128 -20" fill="none" stroke="#c4f5ad" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <rect x="118" y="-6" width="10" height="12" rx="4" fill="#146f28"/>
    </g>
    <g stroke="#8ee07a" stroke-width="7" stroke-linecap="round" opacity=".9">
      <path d="M112 62 L102 42"/><path d="M136 52 L136 28"/><path d="M160 58 L172 40"/>
    </g>
  </svg>`;
  // Estrela preenchida (avaliações) e as 5 estrelas de uma nota
  const EST = '<span class="est" aria-hidden="true">' + IC.estrela + '</span>';
  const EST_OFF = '<span class="est off" aria-hidden="true">' + IC.estrela + '</span>';
  function estrelas(k) {
    k = Math.max(0, Math.min(5, Math.round(k || 0)));
    return `<span class="estrelas" role="img" aria-label="${k} de 5 estrelas">${EST.repeat(k)}${EST_OFF.repeat(5 - k)}</span>`;
  }

  /* ------------------------------ Formatação ------------------------------ */
  const nf = new Intl.NumberFormat('pt-BR');
  const n = (x) => nf.format(Math.round(x || 0));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function dur(ms) {
    if (ms == null || !isFinite(ms)) return '—';
    const s = Math.round(ms / 1000);
    if (s < 60) return s + ' s';
    const m = Math.floor(s / 60), r = s % 60;
    if (m < 60) return r ? `${m} min ${r} s` : `${m} min`;
    return `${Math.floor(m / 60)} h ${m % 60} min`;
  }
  const dias = (ms) => (ms == null ? '—' : ms < DIA ? 'no mesmo dia' : `em ${(ms / DIA).toFixed(1).replace('.', ',')} dias`);
  const dataBR = (t) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const dataHoraBR = (t) => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  function relativo(t) {
    const d = Date.now() - t;
    if (d < 60e3) return 'agora';
    if (d < 3600e3) return `há ${Math.floor(d / 60e3)} min`;
    if (d < DIA) return `há ${Math.floor(d / 3600e3)} h`;
    const k = Math.floor(d / DIA);
    return k === 1 ? 'ontem' : k < 30 ? `há ${k} dias` : dataBR(t);
  }
  const mediana = (arr) => { if (!arr.length) return null; const a = arr.slice().sort((x, y) => x - y); const k = a.length >> 1; return a.length % 2 ? a[k] : (a[k - 1] + a[k]) / 2; };
  const diaKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

  const Bot = TREINO.Bot;

  /* =====================================================================
     SUPABASE
     ===================================================================== */
  const base = () => CFG.url.replace(/\/$/, '');
  const sessao = {
    get() { try { const s = JSON.parse(sessionStorage.getItem('bigou-admin')); return s && s.exp > Date.now() ? s : null; } catch (e) { return null; } },
    set(s) { try { sessionStorage.setItem('bigou-admin', JSON.stringify(s)); } catch (e) { /* */ } },
    sair() { try { sessionStorage.removeItem('bigou-admin'); } catch (e) { /* */ } },
  };

  async function auth(caminho, token, opcoes) {
    const r = await fetch(`${base()}/auth/v1/${caminho}`, Object.assign({}, opcoes, {
      headers: { apikey: CFG.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.msg || j.message || 'Erro ' + r.status), { status: r.status });
    return j;
  }

  // Login em duas etapas. 1) senha → sessão provisória (aal1), que fica só em memória:
  // o banco não libera dados para ela. Se o admin ainda não tem app autenticador, já cadastra um.
  async function login(senha) {
    const r = await fetch(`${base()}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: CFG.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: CFG.adminEmail, password: senha }),
    });
    if (!r.ok) throw new Error(r.status === 400 ? 'Senha incorreta.' : 'Não foi possível entrar (' + r.status + ').');
    const j = await r.json(), token = j.access_token;
    if (!EXIGIR_MFA) { sessao.set({ token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60e3 }); return null; }
    const totp = ((await auth('user', token)).factors || []).filter((f) => f.factor_type === 'totp');
    const ativo = totp.find((f) => f.status === 'verified');
    if (ativo) return { token, fator: ativo.id, novo: null };
    // Cadastro anterior abandonado no meio: descarta e gera um QR code novo
    for (const f of totp) await auth(`factors/${f.id}`, token, { method: 'DELETE' });
    const novo = await auth('factors', token, { method: 'POST', body: JSON.stringify({ factor_type: 'totp', friendly_name: 'Painel do Treinamento', issuer: 'Bigou Treinamento' }) });
    return { token, fator: novo.id, novo: novo.totp };
  }

  // 2) código de 6 dígitos do app autenticador → sessão verificada (aal2), a única que lê os dados
  async function verificarCodigo(etapa, codigo) {
    try {
      const ch = await auth(`factors/${etapa.fator}/challenge`, etapa.token, { method: 'POST', body: '{}' });
      const j = await auth(`factors/${etapa.fator}/verify`, etapa.token, { method: 'POST', body: JSON.stringify({ challenge_id: ch.id, code: codigo }) });
      sessao.set({ token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60e3 });
    } catch (err) {
      throw new Error(err.status === 401 ? 'Sessão expirada. Entre de novo.' : 'Código incorreto ou expirado. Confira o app e tente de novo.');
    }
  }

  async function lerTudo(tabela, select, ordem) {
    const s = sessao.get();
    if (!s) throw Object.assign(new Error('Sessão expirada.'), { auth: true });
    const out = [], passo = 1000;
    for (let de = 0; ; de += passo) {
      const r = await fetch(`${base()}/rest/v1/${tabela}?select=${select}&order=${ordem}`, {
        headers: { apikey: CFG.anonKey, Authorization: `Bearer ${s.token}`, 'Range-Unit': 'items', Range: `${de}-${de + passo - 1}` },
      });
      if (r.status === 401) throw Object.assign(new Error('Sessão expirada.'), { auth: true });
      if (!r.ok && r.status !== 206) throw new Error('Erro ao ler ' + tabela + ' (' + r.status + ').');
      const lote = await r.json();
      out.push(...lote);
      if (lote.length < passo) break;
    }
    return out;
  }

  async function carregar() {
    const [participantes, eventos, anotacoes, perguntas] = await Promise.all([
      lerTudo('treino_participantes', 'id,loja,cidade,dispositivo,navegador,criado_em', 'criado_em.asc'),
      lerTudo('treino_eventos', 'participante_id,tipo,modulo,passo,alvo,detalhe,criado_em', 'id.asc'),
      // Tabela criada pelo supabase/anotacoes.sql. Se ainda não existir, o painel avisa na ficha da loja.
      lerTudo('treino_anotacoes', 'id,participante_id,assunto,texto,autor,criado_em,atualizado_em', 'criado_em.asc').catch((err) => { if (err.auth) throw err; Notas.semTabela = true; return []; }),
      // Perguntas editadas (migração 20261021120000_perguntas_editaveis.sql). Sem a tabela, vale o texto do código.
      lerTudo('treino_perguntas', 'id,q,opcoes,correta,ok,no,autor,atualizado_em', 'id.asc').catch((err) => { if (err.auth) throw err; Perg.semTabela = true; return []; }),
    ]);
    TREINO.aplicarPerguntas(MODS, perguntas);
    return { participantes, eventos, anotacoes, perguntas };
  }

  /* ------------------------------ Perguntas editadas ------------------------------ */
  // Tabela treino_perguntas: o treinamento lê, só o admin grava. Uma linha por pergunta editada.
  const Perg = {
    semTabela: false,
    async req(metodo, filtro, corpo, prefer) {
      const s = sessao.get();
      if (!s) throw Object.assign(new Error('Sessão expirada. Entre de novo.'), { auth: true });
      const r = await fetch(`${base()}/rest/v1/treino_perguntas${filtro || ''}`, {
        method: metodo,
        headers: { apikey: CFG.anonKey, Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json', Prefer: prefer || 'return=representation' },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      if (r.status === 401) throw Object.assign(new Error('Sessão expirada. Entre de novo.'), { auth: true });
      if (r.status === 404) { this.semTabela = true; throw new Error('A tabela de perguntas ainda não existe. Aplique a migração 20261021120000_perguntas_editaveis.sql no Supabase.'); }
      if (!r.ok) throw new Error('Não foi possível salvar (' + r.status + ').');
      return metodo === 'DELETE' ? null : (await r.json())[0];
    },
    aplicar() { TREINO.aplicarPerguntas(MODS, st.dados.perguntas); },
    async salvar(dados) {
      const linha = await this.req('POST', '?on_conflict=id', Object.assign({}, dados, { atualizado_em: new Date().toISOString() }), 'resolution=merge-duplicates,return=representation');
      st.dados.perguntas = st.dados.perguntas.filter((p) => p.id !== dados.id).concat(linha || []);
      this.aplicar();
    },
    async restaurar(id) {
      await this.req('DELETE', `?id=eq.${encodeURIComponent(id)}`);
      st.dados.perguntas = st.dados.perguntas.filter((p) => p.id !== id);
      this.aplicar();
    },
  };
  const perguntaPorId = (id) => { for (const m of MODS) { const s = m.steps.find((x) => x.mode === 'quiz' && x.id === id); if (s) return s; } return null; };

  /* ------------------------------ Anotações da equipe ------------------------------ */
  // Tabela treino_anotacoes (só o admin lê e escreve).
  const Notas = {
    semTabela: false,
    async req(metodo, filtro, corpo) {
      const s = sessao.get();
      if (!s) throw Object.assign(new Error('Sessão expirada. Entre de novo.'), { auth: true });
      const r = await fetch(`${base()}/rest/v1/treino_anotacoes${filtro || ''}`, {
        method: metodo,
        headers: { apikey: CFG.anonKey, Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      if (r.status === 401) throw Object.assign(new Error('Sessão expirada. Entre de novo.'), { auth: true });
      if (r.status === 404) { this.semTabela = true; throw new Error('A tabela de anotações ainda não existe. Rode o SQL supabase/anotacoes.sql no Supabase.'); }
      if (!r.ok) throw new Error('Não foi possível salvar (' + r.status + ').');
      return metodo === 'DELETE' ? null : (await r.json())[0];
    },
    async criar(participante_id, assunto, texto, autor) {
      st.dados.anotacoes.push(await this.req('POST', '', { participante_id, assunto, texto, autor }));
    },
    async editar(id, assunto, texto, autor) {
      const a = st.dados.anotacoes.find((x) => x.id === id);
      const mudou = { assunto, texto, autor, atualizado_em: new Date().toISOString() };
      Object.assign(mudou, await this.req('PATCH', `?id=eq.${encodeURIComponent(id)}`, mudou));
      Object.assign(a, mudou);
    },
    async excluir(id) {
      await this.req('DELETE', `?id=eq.${encodeURIComponent(id)}`);
      st.dados.anotacoes = st.dados.anotacoes.filter((x) => x.id !== id);
    },
  };

  /* =====================================================================
     CÁLCULO DE TODOS OS INDICADORES
     f = { dias, cidade, ate }  → janela [ate − dias, ate] (ate = agora por padrão)
     ===================================================================== */
  function calcular(D, f) {
    const agora = f.ate || Date.now();
    const desde = f.dias ? agora - f.dias * DIA : -Infinity;
    const semCidade = !f.cidade;
    const todosIds = new Set(D.participantes.map((p) => p.id));
    const parts = D.participantes.filter((p) => { const t = +new Date(p.criado_em); return (semCidade || p.cidade === f.cidade) && t >= desde && t <= agora; });
    const ids = new Set(parts.map((p) => p.id));
    const cidadeDe = new Map(D.participantes.map((p) => [p.id, p.cidade]));
    const evs = D.eventos.map((e) => Object.assign({ t: +new Date(e.criado_em) }, e)).filter((e) => e.t <= agora);

    // Resumo por participante
    const S = new Map(parts.map((p) => [p.id, { p, ini: new Set(), fim: new Set(), msMod: {}, saidas: [], ultimo: +new Date(p.criado_em), primeiroIni: null, concluiuEm: null, voz: false, cert: false, certEm: null, idioma: null, notaQ: {}, primeiraQ: {}, refeitas: new Set(), aval: null, erros: [], notas: [] }]));
    for (const e of evs) {
      const s = S.get(e.participante_id);
      if (!s) continue;
      s.ultimo = Math.max(s.ultimo, e.t);
      if (e.tipo === 'modulo_inicio') { s.ini.add(e.modulo); if (s.primeiroIni == null || e.t < s.primeiroIni) s.primeiroIni = e.t; }
      else if (e.tipo === 'modulo_fim') { if (!s.fim.has(e.modulo)) s.msMod[e.modulo] = (e.detalhe && e.detalhe.ms) || 0; s.fim.add(e.modulo); if (s.fim.size === NMOD && !s.concluiuEm) s.concluiuEm = e.t; }
      else if (e.tipo === 'treino_concluido') { if (!s.concluiuEm) s.concluiuEm = e.t; }
      else if (e.tipo === 'modulo_saida') s.saidas.push(e);
      else if (e.tipo === 'voz' && e.detalhe && e.detalhe.ligada) s.voz = true;
      else if (e.tipo === 'certificado') { s.cert = true; if (!s.certEm) s.certEm = e.t; }
      else if ((e.tipo === 'cadastro' || e.tipo === 'sessao_retomada') && e.detalhe && typeof e.detalhe.idioma === 'string') { s.idioma = e.detalhe.idioma; if (e.tipo === 'cadastro' && Array.isArray(e.detalhe.uso)) s.uso = e.detalhe.uso; }
      else if (e.tipo === 'uso_app' && e.detalhe && Array.isArray(e.detalhe.uso)) s.uso = e.detalhe.uso;
      else if (e.tipo === 'avaliacao' && e.detalhe) s.aval = lerAvaliacao(e);
    }
    const L = [...S.values()];
    L.forEach((s) => {
      s.comecou = s.ini.size > 0;
      s.concluiu = s.fim.size >= NMOD || !!s.concluiuEm;
      s.status = s.concluiu ? 'concluiu' : s.comecou ? 'andamento' : 'nao';
      const pendentes = [...s.ini].filter((m) => !s.fim.has(m));
      const ultSaida = s.saidas.filter((x) => !s.fim.has(x.modulo)).sort((a, b) => b.t - a.t)[0];
      s.parou = s.status !== 'andamento' ? null : ultSaida ? { m: ultSaida.modulo, p: ultSaida.passo } : pendentes.length ? { m: Math.max(...pendentes), p: null } : { m: Math.min(NMOD, s.fim.size + 1), p: null, proximo: true };
    });

    const comecaram = L.filter((s) => s.comecou).length;
    const concluiram = L.filter((s) => s.concluiu).length;
    const tempoAtivo = L.filter((s) => s.concluiu).map((s) => Object.values(s.msMod).reduce((a, b) => a + b, 0)).filter((x) => x > 0);
    const tempoCal = L.filter((s) => s.concluiu && s.primeiroIni && s.concluiuEm).map((s) => s.concluiuEm - s.primeiroIni);

    // Acessos no período (inclui quem ainda não se cadastrou, se não houver filtro de cidade)
    const acessos = evs.filter((e) => e.tipo === 'acesso' && e.t >= desde && (ids.has(e.participante_id) || (semCidade && !todosIds.has(e.participante_id))));

    const evP = evs.filter((e) => ids.has(e.participante_id));
    const chave = (m, p) => m + ':' + p;

    /* ---------- Perguntas: nota por loja e entendimento por assunto ---------- */
    // Nota da loja: última 1ª tentativa de cada pergunta (igual à regra do certificado no treinamento)
    // Assuntos: primeira resposta de cada loja em cada pergunta (de qualquer versão, na alternativa atual)
    const primeira = new Map(), ultimaDaLoja = new Map();
    evP.filter((e) => e.tipo === 'quiz' && e.detalhe && e.detalhe.tentativa === 1).forEach((e) => {
      const s = S.get(e.participante_id), r = lerResposta(e);
      s.notaQ[chave(e.modulo, e.passo)] = r.acertou;
      const kk = `${e.participante_id}|${r.id}`;
      // Respondeu de novo (refez a pergunta ou o módulo): guarda a 1ª vez para saber se foi reincidente
      if (!primeira.has(kk)) { primeira.set(kk, { e, r }); s.primeiraQ[r.id] = r.acertou; } else s.refeitas.add(r.id);
      ultimaDaLoja.set(kk, { e, r });
    });
    // Erros de cada loja (a última 1ª tentativa errada em cada pergunta): são as dúvidas do parceiro
    ultimaDaLoja.forEach(({ e, r }) => { if (!r.acertou) S.get(e.participante_id).erros.push({ id: r.id, tema: r.tema, q: r.q, resposta: r.resposta, t: e.t }); });
    const porPergunta = new Map();
    primeira.forEach(({ e, r }) => {
      const o = porPergunta.get(r.id) || { id: r.id, m: e.modulo, p: e.passo, st: r.st, tema: r.tema, ok: 0, tot: 0, erradas: {}, escolhas: {} };
      o.tot++;
      if (r.opcao >= 0) o.escolhas[r.opcao] = (o.escolhas[r.opcao] || 0) + 1;
      if (r.acertou) o.ok++;
      else if (r.resposta) o.erradas[r.resposta] = (o.erradas[r.resposta] || 0) + 1;
      porPergunta.set(r.id, o);
    });
    // Tentativas até acertar
    const tentativas = new Map();
    evP.filter((e) => e.tipo === 'quiz' && e.detalhe && e.detalhe.acertou).forEach((e) => {
      const r = lerResposta(e);
      if (!tentativas.has(r.id)) tentativas.set(r.id, []);
      tentativas.get(r.id).push(e.detalhe.tentativa || 1);
    });
    const temas = new Map();
    porPergunta.forEach((o) => {
      const [et, en] = Object.entries(o.erradas).sort((x, y) => y[1] - x[1])[0] || [];
      Object.assign(o, {
        q: o.st ? semValor(o.st.q) : 'Pergunta',
        onde: o.st && o.st.desafio ? `Desafio do Módulo ${o.m}` : `Exercício final, ${o.st ? o.st.title : 'pergunta'}`,
        taxa: o.tot ? o.ok / o.tot : null, erroComum: et ? { t: semValor(et), n: en } : null,
      });
      const t = temas.get(o.tema) || { tema: o.tema, ok: 0, tot: 0, perguntas: [] };
      t.ok += o.ok; t.tot += o.tot; t.perguntas.push(o);
      temas.set(o.tema, t);
    });
    // Do pior para o melhor; assuntos com poucos dados vão para o fim
    const peso = (t) => (t.tot >= POUCOS ? t.taxa : 2 + (t.tot ? t.taxa : 1));
    const assuntos = [...temas.values()].map((t) => Object.assign(t, {
      taxa: t.tot ? t.ok / t.tot : null,
      perguntas: t.perguntas.sort((a, b) => (a.taxa == null ? 2 : a.taxa) - (b.taxa == null ? 2 : b.taxa)),
    })).sort((a, b) => peso(a) - peso(b));

    /* ---------- Anotações da equipe ---------- */
    (D.anotacoes || []).forEach((a) => { const s = S.get(a.participante_id); if (s) s.notas.push(a); });
    L.forEach((s) => s.notas.sort((a, b) => +new Date(b.criado_em) - +new Date(a.criado_em)));

    /* ---------- Situação de cada loja ---------- */
    L.forEach((s) => {
      const ks = Object.keys(s.notaQ);
      s.respondidas = ks.length;
      s.certas = ks.filter((k) => s.notaQ[k]).length;
      s.nota = s.certas / NPERG;                       // regra do certificado: sobre as 19 perguntas
      const erros = {};
      ks.filter((k) => !s.notaQ[k]).forEach((k) => { const [m, p] = k.split(':').map(Number); const st = passoDe(m, p); if (st) erros[st.tema] = (erros[st.tema] || 0) + 1; });
      s.erroTema = (Object.entries(erros).sort((a, b) => b[1] - a[1])[0] || [])[0] || null;
      // Certificada: abriu o certificado, ou concluiu com mais de 70% (o certificado já está liberado)
      s.certificada = s.cert || (s.concluiu && s.nota > ACERTO_MIN);
      // Reincidente: certificada só depois de refazer perguntas (na 1ª vez não passou de 70%)
      s.notaPrimeira = Object.values(s.primeiraQ).filter(Boolean).length / NPERG;
      s.reincidente = s.certificada && s.refeitas.size > 0 && s.notaPrimeira <= ACERTO_MIN;
      const parado = agora - s.ultimo, cadastro = agora - +new Date(s.p.criado_em);
      s.sit = s.certificada ? 'certificada'
        : s.concluiu ? 'semcert'
        : s.comecou ? (parado >= PARADA_DIAS * DIA ? 'parada' : 'andamento')
        : cadastro >= SEM_INICIO_DIAS * DIA ? 'naocomecou' : 'recente';
      // Contato feito: anotação "Contato feito" depois da última atividade. Se a loja voltar a mexer
      // no treinamento e ficar parada de novo, volta a precisar de contato.
      s.contatoFeito = s.notas.find((a) => a.assunto === ASSUNTO_CONTATO && +new Date(a.criado_em) >= s.ultimo) || null;
      const precisa = ['parada', 'naocomecou', 'semcert'].includes(s.sit);
      s.contato = precisa && !s.contatoFeito;
      s.contatada = precisa && !!s.contatoFeito;
      const k = (ms) => Math.floor(ms / DIA);
      const ondeParou = s.parou ? (s.parou.proximo ? `antes do Módulo ${s.parou.m}` : `no Módulo ${s.parou.m}${s.parou.p ? ` · ${tituloPasso(s.parou.m, s.parou.p)}` : ''}`) : '';
      s.motivo = {
        parada: `Parada há ${k(parado)} dias ${ondeParou}`,
        naocomecou: `Cadastrou há ${k(cadastro)} dias e não abriu nenhum módulo`,
        semcert: `Acertou ${Math.round(s.nota * 100)}%${s.erroTema ? `: errou mais em ${s.erroTema}` : ''}`,
        certificada: `Acertou ${Math.round(s.nota * 100)}%${s.reincidente ? ` · na 1ª vez, ${Math.round(s.notaPrimeira * 100)}% (refez ${plural(s.refeitas.size, 'pergunta', 'perguntas')})` : ''}`,
        andamento: `Em andamento, ${ondeParou.replace(/^no /, 'no ').replace(/^antes do /, 'indo para o ')}`,
        recente: 'Cadastrou há pouco',
      }[s.sit];
    });
    const conta = (sit) => L.filter((s) => s.sit === sit).length;
    const sit = { parada: conta('parada'), naocomecou: conta('naocomecou'), semcert: conta('semcert'), certificada: conta('certificada'), reincidente: L.filter((s) => s.reincidente).length, andamento: conta('andamento'), recente: conta('recente') };
    sit.contato = L.filter((s) => s.contato).length;
    sit.contatadas = L.filter((s) => s.contatada).length;

    /* ---------- Jornada: 5 marcos ---------- */
    const META = Math.ceil(NMOD / 2);
    const jornada = [
      { k: 'cadastro', nome: 'Cadastraram', v: L.length },
      { k: 'comecou', nome: 'Começaram', v: comecaram },
      { k: 'metade', nome: 'Chegaram à metade', sub: `concluíram o Módulo ${META}`, v: L.filter((s) => s.fim.has(META) || s.concluiu).length },
      { k: 'concluiu', nome: 'Concluíram', sub: `os ${NMOD} módulos`, v: concluiram },
      { k: 'certificou', nome: 'Certificadas', sub: 'conteúdo completo e mais de 70% de acerto', v: sit.certificada },
    ];

    /* ---------- Onde param: módulo em que a loja em andamento ficou ---------- */
    const passosAband = new Map();
    L.forEach((s) => {
      const porMod = new Map();
      s.saidas.forEach((x) => { if (!s.fim.has(x.modulo) && x.passo) { const o = porMod.get(x.modulo); if (!o || x.t > o.t) porMod.set(x.modulo, x); } });
      porMod.forEach((x) => { const k = chave(x.modulo, x.passo); passosAband.set(k, (passosAband.get(k) || 0) + 1); });
    });
    const tempos = new Map();
    const addT = (m, p, ms) => { if (!p || !ms || ms > 15 * 60e3) return; const k = chave(m, p); if (!tempos.has(k)) tempos.set(k, []); tempos.get(k).push(ms); };
    evP.forEach((e) => {
      if (e.tipo === 'passo' && e.detalhe && e.detalhe.anterior) addT(e.modulo, e.detalhe.anterior, e.detalhe.ms);
      if (e.tipo === 'modulo_fim' && e.detalhe && e.detalhe.ultimo_passo) addT(e.modulo, e.detalhe.ultimo_passo, e.detalhe.ultimo_passo_ms);
    });
    const viram = new Map(), pul = new Map();
    evP.forEach((e) => {
      const k = chave(e.modulo, e.passo);
      if (e.tipo === 'passo') { if (!viram.has(k)) viram.set(k, new Set()); viram.get(k).add(e.participante_id); }
      if (e.tipo === 'passo_pulado') pul.set(k, (pul.get(k) || 0) + 1);
    });
    const paradas = [];
    for (let m = 1; m <= NMOD; m++) {
      const ini = L.filter((s) => s.ini.has(m)).length;
      const pararam = L.filter((s) => (s.sit === 'parada' || s.sit === 'andamento') && s.parou && s.parou.m === m && !s.parou.proximo).length;
      if (!pararam) continue;
      const doMod = (mapa) => [...mapa.entries()].filter(([k]) => +k.split(':')[0] === m);
      const [pk, pc] = doMod(passosAband).sort((a, b) => b[1] - a[1])[0] || [];
      const lento = doMod(tempos).filter(([, a]) => a.length >= 3).map(([k, a]) => [k, mediana(a)]).sort((a, b) => b[1] - a[1])[0];
      const pulado = doMod(pul).map(([k, c]) => [k, c, viram.has(k) ? c / viram.get(k).size : 0]).filter((x) => x[2] >= 0.15).sort((a, b) => b[2] - a[2])[0];
      const passo = (k) => +k.split(':')[1];
      paradas.push({
        m, ini, pararam, taxa: ini ? pararam / ini : 0,
        passo: pk ? { p: passo(pk), c: pc } : null,
        lento: lento ? { p: passo(lento[0]), ms: lento[1] } : null,
        pulado: pulado ? { p: passo(pulado[0]), taxa: pulado[2] } : null,
      });
    }
    paradas.sort((a, b) => b.pararam - a.pararam || b.taxa - a.taxa);

    /* ---------- Dados completos: por módulo, por passo e por pergunta ---------- */
    const modulos = MODS.map((md) => {
      const m = md.n, ini = L.filter((s) => s.ini.has(m)).length, fim = L.filter((s) => s.fim.has(m)).length;
      const pararam = L.filter((s) => (s.sit === 'parada' || s.sit === 'andamento') && s.parou && s.parou.m === m && !s.parou.proximo).length;
      const ms = L.map((s) => s.msMod[m]).filter((x) => x > 0);
      const sai = [...passosAband.entries()].filter(([k]) => +k.split(':')[0] === m).sort((a, b) => b[1] - a[1])[0];
      return { m, titulo: md.titulo, ini, fim, taxa: ini ? fim / ini : null, pararam, tempo: mediana(ms), passoSai: sai ? { p: +sai[0].split(':')[1], c: sai[1] } : null };
    });
    const TIPO = { click: 'Clique', quiz: 'Pergunta' };
    const passos = [];
    MODS.forEach((md) => md.steps.forEach((stp, j) => {
      const k = chave(md.n, j + 1), tm = tempos.get(k);
      const vi = viram.has(k) ? viram.get(k).size : 0;
      passos.push({ m: md.n, p: j + 1, titulo: tituloPasso(md.n, j + 1), tipo: TIPO[stp.mode] || 'Leitura', viram: vi, sairam: passosAband.get(k) || 0, pulos: pul.get(k) || 0, tempo: tm && tm.length ? mediana(tm) : null, amostra: tm ? tm.length : 0 });
    }));
    // Todas as perguntas, mesmo as ainda sem resposta, com a distribuição por alternativa
    const perguntasTodas = [];
    MODS.forEach((md) => md.steps.forEach((stp, j) => {
      if (stp.mode !== 'quiz') return;
      const o = porPergunta.get(stp.id) || { ok: 0, tot: 0, escolhas: {} };
      const tt = tentativas.get(stp.id) || [];
      perguntasTodas.push({
        id: stp.id, m: md.n, p: j + 1, tema: stp.tema, desafio: !!stp.desafio, editada: stp.editada,
        onde: stp.desafio ? `Desafio do Módulo ${md.n}` : `Exercício final, ${stp.title}`,
        q: semValor(stp.q),
        opcoes: stp.options.map((op, i) => ({ t: semValor(op.t), ok: !!op.ok, n: o.escolhas[i] || 0 })),
        ok: o.ok, tot: o.tot, taxa: o.tot ? o.ok / o.tot : null,
        tentativas: tt.length ? tt.reduce((a, b) => a + b, 0) / tt.length : null,
      });
    }));

    /* ---------- Cidades ---------- */
    const cid = new Map();
    const C = (c) => { if (!cid.has(c)) cid.set(c, { cidade: c, lojas: 0, comecaram: 0, concluiram: 0, certificadas: 0, contato: 0, certas: 0, respondidas: 0 }); return cid.get(c); };
    L.forEach((s) => { const o = C(s.p.cidade); o.lojas++; if (s.comecou) o.comecaram++; if (s.concluiu) o.concluiram++; if (s.certificada) o.certificadas++; if (s.contato) o.contato++; o.certas += s.certas; o.respondidas += s.respondidas; });
    const cidades = [...cid.values()].sort((a, b) => b.lojas - a.lojas || b.contato - a.contato);
    const semCadastro = f.cidade ? [] : TREINO.cidades.filter((c) => !cid.has(c));

    /* ---------- Série diária ---------- */
    const ini0 = isFinite(desde) ? desde : Math.min(...evs.map((e) => e.t), agora);
    const nDias = Math.max(1, Math.ceil((agora - ini0) / DIA));
    const serie = [];
    const d0 = new Date(ini0); d0.setHours(0, 0, 0, 0);
    for (let i = 0; i <= nDias && i < 400; i++) { const d = new Date(d0.getTime() + i * DIA); serie.push({ t: d.getTime(), k: diaKey(d), acessos: 0, conclusoes: 0 }); }
    const idx = new Map(serie.map((x, i) => [x.k, i]));
    acessos.forEach((e) => { const i = idx.get(diaKey(e.t)); if (i != null) serie[i].acessos++; });
    L.forEach((s) => { if (s.concluiuEm && s.concluiuEm >= desde) { const i = idx.get(diaKey(s.concluiuEm)); if (i != null) serie[i].conclusoes++; } });

    /* ---------- Dúvidas do chat (pela data da pergunta) ---------- */
    const daCidade = (e) => semCidade || cidadeDe.get(e.participante_id) === f.cidade;
    const dEv = evs.filter((e) => /^duvida/.test(e.tipo) && e.t >= desde && daCidade(e));
    const dPerg = dEv.filter((e) => e.tipo === 'duvida'), dEsc = dEv.filter((e) => e.tipo === 'duvida_escolha'), dFb = dEv.filter((e) => e.tipo === 'duvida_feedback');
    const det = (e) => e.detalhe || {};
    dPerg.forEach((e) => { const i = idx.get(diaKey(e.t)); if (i != null) serie[i].duvidas = (serie[i].duvidas || 0) + 1; });
    const naoTema = {}, telasM = new Map();
    dFb.forEach((e) => { if (!det(e).util && det(e).tema) naoTema[det(e).tema] = (naoTema[det(e).tema] || 0) + 1; });
    dPerg.forEach((e) => { const t = det(e).tela; if (t) telasM.set(t, (telasM.get(t) || 0) + 1); });
    const temasD = new Map();
    dPerg.filter((e) => det(e).resultado === 'respondida').concat(dEsc).forEach((e) => { const t = det(e).tema; if (t) temasD.set(t, (temasD.get(t) || 0) + 1); });
    const semResp = new Map();
    dPerg.filter((e) => det(e).resultado === 'sem_resposta' || det(e).resultado === 'fora').forEach((e) => {
      const k = Bot ? Bot.norm(det(e).texto) : det(e).texto;
      const o = semResp.get(k) || { texto: det(e).texto, fora: det(e).resultado === 'fora', n: 0, ultimo: 0, lojas: new Set() };
      o.n++; o.ultimo = Math.max(o.ultimo, e.t); o.lojas.add(e.participante_id);
      semResp.set(k, o);
    });
    const ruins = new Map();
    dFb.forEach((e) => {
      const id = det(e).intencao; if (!id || id === 'fora') return;
      const o = ruins.get(id) || { id, nao: 0, tot: 0, exemplos: [] };
      o.tot++;
      if (!det(e).util) { o.nao++; if (det(e).texto && o.exemplos.length < 3 && !o.exemplos.includes(det(e).texto)) o.exemplos.push(det(e).texto); }
      ruins.set(id, o);
    });
    const duvidas = {
      perguntas: dPerg.length,
      escolhas: dEsc.length,
      lojas: new Set(dEv.map((e) => e.participante_id)).size,
      respondidas: dPerg.filter((e) => det(e).resultado === 'respondida').length,
      sugestao: dPerg.filter((e) => det(e).resultado === 'sugestao').length,
      sem: dPerg.filter((e) => det(e).resultado === 'sem_resposta').length,
      fora: dPerg.filter((e) => det(e).resultado === 'fora').length,
      avaliacoes: dFb.length,
      uteis: dFb.filter((e) => det(e).util).length,
      temas: [...temasD.entries()].map(([tema, n]) => ({ tema, n })).sort((a, b) => b.n - a.n),
      semResposta: [...semResp.values()].sort((a, b) => b.n - a.n || b.ultimo - a.ultimo),
      naoAjudou: [...ruins.values()].filter((o) => o.nao > 0).sort((a, b) => b.nao - a.nao || b.nao / b.tot - a.nao / a.tot),
      lista: dPerg.concat(dFb).sort((a, b) => b.t - a.t),
      naoTema, telas: [...telasM.entries()].sort((a, b) => b[1] - a[1]),
    };

    /* ---------- Avaliação do treinamento (Sim/Não + estrelas) ---------- */
    const avs = L.filter((s) => s.aval).map((s) => Object.assign({ loja: s.p.loja, cidade: s.p.cidade }, s.aval));
    const avaliacao = {
      n: avs.length,
      ajudou: avs.filter((a) => a.ajudou).length,
      media: avs.length ? avs.reduce((t, a) => t + (a.estrelas || 0), 0) / avs.length : null,
      dist: [1, 2, 3, 4, 5].map((e) => ({ e, n: avs.filter((a) => a.estrelas === e).length })).reverse(),
      comentarios: avs.filter((a) => a.comentario).sort((a, b) => b.t - a.t),
    };

    // Mapa de calor (dia da semana × hora) dos acessos e perfil de uso
    const calor = Array.from({ length: 7 }, () => Array(24).fill(0));
    acessos.forEach((e) => { const d = new Date(e.t); calor[d.getDay()][d.getHours()]++; });
    const contar = (arr) => { const m = new Map(); arr.forEach((x) => m.set(x, (m.get(x) || 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
    const perfil = {
      dispositivo: contar(parts.map((p) => p.dispositivo || 'desconhecido')),
      navegador: contar(parts.map((p) => p.navegador || 'Outro')),
      dicas: contar(evs.filter((e) => e.tipo === 'dica' && e.t >= desde && ids.has(e.participante_id)).map((e) => (e.detalhe && e.detalhe.dica) || '?')),
    };
    L.forEach((s) => { s.tempoTotal = Object.values(s.msMod).reduce((a, b) => a + b, 0); });

    // Uso: conversão, retorno, recursos usados e saídas
    const visitantes = semCidade ? new Set(acessos.filter((e) => !todosIds.has(e.participante_id)).map((e) => e.participante_id)).size : null;
    const diasAtivos = new Map();
    evP.forEach((e) => { if (!diasAtivos.has(e.participante_id)) diasAtivos.set(e.participante_id, new Set()); diasAtivos.get(e.participante_id).add(diaKey(e.t)); });
    const usouSet = (tipo, cond) => new Set(evP.filter((e) => e.tipo === tipo && (!cond || cond(e))).map((e) => e.participante_id));
    const C0 = L.filter((s) => s.comecou);
    const recursos = [
      ['Narração por voz', 'raio', usouSet('voz', (e) => e.detalhe && e.detalhe.ligada)],
      ['Ouvir a explicação da tela', 'olho', usouSet('explicacao')],
      ['Modo livre (explorar as telas)', 'rota', usouSet('explorar')],
      ['Dicas', 'lampada', usouSet('dica')],
      ['Revisão "O que você aprendeu"', 'livro', usouSet('revisao'), true],
      ['Refazer as perguntas que errou', 'atualizar', usouSet('refazer_inicio'), true],
    ].concat(TREINO.recurso('assistente') ? [['Assistente de dúvidas', 'chat', usouSet('bot_aberto')]] : []).map(([t, ic, set, apos]) => {
      const com = C0.filter((s) => set.has(s.p.id)), sem = C0.filter((s) => !set.has(s.p.id));
      return { t, ic, apos: !!apos, usaram: L.filter((s) => set.has(s.p.id)).length, com: com.length, comOk: com.filter((s) => s.concluiu).length, sem: sem.length, semOk: sem.filter((s) => s.concluiu).length };
    });
    const faixa = (arr, cortes) => cortes.map(([t, lim], i) => ({ t, n: arr.filter((v) => v >= (i ? cortes[i - 1][1] : -Infinity) && v < lim).length }));
    const MOT = { fechou: ['Fecharam a página', 'x'], navegou: ['Voltaram ao menu ou trocaram de tela', 'sair'] };
    const sEv = evP.filter((e) => e.tipo === 'modulo_saida' && e.t >= desde);
    const porMot = new Map();
    sEv.forEach((e) => { const k = MOT[(e.detalhe || {}).motivo] ? e.detalhe.motivo : 'outro'; if (!porMot.has(k)) porMot.set(k, []); porMot.get(k).push(e); });
    const saidas = [...porMot.entries()].map(([k, a]) => ({ t: MOT[k] ? MOT[k][0] : 'Outro motivo', ic: MOT[k] ? MOT[k][1] : 'alerta', n: a.length, ms: mediana(a.map((e) => (e.detalhe || {}).ms_no_passo).filter((x) => x > 0)) })).sort((a, b) => b.n - a.n);
    const grupo = (fn) => { const m = new Map(); L.forEach((s) => { const k = fn(s), o = m.get(k) || { k, n: 0, com: 0, ok: 0 }; o.n++; if (s.comecou) o.com++; if (s.concluiu) o.ok++; m.set(k, o); }); return [...m.values()].sort((a, b) => b.n - a.n); };
    const NOME_DISP = { celular: 'Celular', computador: 'Computador', tablet: 'Tablet' };

    const uso = {
      visitantes, recursos, saidas, saidasTot: sEv.length,
      tempoInicio: mediana(L.filter((s) => s.primeiroIni).map((s) => s.primeiroIni - +new Date(s.p.criado_em)).filter((x) => x >= 0)),
      voltaram: C0.filter((s) => (diasAtivos.get(s.p.id) || new Set()).size >= 2).length,
      retomaram: usouSet('sessao_retomada').size,
      faixaDias: faixa(tempoCal, [['Mesmo dia', DIA], ['1 a 2 dias', 3 * DIA], ['3 a 7 dias', 8 * DIA], ['8 dias ou +', Infinity]]),
      faixaTela: faixa(tempoAtivo, [['Até 15 min', 15 * 60e3], ['15 a 30 min', 30 * 60e3], ['30 a 60 min', 60 * 60e3], ['Mais de 1 h', Infinity]]),
      grupos: {
        dispositivo: grupo((s) => NOME_DISP[s.p.dispositivo] || s.p.dispositivo || 'Desconhecido'),
        navegador: grupo((s) => s.p.navegador || 'Outro'),
        idioma: grupo((s) => (s.idioma === 'es' ? 'Español' : 'Português')),
        usoApp: grupo((s) => { const t = usoTxt(s.uso); return t === 'Celular e computador' ? 'Os dois' : t; }).filter((g) => g.k !== 'Não informado'),
      },
      celular: parts.filter((p) => p.dispositivo === 'celular').length,
      voz: L.filter((s) => s.voz).length,
      tempoAtivo: mediana(tempoAtivo),
      tempoCal: mediana(tempoCal),
      acessos: acessos.length,
    };

    return {
      kpi: { cadastradas: L.length, comecaram, concluiram, certificadas: sit.certificada, taxa: comecaram ? concluiram / comecaram : null },
      sit, jornada, paradas, assuntos, cidades, semCadastro, serie, uso, duvidas, avaliacao, lojas: L,
      modulos, passos, perguntas: perguntasTodas, calor, perfil,
    };
  }

  /* =====================================================================
     PEDAÇOS VISUAIS
     ===================================================================== */
  const tipAttr = (html) => `data-tip="${esc(html)}" tabindex="0"`;
  const ajuda = (txt) => `<span class="ajuda" ${tipAttr(txt)} aria-label="${esc(txt)}">?</span>`;

  // Comparação com o período anterior. menor=true quando cair é bom.
  function delta(atual, anterior, menor) {
    if (anterior == null || atual == null || !isFinite(anterior)) return '';
    if (!anterior) return '';   // sem base no período anterior: não compara
    const v = (atual - anterior) / anterior;
    if (Math.abs(v) < 0.005) return '<span class="dl neutro">= período anterior</span>';
    const bom = menor ? v < 0 : v > 0;
    return `<span class="dl ${bom ? 'bom' : 'ruim'}">${v > 0 ? IC.sobe : IC.desce}${Math.abs(Math.round(v * 100))}%<small> vs. anterior</small></span>`;
  }

  // ir: '#pagina' (link) ou uma situação da lista de lojas (filtra a tabela)
  function kpi(icone, rotulo, valor, sub, dl, ajudaTxt, cls, ir) {
    const go = !ir ? '' : ir[0] === '#'
      ? `<a class="kpi-go" href="${ir}" aria-label="Ver ${esc(rotulo)}">${IC.seta}</a>`
      : `<button type="button" class="kpi-go" data-status="${ir}" aria-label="Filtrar: ${esc(rotulo)}">${IC.seta}</button>`;
    return `<div class="kpi ${cls || ''}">
      <span class="kpi-ic">${IC[icone]}</span>
      <div class="kpi-c">
        <div class="kpi-h"><span class="kpi-r">${rotulo}</span>${ajudaTxt ? ajuda(ajudaTxt) : ''}</div>
        <b class="kpi-v">${valor}</b>
        <div class="kpi-f">${sub ? `<small>${sub}</small>` : ''}${dl || ''}</div>
      </div>
      ${go}
      ${cls && cls.split(' ').includes('hl') ? `<span class="kpi-deco" aria-hidden="true">${IC[icone]}</span>` : ''}
    </div>`;
  }
  const kpiBar = (v, cls) => `<span class="kpi-bar ${cls || ''}"><i style="width:${Math.round(Math.max(0, Math.min(1, v || 0)) * 100)}%"></i></span>`;

  // Status sempre com ícone + rótulo (nunca só cor)
  function saude(taxa) {
    if (taxa == null) return { cls: 'neutro', ic: IC.andamento, rot: 'Sem dados ainda' };
    if (taxa >= 0.5) return { cls: 'bom', ic: IC.ok, rot: 'Saudável' };
    if (taxa >= 0.3) return { cls: 'atencao', ic: IC.alerta, rot: 'Atenção' };
    return { cls: 'critico', ic: IC.critico, rot: 'Crítico' };
  }

  function anel(taxa, rotulo) {
    const r = 46, c = 2 * Math.PI * r, v = taxa == null ? 0 : Math.max(0, Math.min(1, taxa));
    return `<svg class="anel" viewBox="0 0 120 120" role="img" aria-label="Taxa de conclusão ${Math.round(v * 100)}%">
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="#e6f2ea" stroke-width="11"/>
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="#14a04f" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/>
      <text x="60" y="62" text-anchor="middle" class="anel-v">${taxa == null ? '—' : Math.round(v * 100) + '%'}</text>
      <text x="60" y="80" text-anchor="middle" class="anel-r">${rotulo || 'de conclusão'}</text>
    </svg>`;
  }

  // Barras horizontais de uma série (ex.: cidades, acerto das perguntas)
  function barras(rows, { valor, rotulo, fmt, max, cor = COR.a, alerta, sub }) {
    const mx = max || Math.max(1, ...rows.map(valor));
    return `<div class="hb">${rows.map((r) => {
      const v = valor(r), w = Math.max(0.6, (v / mx) * 100), al = alerta && alerta(r);
      return `<div class="hb-row" ${tipAttr(`<b>${esc(rotulo(r))}</b><br>${fmt(r)}`)}>
        <div class="hb-l">${al ? `<span class="st-crit" title="Atenção">${IC.alerta}</span>` : ''}<span>${esc(rotulo(r))}${sub ? `<small>${esc(sub(r))}</small>` : ''}</span></div>
        <div class="hb-track"><i style="width:${w}%;background:${cor}"></i></div>
        <div class="hb-v">${fmt(r)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  // Jornada em 5 marcos: cartões em sequência, com a perda entre eles
  function jornadaVisual(R) {
    const J = R.jornada, base = Math.max(1, J[0].v);
    let pior = null;
    for (let i = 1; i < J.length; i++) { const a = J[i - 1].v; if (a >= POUCOS) { const q = (a - J[i].v) / a; if (q > 0 && (!pior || q > pior.q)) pior = { i, q }; } }
    const ult = J.length - 1;
    return `<ol class="jr">${J.map((e, i) => {
      const a = i ? J[i - 1].v : null, perda = i ? a - e.v : 0, g = pior && pior.i === i;
      // Ícone do canto: troféu no último marco, alerta na maior perda, check se perdeu pouco (até 10%), relógio no resto
      const st = i === ult ? ['trofeu', 'fim'] : g ? ['alerta', 'perda'] : !i || !a || perda / a <= 0.1 ? ['check', 'ok'] : ['tempo', 'meio'];
      return `${i ? `<li class="jr-seta ${g ? 'is-g' : ''}" aria-hidden="true"><span>${IC.seta}<small>${perda > 0 ? `−${n(perda)}` : '='}</small></span></li>` : ''}
        <li class="jr-c ${g ? 'is-g' : ''} ${i === ult && e.v ? 'is-fim' : ''}" ${tipAttr(`<b>${e.nome}</b>${e.sub ? `<br>${e.sub}` : ''}<br>${plural(e.v, 'loja', 'lojas')} · ${pct(e.v, base)} das cadastradas${perda > 0 ? `<br>Perda: ${plural(perda, 'loja', 'lojas')} (${pct(perda, a)})` : ''}`)}>
          <span class="jr-st ${st[1]}">${IC[st[0]]}</span>
          <b class="jr-v">${n(e.v)}</b>
          <span class="jr-n">${e.nome}</span>
          <span class="jr-bar"><i style="width:${Math.max(3, (e.v / base) * 100)}%"></i></span>
          <small>${pct(e.v, base)}</small>
          ${g ? '<em class="jr-g">maior perda</em>' : ''}
        </li>`;
    }).join('')}</ol>`;
  }

  // Módulos onde as lojas param, com o passo e o motivo provável
  function paradasVisual(R) {
    if (!R.paradas.length) return '<p class="empty">Nenhuma loja parada no meio de um módulo.</p>';
    return `<div class="pd-cards">${R.paradas.slice(0, 3).map((x, i) => `
      <div class="pd-c">
        <div class="pd-c-h"><span class="pd-c-n">${i + 1}</span><div><small>Módulo ${x.m}</small><b>${esc(tituloMod(x.m))}</b></div></div>
        <div class="pd-c-v"><b>${n(x.pararam)}</b> ${x.pararam === 1 ? 'loja parou' : 'lojas pararam'} aqui<small>${pct(x.pararam, x.ini)} de quem abriu o módulo</small></div>
        <ul class="pd-c-l">
          ${x.passo ? `<li><span>Saem mais em</span><b>${esc(tituloPasso(x.m, x.passo.p))}${x.lento && x.lento.p === x.passo.p ? ` · o passo mais demorado (${dur(x.lento.ms)})` : ''}</b></li>` : ''}
          ${x.lento && (!x.passo || x.lento.p !== x.passo.p) ? `<li><span>Passo mais demorado</span><b>${esc(tituloPasso(x.m, x.lento.p))} · ${dur(x.lento.ms)}</b></li>` : ''}
          ${x.pulado ? `<li><span>Pulam o clique em</span><b>${esc(tituloPasso(x.m, x.pulado.p))} · ${pct(x.pulado.taxa, 1)}</b></li>` : ''}
        </ul>
      </div>`).join('')}</div>`;
  }

  // Situação de uma % de acerto (com poucos dados, não alarma)
  const nivel = (taxa, tot) => (!tot ? 'vazio' : tot < POUCOS ? 'poucos' : taxa < 0.6 ? 'ruim' : taxa < 0.8 ? 'medio' : 'bom');
  const ROT_NIVEL = { vazio: 'sem respostas', poucos: 'poucos dados', ruim: 'reforçar', medio: 'atenção', bom: 'bem entendido' };

  // Assuntos do pior para o melhor; ao abrir, as perguntas e o erro mais comum
  // Mapa de calor: sequencial azul, do claro (pouco) ao escuro (muito)
  function graficoCalor(R) {
    const mx = Math.max(1, ...R.calor.flat());
    const cor = (v) => (v ? SEQ[Math.min(SEQ.length - 1, 1 + Math.floor((v / mx) * (SEQ.length - 2)))] : SEQ[0]);
    return `
      <div class="hm" role="table" aria-label="Acessos por dia da semana e hora">
        <div class="hm-row hm-head"><span></span>${Array.from({ length: 24 }, (_, h) => `<span>${h % 3 === 0 ? h + 'h' : ''}</span>`).join('')}</div>
        ${[1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="hm-row"><span class="hm-d">${SEMANA[d]}</span>${R.calor[d].map((v, h) => `<i style="background:${cor(v)}" ${tipAttr(`<b>${SEMANA[d]}, ${h}h–${h + 1}h</b><br>${plural(v, 'acesso', 'acessos')}`)}></i>`).join('')}</div>`).join('')}
        <div class="hm-scale"><small>Menos</small>${SEQ.slice(1).map((c) => `<i style="background:${c}"></i>`).join('')}<small>Mais</small></div>
      </div>`;
  }

  function perfilBloco(titulo, lista, total, absoluto) {
    if (!lista.length) return `<div class="pf-b"><h3>${titulo}</h3><p class="empty">Sem dados.</p></div>`;
    const mx = Math.max(...lista.map((x) => x[1]));
    return `<div class="pf-b"><h3>${titulo}</h3>${lista.slice(0, 8).map(([k, v]) => `<div class="pf-r"><span>${esc(k)}</span><span class="hb-track"><i style="width:${(v / mx) * 100}%;background:${COR.a}"></i></span><b>${absoluto ? n(v) : pct(v, total)}</b></div>`).join('')}</div>`;
  }

  // Linha diária: acessos e conclusões (mesma unidade, um eixo)
  function graficoLinha(R, largura) {
    const S = R.serie, W = Math.max(300, largura), H = 220, pl = 36, pr = 12, pt = 12, pb = 26;
    const mx = Math.max(1, ...S.map((x) => Math.max(x.acessos, x.conclusoes)));
    const top = Math.ceil(mx / 4) * 4 || 4;
    const X = (i) => pl + (S.length < 2 ? 0 : (i * (W - pl - pr)) / (S.length - 1));
    const Y = (v) => pt + (H - pt - pb) * (1 - v / top);
    const path = (k) => S.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(x[k]).toFixed(1)}`).join('');
    const area = `${path('acessos')}L${X(S.length - 1).toFixed(1)},${Y(0)}L${X(0).toFixed(1)},${Y(0)}Z`;
    const grid = [0, 0.25, 0.5, 0.75, 1].map((g) => `<line x1="${pl}" x2="${W - pr}" y1="${Y(top * g)}" y2="${Y(top * g)}" class="grid"/><text x="${pl - 6}" y="${Y(top * g) + 4}" class="ax" text-anchor="end">${n(top * g)}</text>`).join('');
    const passo = Math.max(1, Math.ceil(S.length / 7));
    const xl = S.map((x, i) => (i % passo === 0 || i === S.length - 1 ? `<text x="${X(i)}" y="${H - 6}" class="ax" text-anchor="${i === 0 ? 'start' : i === S.length - 1 ? 'end' : 'middle'}">${dataBR(x.t)}</text>` : '')).join('');
    return `
      <div class="legend"><span><i style="background:${LINHA.a}"></i>Acessos</span><span><i style="background:${LINHA.b}"></i>Treinamentos concluídos</span></div>
      <div class="lc" data-linha='${esc(JSON.stringify(S.map((x) => [x.t, x.acessos, x.conclusoes])))}' data-geo='${JSON.stringify({ W, H, pl, pr, pt, pb, top })}'>
        <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Acessos e conclusões por dia">
          <defs><linearGradient id="lc-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${LINHA.a}" stop-opacity=".16"/><stop offset="1" stop-color="${LINHA.a}" stop-opacity="0"/></linearGradient></defs>
          ${grid}${xl}
          <path d="${area}" fill="url(#lc-g)"/>
          <path d="${path('acessos')}" fill="none" stroke="${LINHA.a}" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="${path('conclusoes')}" fill="none" stroke="${LINHA.b}" stroke-width="2.5" stroke-linejoin="round"/>
          <line class="lc-x" x1="0" x2="0" y1="${pt}" y2="${H - pb}" visibility="hidden"/>
          <circle class="lc-a" r="4" fill="${LINHA.a}" stroke="#fff" stroke-width="2" visibility="hidden"/>
          <circle class="lc-b" r="4" fill="${LINHA.b}" stroke="#fff" stroke-width="2" visibility="hidden"/>
          <rect class="lc-hit" x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent"/>
        </svg>
      </div>`;
  }

  /* =====================================================================
     TELAS
     ===================================================================== */
  const st = {
    dados: null, filtros: { dias: 28, cidade: '' }, R: null, P: null, menu: false,
    busca: '', status: '', ordLoja: 'urgencia', pOrd: 'ordem', buscaCid: '', ordem: { k: 'ultimo', dir: -1 },
    pag: {}, fModulo: '', fTema: '', fBaixo: false, editPerg: null, fNotaTema: '', fNotaAutor: '', buscaNota: '', fAvalCom: false,
  };
  // Assistente de dúvidas desligado neste ambiente: a seção do chat some do painel
  const CHAT = TREINO.recurso('assistente');

  function telaLogin(msg) {
    root.innerHTML = `
      <main class="lg">
        <form class="lg-card" id="lg-form">
          <img src="../assets/bigou-logo.png" alt="Bigou" width="56" height="56">
          <h1>Painel de Treinamento Financeiro</h1>
          <p>Acesso restrito à equipe Bigou.</p>
          <label><span>Senha</span><input id="lg-senha" type="password" autocomplete="current-password" required></label>
          ${msg ? `<p class="lg-err" role="alert">${esc(msg)}</p>` : ''}
          <button class="btn primary" type="submit">Entrar</button>
        </form>
      </main>`;
    const fm = document.getElementById('lg-form');
    document.getElementById('lg-senha').focus();
    fm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const b = fm.querySelector('button');
      b.disabled = true; b.textContent = 'Entrando…';
      try { const etapa = await login(document.getElementById('lg-senha').value); if (etapa) telaCodigo(etapa); else iniciar(); }
      catch (err) { telaLogin(err.message); }
    });
  }

  function telaCodigo(etapa, msg) {
    const novo = etapa.novo;
    root.innerHTML = `
      <main class="lg">
        <form class="lg-card" id="lg-form">
          <img src="../assets/bigou-logo.png" alt="Bigou" width="56" height="56">
          <h1>${novo ? 'Ative a verificação em duas etapas' : 'Verificação em duas etapas'}</h1>
          <p>${novo ? 'Escaneie o QR code com um app autenticador (Google Authenticator, Microsoft Authenticator, 1Password…) e digite o código de 6 dígitos que aparecer.' : 'Digite o código de 6 dígitos do seu app autenticador.'}</p>
          ${novo ? `<img class="lg-qr" id="lg-qr" alt="QR code para o app autenticador" width="180" height="180">
          <details class="lg-chave"><summary>Não consegue escanear?</summary><p>Digite esta chave no app:</p><code id="lg-segredo">${esc(novo.secret)}</code></details>` : ''}
          <label><span>Código</span><input id="lg-cod" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>
          ${msg ? `<p class="lg-err" role="alert">${esc(msg)}</p>` : ''}
          <button class="btn primary" type="submit">Confirmar</button>
          <button class="lg-demo lg-link" type="button" id="lg-voltar">Voltar</button>
        </form>
      </main>`;
    // O Supabase devolve o QR como SVG puro (ou já como data:); vira imagem sem passar por innerHTML
    if (novo) document.getElementById('lg-qr').src = /^data:/.test(novo.qr_code) ? novo.qr_code : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(novo.qr_code);
    const fm = document.getElementById('lg-form');
    document.getElementById('lg-cod').focus();
    document.getElementById('lg-voltar').addEventListener('click', () => telaLogin());
    fm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const b = fm.querySelector('button[type=submit]');
      b.disabled = true; b.textContent = 'Confirmando…';
      try { await verificarCodigo(etapa, document.getElementById('lg-cod').value.trim()); iniciar(); }
      catch (err) { if (/expirada/.test(err.message)) telaLogin(err.message); else telaCodigo(etapa, err.message); }
    });
  }

  function telaSemConfig() {
    root.innerHTML = `
      <main class="lg">
        <div class="lg-card">
          <img src="../assets/bigou-logo.png" alt="Bigou" width="56" height="56">
          <h1>Painel de Treinamento Financeiro</h1>
          <p class="lg-err" role="alert">O painel não está configurado: faltam a URL e a chave do Supabase (veja "Ambientes" no README).</p>
        </div>
      </main>`;
  }

  function telaCarregando() {
    root.innerHTML = `
      <div class="hd"><div class="hd-l"><img src="../assets/bigou-logo.png" alt="" width="32" height="32"><div><b>Painel de Treinamento Financeiro</b><small>Carregando dados…</small></div></div></div>
      <main class="pg" aria-busy="true">
        <div class="kpis k4">${'<div class="sk sk-kpi"></div>'.repeat(4)}</div>
        <div class="sk sk-card"></div>
      </main>`;
  }

  async function iniciar() {
    if (!configurado) return telaSemConfig();
    if (!sessao.get()) return telaLogin();
    telaCarregando();
    try { st.dados = await carregar(); render(); }
    catch (err) { if (err.auth) { sessao.sair(); telaLogin(err.message); } else { root.innerHTML = `<main class="ld"><p class="lg-err">${esc(err.message)}</p><button class="btn" id="ld-retry">Tentar de novo</button></main>`; root.querySelector('#ld-retry').addEventListener('click', () => location.reload()); } }
  }

  const sec = (id, titulo, desc, corpo, extra) => `
    <section class="sec" id="s-${id}" aria-labelledby="h-${id}">
      <div class="sec-h"><div><h2 id="h-${id}">${titulo}</h2>${desc ? `<p>${desc}</p>` : ''}</div>${extra || ''}</div>
      ${corpo}
    </section>`;
  const card = (titulo, desc, corpo, cls, ic) => `<div class="card ${cls || ''}">${titulo ? `<div class="card-h"><h3>${ic && IC[ic] ? `<span class="card-ic">${IC[ic]}</span>` : ''}${titulo}</h3>${desc ? `<p>${desc}</p>` : ''}</div>` : ''}${corpo}</div>`;





  /* ------------------------------ Páginas da sidebar ------------------------------ */
  const PAGINAS = [
    { id: 'visao', t: 'Visão geral', ic: 'casa', d: (ctx) => `Lojas que se cadastraram ${ctx.periodoTxt}${ctx.f.cidade ? ` em ${esc(ctx.f.cidade)}` : ''}.` },
    { id: 'lojas', t: 'Lojas', ic: 'loja', d: () => 'Toque em uma loja para ver o que ela errou, a avaliação e as anotações da equipe.' },
    { id: 'jornada', t: 'Jornada', ic: 'rota', d: () => 'Até onde as lojas chegam, onde saem, quais assuntos precisam de reforço e como respondem cada pergunta.' },
  ].concat(CHAT ? [{ id: 'duvidas', t: 'Dúvidas do chat', ic: 'chat', d: (ctx) => `Perguntas feitas no assistente ${ctx.periodoTxt}.` }] : [], [
    { id: 'feedback', t: 'Feedback', ic: 'feedback', d: () => 'O que as lojas acharam do treinamento e o que a equipe registrou, num lugar só.' },
    { id: 'cidades', t: 'Cidades', ic: 'cidade', d: () => 'Desempenho e contatos pendentes por cidade.' },
    { id: 'uso', t: 'Uso', ic: 'grafico', d: (ctx) => `Como o treinamento é usado ${ctx.periodoTxt}: conversão, ritmo, recursos e aparelhos.` },
    { id: 'exportar', t: 'Exportar', ic: 'baixar', d: () => 'Baixe os dados completos em CSV. Eles são a base para o plano de melhorias.' },
  ]);
  const SB_SEP = ['feedback', 'exportar'];   // divisórias do menu: análises · registros · exportar
  // Páginas com abas: a aba vai no endereço (#jornada:passos). Endereços antigos levam à aba certa.
  const ABAS = { jornada: ['geral', 'passos', 'assuntos', 'perguntas'], feedback: ['tudo', 'aval', 'notas'], lojas: ['contato', 'andamento', 'certificadas', 'todas'] };
  const ANTIGAS = { perguntas: 'jornada:perguntas', passos: 'jornada:passos', assuntos: 'jornada:assuntos', anotacoes: 'feedback:notas', avaliacoes: 'feedback:aval' };
  function rota() {
    const h = location.hash.replace('#', '');
    const [pg, aba] = (ANTIGAS[h] || h).split(':');
    if (!PAGINAS.some((p) => p.id === pg)) return { pg: 'visao', aba: null };
    return { pg, aba: ABAS[pg] ? (ABAS[pg].includes(aba) ? aba : ABAS[pg][0]) : null };
  }
  const paginaAtual = () => rota().pg;

  /* ------------------------------ Paginação (25 por página) ------------------------------ */
  const POR_PAG = 25;
  function paginar(chave, rows) {
    const tot = rows.length, pgs = Math.max(1, Math.ceil(tot / POR_PAG));
    const p = Math.min(Math.max(1, st.pag[chave] || 1), pgs);
    st.pag[chave] = p;
    const ini = (p - 1) * POR_PAG;
    let ctrl = '';
    if (tot > POR_PAG) {
      const nums = [];
      for (let i = 1; i <= pgs; i++) if (i === 1 || i === pgs || Math.abs(i - p) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
      ctrl = `<nav class="pgn" aria-label="Paginação" data-pgn="${chave}">
        <span class="pgn-i">${n(ini + 1)}–${n(Math.min(tot, ini + POR_PAG))} de ${n(tot)}</span>
        <div class="pgn-b">
          <button class="pgn-btn" data-ir="${p - 1}" ${p === 1 ? 'disabled' : ''} aria-label="Página anterior">‹</button>
          ${nums.map((x) => (x === '…' ? '<span class="pgn-gap">…</span>' : `<button class="pgn-btn ${x === p ? 'on' : ''}" data-ir="${x}" ${x === p ? 'aria-current="page"' : ''}>${x}</button>`)).join('')}
          <button class="pgn-btn" data-ir="${p + 1}" ${p === pgs ? 'disabled' : ''} aria-label="Próxima página">›</button>
        </div>
      </nav>`;
    } else if (tot) ctrl = `<p class="pgn-i solo">${plural(tot, 'item', 'itens')}</p>`;
    return { itens: rows.slice(ini, ini + POR_PAG), ctrl };
  }
  const TABELAS = {};   // chave → função que redesenha só a tabela (mantém o foco na busca)
  const redesenhar = (chave) => { const el = document.getElementById('t-' + chave); if (el && TABELAS[chave]) el.innerHTML = TABELAS[chave](); };

  // Badges do sidebar: só o que é novo desde a última vez que a página foi aberta (ids vistos ficam no aparelho)
  const K_VISTO = 'bigou-admin-visto';
  // Menu lateral recolhido (só no computador); a escolha fica salva no navegador
  const K_SBMINI = 'bigou-admin-sb-mini';
  const temaEscuro = () => document.documentElement.getAttribute('data-tema') === 'escuro';
  let sbMini = (() => { try { return localStorage.getItem(K_SBMINI) === '1'; } catch (e) { return false; } })();
  function alternarSb() {
    sbMini = !sbMini;
    try { localStorage.setItem(K_SBMINI, sbMini ? '1' : '0'); } catch (e) { /* */ }
    const pn = document.querySelector('.painel');
    if (pn) pn.classList.toggle('sb-mini', sbMini);
    const b = document.querySelector('.sb-tg');
    if (b) { const t = sbMini ? 'Expandir menu' : 'Recolher menu'; b.setAttribute('aria-expanded', String(!sbMini)); b.setAttribute('aria-label', t); b.title = t; }
  }
  function novidades(pg, ids) {
    let visto = {};
    try { visto = JSON.parse(localStorage.getItem(K_VISTO)) || {}; } catch (e) { /* sem armazenamento */ }
    if (!visto.feedback && (visto.anotacoes || visto.avaliacoes)) visto.feedback = (visto.anotacoes || []).concat(visto.avaliacoes || []);
    if (ids[pg]) {
      visto[pg] = [...new Set((visto[pg] || []).concat(ids[pg]))];
      try { localStorage.setItem(K_VISTO, JSON.stringify(visto)); } catch (e) { /* */ }
    }
    const out = {};
    Object.keys(ids).forEach((k) => { const v = new Set(visto[k] || []); out[k] = ids[k].filter((id) => !v.has(id)).length; });
    return out;
  }

  function render() {
    const h = location.hash.replace('#', '');
    if (ANTIGAS[h]) { try { history.replaceState(null, '', location.href.split('#')[0] + '#' + ANTIGAS[h]); } catch (e) { /* segue com o endereço antigo: rota() já entende */ } }
    const f = st.filtros;
    const R = (st.R = calcular(st.dados, f));
    const P = (st.P = f.dias ? calcular(st.dados, Object.assign({}, f, { ate: Date.now() - f.dias * DIA })) : null);
    const pg = paginaAtual();
    const ctx = { R, P, f, periodoTxt: f.dias ? `nos últimos ${f.dias} dias` : 'desde o início' };
    const cont = novidades(pg, {
      lojas: R.lojas.filter((s) => s.contato).map((s) => `${s.p.id}|${s.sit}|${s.ultimo}`),   // volta a avisar se a loja precisar de contato de novo
      feedback: (st.dados.anotacoes || []).filter((a) => R.lojas.some((s) => s.p.id === a.participante_id)).map((a) => a.id).concat(R.lojas.filter((s) => s.aval).map((s) => s.p.id)),
    });
    const cidadesOpc = [...new Set(st.dados.participantes.map((p) => p.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const atual = PAGINAS.find((p) => p.id === pg);
    document.title = `${atual ? atual.t + ' · ' : ''}Painel de Treinamento Financeiro · Bigou`;

    root.innerHTML = `
      <div class="painel ${st.menu ? 'menu-on' : ''} ${sbMini ? 'sb-mini' : ''}">
        <aside class="sb" aria-label="Menu do painel">
          <div class="sb-logo"><img src="../assets/bigou-logo.png" alt="Bigou" width="40" height="40"><b>Painel de Treinamento Financeiro</b></div>
          <button type="button" class="sb-tg" data-a="sbmini" aria-expanded="${!sbMini}" aria-label="${sbMini ? 'Expandir menu' : 'Recolher menu'}" title="${sbMini ? 'Expandir menu' : 'Recolher menu'}">${IC.chevron}</button>
          <nav class="sb-nav">${PAGINAS.map((p) => `${SB_SEP.includes(p.id) ? '<hr class="sb-sep">' : ''}<a href="#${p.id}" class="${p.id === pg ? 'on' : ''}" ${p.id === pg ? 'aria-current="page"' : ''} data-sbtip="${p.t}${cont[p.id] ? ` · ${n(cont[p.id])}` : ''}">${IC[p.ic] || ''}<span>${p.t}</span>${cont[p.id] ? `<em class="${p.id === 'lojas' ? 'w' : ''}">${n(cont[p.id])}</em>` : ''}</a>`).join('')}</nav>
          <div class="sb-pe">
            <button class="sb-a sb-tema" data-a="tema" data-sbtip="${temaEscuro() ? 'Modo claro' : 'Modo escuro'}" aria-pressed="${temaEscuro()}">${temaEscuro() ? IC.sol : IC.lua}<span>${temaEscuro() ? 'Modo claro' : 'Modo escuro'}</span></button>
            <button class="sb-a" data-a="atualizar" data-sbtip="Atualizar dados">${IC.atualizar}<span>Atualizar dados</span></button>
            <button class="sb-a" data-a="sair" data-sbtip="Sair">${IC.sair}<span>Sair</span></button>
          </div>
          <svg class="sb-onda" viewBox="0 0 248 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70 C60 30 120 110 248 40 V120 H0z" fill="#16a34a" opacity=".55"/><path d="M0 95 C80 60 150 120 248 75 V120 H0z" fill="#4ade80" opacity=".5"/></svg>
        </aside>
        <div class="sb-scrim" data-a="menu"></div>
        <div class="painel-main">
          <header class="ph">
            <button class="sb-btn" data-a="menu" aria-label="Abrir menu">${IC.menu}</button>
            <div class="ph-t"><span class="ph-ic">${IC[atual.ic] || ''}</span><div><h1>${atual.t}</h1><p>${atual.d(ctx)}</p></div></div>
            <div class="flt" role="group" aria-label="Filtros">
              <label class="flt-c">${IC.calendario}<span class="flt-t"><span>Cadastradas</span><select data-f="dias">
                ${[[7, 'Últimos 7 dias'], [14, 'Últimos 14 dias'], [28, 'Últimos 28 dias'], [0, 'Todo o período']].map(([v, t]) => `<option value="${v}" ${+f.dias === v ? 'selected' : ''}>${t}</option>`).join('')}
              </select></span><span class="flt-v">${IC.abaixo}</span></label>
              <label class="flt-c">${IC.cidade}<span class="flt-t"><span>Cidade</span><select data-f="cidade"><option value="">Todas as cidades</option>${cidadesOpc.map((c) => `<option ${f.cidade === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></span><span class="flt-v">${IC.abaixo}</span></label>
            </div>
          </header>
          <main class="pg">${montarPagina(pg, ctx)}</main>
        </div>
      </div>`;
    if (document.getElementById('linha')) desenharLinha();
    avisarSeEscondido();
  }

  // Se uma página der erro, mostra o motivo em vez de ficar em branco
  function montarPagina(pg, ctx) {
    try { return PG[pg](ctx); }
    catch (err) {
      console.error('[painel] erro ao montar a página', pg, err);
      return `<div class="card erro-pg"><h3>Não foi possível montar esta página</h3><p>Tente <b>Atualizar dados</b>. Se continuar, envie esta mensagem para a equipe:</p><code>${esc(pg + ': ' + (err && err.message))}</code></div>`;
    }
  }

  // Extensões (bloqueadores de anúncio etc.) podem esconder partes da página
  function avisarSeEscondido() {
    const main = document.querySelector('.painel-main');
    if (!main || (getComputedStyle(main).display !== 'none' && main.offsetHeight > 0)) return;
    document.body.insertAdjacentHTML('beforeend', '<div class="aviso-ext" role="alert"><b>Uma extensão do navegador está escondendo o painel.</b> Desative o bloqueador de anúncios para este site e recarregue a página.</div>');
  }

  const PG = {};

  /* Visão geral */
  PG.visao = ({ R, P }) => {
    const K = R.kpi, KP = P && P.kpi, SI = R.sit;
    const dl = (k, menor) => (KP ? delta(K[k], KP[k], menor) : '');
    const sd = saude(K.taxa), deCada10 = K.taxa == null ? null : Math.round(K.taxa * 10);
    const pa = R.paradas[0], pior = R.assuntos.find((t) => t.tot >= POUCOS && t.taxa < 0.7);
    const pend = (sit) => R.lojas.filter((s) => s.contato && s.sit === sit).length;   // ainda sem contato feito
    // [ícone, cor, página, título, detalhe]
    const acoes = [
      SI.contato && ['parado', 'vm', 'lojas', `${plural(SI.contato, 'loja precisa', 'lojas precisam')} de contato`, `${[pend('parada') && `${n(pend('parada'))} paradas há ${PARADA_DIAS}+ dias`, pend('naocomecou') && `${n(pend('naocomecou'))} não começaram`, pend('semcert') && `${n(pend('semcert'))} concluíram sem certificado`].filter(Boolean).join(', ')}.`],
      pior && ['livro', 'vd', 'jornada:assuntos', `Reforçar no atendimento: ${esc(pior.tema)}`, `Só ${pct(pior.ok, pior.tot)} acertam de primeira.`],
      CHAT && R.duvidas.sem + R.duvidas.fora >= 5 && ['chat', 'am', 'duvidas', `${n(R.duvidas.sem + R.duvidas.fora)} dúvidas no chat sem resposta`, 'Veja o que o assistente não soube responder.'],
      pa && ['rota', 'az', 'jornada', `Mais lojas param no Módulo ${pa.m}`, `${esc(tituloMod(pa.m))}: ${plural(pa.pararam, 'loja', 'lojas')}.`],
    ].filter(Boolean);
    const ant = KP && KP.taxa != null && K.taxa != null && KP.comecaram >= POUCOS ? `<small>No período anterior: ${Math.round(KP.taxa * 10)} de 10.</small>` : '';
    return `
      <div class="kpis k4">
        ${kpi('loja', 'Cadastradas', n(K.cadastradas), 'Total de cadastros no período', dl('cadastradas'), 'Lojas que preencheram o nome e a cidade no período.', '', '#lojas')}
        ${kpi('play', 'Começaram', n(K.comecaram), `${pct(K.comecaram, K.cadastradas)} das cadastradas`, dl('comecaram'), 'Lojas que abriram pelo menos um módulo.', '', '#jornada')}
        ${kpi('ok', 'Concluíram', n(K.concluiram), `${pct(K.concluiram, K.comecaram)} de quem começou`, dl('concluiram'), `Lojas que concluíram os ${NMOD} módulos.`, '', '#jornada')}
        ${kpi('medalha', 'Certificadas', n(K.certificadas), `${pct(K.certificadas, K.concluiram)} de quem concluiu`, dl('certificadas'), 'Viram todo o conteúdo e acertaram mais de 70% das perguntas.', 'hl', '#lojas')}
      </div>
      <div class="cols vg">
        ${card('Saúde do treinamento', '', `<div class="sd">
          ${anel(K.taxa)}
          <ul class="sd-l">
            <li><span class="sd-ic vd">${IC.check}</span><span>${K.comecaram ? `<b>${n(K.concluiram)}</b> de ${plural(K.comecaram, 'loja que começou', 'lojas que começaram')} já concluíram` : 'Nenhuma loja começou ainda'}</span></li>
            <li><span class="sd-ic am">${EST}</span><span>${R.avaliacao.n ? `<b>${R.avaliacao.media.toFixed(1).replace('.', ',')}</b> de média <em class="pill">${pct(R.avaliacao.ajudou, R.avaliacao.n)} disseram que ajudou</em><small>${plural(R.avaliacao.n, 'avaliação', 'avaliações')}</small>` : 'Nenhuma avaliação ainda'}</span></li>
            <li><span class="sd-ic az">${IC.tempo}</span><span>Tempo mediano para concluir<b class="sd-big">${dur(R.uso.tempoAtivo)}</b><small>de tela, ${dias(R.uso.tempoCal)}</small></span></li>
          </ul>
          <div class="sd-b ${sd.cls}">
            <span class="sd-b-ic">${sd.cls === 'bom' ? IC.foguete : sd.ic}</span>
            <b>${sd.rot}</b>
            <p>${deCada10 == null ? 'Ainda não há lojas que começaram o treinamento.' : `De cada 10 lojas que começam, <b>${deCada10}</b> ${deCada10 === 1 ? 'termina' : 'terminam'}.`}</p>
            ${ant}
          </div>
        </div>`, '', 'pulso')}
        ${card('O que fazer agora?', '', (acoes.length ? `<ul class="ac">${acoes.map(([i, c, s, t, d]) => `<li><a href="#${s}" class="ac-i"><span class="ac-ic ${c}">${IC[i]}</span><span class="ac-t"><b>${t}</b><small>${d}</small></span><span class="ac-go">${IC.chevron}</span></a></li>`).join('')}</ul>` : `<p class="empty bom">${IC.ok}Nada urgente por aqui.</p>`) + `<div class="ac-deco" aria-hidden="true">${ALVO3D}</div>`, 'ac-card', 'lampada')}
      </div>
      <div class="cols">
        ${cardTempo(R.uso)}
        ${cardSaidas(R.uso)}
      </div>`;
  };

  /* Jornada: abas Visão geral · Passo a passo · Assuntos */
  const tabs = (base, itens, atual) => `<nav class="tabs" aria-label="Seções">${itens.map(([id, t, ic, c]) => `<a href="#${base}:${id}" class="${id === atual ? 'on' : ''}" ${id === atual ? 'aria-current="page"' : ''}>${IC[ic]}<span>${t}</span>${c != null ? `<em>${n(c)}</em>` : ''}</a>`).join('')}</nav>`;
  const JORNADA = {};
  PG.jornada = (ctx) => {
    const aba = rota().aba;
    return `${tabs('jornada', [['geral', 'Visão geral', 'rota'], ['passos', 'Passo a passo', 'lista'], ['assuntos', 'Assuntos', 'livro'], ['perguntas', 'Perguntas', 'pergunta']], aba)}${JORNADA[aba](ctx)}`;
  };

  // Os 10 módulos em linhas: conclusão, quem parou e onde mais saem
  function modulosVisual(R) {
    return `<ul class="md">${R.modulos.map((x) => {
      const v = x.taxa == null ? null : Math.round(x.taxa * 100);
      return `<li class="md-i">
        <span class="md-n">M${x.m}</span>
        <div class="md-t"><b>${esc(x.titulo)}</b><small>${n(x.ini)} iniciaram · ${n(x.fim)} concluíram</small></div>
        <div class="md-bar"><span class="md-tr"><i style="width:${v || 0}%"></i></span><b>${v == null ? '—' : v + '%'}</b></div>
        <div class="md-x">${x.pararam ? `<span class="badge bi bad">${IC.parado}${plural(x.pararam, 'parou aqui', 'pararam aqui')}</span>` : '<span class="badge bi ok">' + IC.ok + 'Ninguém parado</span>'}${x.passoSai ? `<small>Saem mais em: ${esc(tituloPasso(x.m, x.passoSai.p))}</small>` : ''}</div>
        <span class="tp">${IC.tempo}${dur(x.tempo)}</span>
        <a class="go" href="#jornada:passos" data-modulo="${x.m}" aria-label="Ver os passos do Módulo ${x.m}">${IC.seta}</a>
      </li>`;
    }).join('')}</ul>`;
  }

  JORNADA.geral = ({ R }) => `
    ${card('Até onde chegam', 'Passe o mouse ou toque em cada etapa para ver os detalhes.', jornadaVisual(R), '', 'grafico')}
    ${card('Onde param', 'Módulos em que lojas em andamento pararam e ainda não voltaram.', paradasVisual(R), '', 'alerta')}
    ${card('Por módulo', 'Os 10 módulos, na ordem do treinamento. Toque na seta para ver o passo a passo.', modulosVisual(R), '', 'livro')}`;

  // Passo a passo
  const TIPO_IC = { Pergunta: 'pergunta', Clique: 'clique', Leitura: 'livro' };
  TABELAS.passos = () => {
    const rows = st.R.passos.filter((x) => !st.fModulo || x.m === +st.fModulo);
    const mxSai = Math.max(1, ...rows.map((x) => x.sairam)), mxVi = Math.max(1, ...rows.map((x) => x.viram));
    const { itens, ctrl } = paginar('passos', rows);
    return itens.length ? `<div class="tb-wrap"><table class="tb tb-passos"><thead><tr><th>Passo</th><th>Tipo</th><th>Viram</th><th>Saíram aqui</th><th class="num">Pularam</th><th class="num">Tempo mediano</th></tr></thead>
      <tbody>${itens.map((x) => `<tr class="${x.sairam && x.sairam === mxSai ? 'is-top' : ''}">
        <td><span class="ps-n">M${x.m}·${x.p}</span> ${esc(x.titulo)}</td>
        <td><span class="ps-tipo">${IC[TIPO_IC[x.tipo]] || ''}${x.tipo}</span></td>
        <td><span class="ps-vi"><span class="md-tr"><i style="width:${(x.viram / mxVi) * 100}%"></i></span>${n(x.viram)}</span></td>
        <td>${x.sairam ? `<span class="badge bi bad">${IC.sair}${n(x.sairam)} · ${pct(x.sairam, x.viram)}</span>` : '<span class="mut">0</span>'}</td>
        <td class="num">${x.pulos ? `<span class="badge warn">${n(x.pulos)}</span>` : '<span class="mut">0</span>'}</td>
        <td class="num">${x.amostra >= 3 ? `<span class="tp">${dur(x.tempo)}${IC.tempo}</span>` : '<span class="mut">poucos dados</span>'}</td></tr>`).join('')}</tbody></table></div>${ctrl}` : '<p class="empty">Nenhum passo com esse filtro.</p>';
  };
  // Retenção dentro de um módulo: quantas lojas viram cada passo
  function retencao(m) {
    const rows = st.R.passos.filter((x) => x.m === m);
    const mx = Math.max(1, ...rows.map((x) => x.viram));
    return `<div class="rt">${rows.map((x) => `<div class="rt-c ${x.sairam ? 'sai' : ''}" ${tipAttr(`<b>Passo ${x.p}: ${esc(x.titulo)}</b><br>${plural(x.viram, 'loja viu', 'lojas viram')}${x.sairam ? `<br>${plural(x.sairam, 'saiu', 'saíram')} aqui` : ''}`)}>
      <b>${n(x.viram)}</b><span class="rt-b"><i style="height:${Math.max(3, (x.viram / mx) * 100)}%"></i></span><small>${x.p}</small></div>`).join('')}</div>`;
  }
  JORNADA.passos = () => {
    const m = +st.fModulo || 0;
    return `
      <div class="chips" role="group" aria-label="Módulo"><button type="button" class="${m ? '' : 'on'}" data-fmod="">Todos</button>${MODS.map((x) => `<button type="button" class="${m === x.n ? 'on' : ''}" data-fmod="${x.n}" title="${esc(x.titulo)}">M${x.n}</button>`).join('')}</div>
      ${m ? card(`Retenção no Módulo ${m}`, `${esc(tituloMod(m))}. Quantas lojas viram cada passo; em vermelho, onde alguém saiu.`, retencao(m), '', 'grafico') : ''}
      ${card(m ? `Passos do Módulo ${m}` : 'Todos os passos', 'Quantas lojas viram cada passo, onde saem, o que pulam e quanto tempo levam. A linha destacada é onde mais saem.', `<div id="t-passos">${TABELAS.passos()}</div>`, '', 'lista')}`;
  };

  // Assuntos: acerto de primeira por tema
  JORNADA.assuntos = ({ R }) => {
    if (!R.assuntos.length) return card('', '', '<p class="empty">Ninguém respondeu as perguntas ainda.</p>');
    const ok = R.assuntos.reduce((t, x) => t + x.ok, 0), tot = R.assuntos.reduce((t, x) => t + x.tot, 0);
    const reforcar = R.assuntos.filter((t) => nivel(t.taxa, t.tot) === 'ruim').length;
    const pior = R.perguntas.filter((q) => q.tot >= POUCOS).sort((a, b) => a.taxa - b.taxa)[0];
    return `
      <div class="kpis k3">
        ${kpi('ok', 'Acerto de primeira', pct(ok, tot), `${plural(tot, 'resposta', 'respostas')} nas perguntas atuais`, '', 'Respostas certas na primeira tentativa, somando todos os assuntos.')}
        ${kpi('alerta', 'Assuntos para reforçar', n(reforcar), `de ${plural(R.assuntos.length, 'assunto', 'assuntos')}, com acerto abaixo de 60%`, '', `Só conta assunto com ${POUCOS} respostas ou mais.`, reforcar ? 'vm' : '')}
        ${kpi('pergunta', 'Pergunta mais errada', pior ? pct(pior.ok, pior.tot) : '—', pior ? esc(pior.q.length > 70 ? pior.q.slice(0, 68) + '…' : pior.q) : 'Ainda com poucas respostas', '', 'Pergunta com o menor acerto de primeira entre as que têm respostas suficientes.', pior ? 'am' : '', '#jornada:perguntas')}
      </div>
      <div class="asg">${R.assuntos.map((t) => {
        const nv = nivel(t.taxa, t.tot);
        return `<details class="as-c nv-${nv}">
          <summary>
            ${anel(t.tot ? t.taxa : null, 'de acerto')}
            <span class="as-ct"><b>${esc(t.tema)}</b><em class="nv nv-${nv}">${ROT_NIVEL[nv]}</em><small>${plural(t.perguntas.length, 'pergunta', 'perguntas')} · ${plural(t.tot, 'resposta', 'respostas')}</small></span>
            <span class="as-ch">${IC.abaixo}</span>
          </summary>
          <ul class="as-q">${t.perguntas.map((q) => `
            <li>
              <div><small>${esc(q.onde)}</small><b>${esc(q.q)}</b>
                ${q.erroComum ? `<span class="as-err">Erro mais comum: “${esc(q.erroComum.t)}” (${pct(q.erroComum.n, q.tot)})</span>` : ''}</div>
              <b class="as-qv">${q.tot ? pct(q.ok, q.tot) : '—'}<small>${plural(q.tot, 'resposta', 'respostas')}</small></b>
            </li>`).join('')}</ul>
        </details>`;
      }).join('')}</div>`;
  };


  /* Perguntas: distribuição completa por alternativa */
  /* Jornada › Perguntas: distribuição das respostas e edição */
  const LETRA = 'ABCDEF';
  JORNADA.perguntas = ({ R }) => {
    const temasQ = [...new Set(R.perguntas.map((q) => q.tema))];
    let lista = R.perguntas.filter((q) => (!st.fTema || q.tema === st.fTema) && (!st.fBaixo || (q.taxa != null && q.taxa < 0.6)));
    if (st.pOrd === 'acerto') lista = lista.slice().sort((a, b) => (a.taxa == null) - (b.taxa == null) || a.taxa - b.taxa);
    const baixo = R.perguntas.filter((q) => q.taxa != null && q.taxa < 0.6).length;
    const dist = (ops, tot) => {
      const errMax = Math.max(0, ...ops.filter((o) => !o.ok).map((o) => o.n));
      return `<ul class="pq-ops">${ops.map((o, i) => `<li class="${o.ok ? 'ok' : errMax && o.n === errMax ? 'err' : ''}">
        <span class="pq-l">${o.ok ? IC.check : LETRA[i]}</span>
        <span class="pq-t">${esc(o.t)}${o.ok ? '<small>correta</small>' : errMax && o.n === errMax ? '<small>erro mais comum</small>' : ''}</span>
        <span class="pq-bar"><i style="width:${tot ? (o.n / tot) * 100 : 0}%"></i></span>
        <b>${tot ? pct(o.n, tot) : '—'}<small>${n(o.n)}</small></b></li>`).join('')}</ul>`;
    };
    const nTema = (t) => R.perguntas.filter((q) => q.tema === t).length;
    const COR_T = ['#12a150', '#2f6fdb', '#d97706', '#9b51e0', '#e0457b', '#0ea5a4', '#64748b', '#c2410c', '#4f46e5', '#15803d', '#be123c'];
    const ativo = st.fTema || st.fBaixo || st.pOrd === 'acerto';
    const resumo = [st.fTema || 'Todos os assuntos', st.fBaixo ? 'Abaixo de 60%' : '', st.pOrd === 'acerto' ? 'Menor acerto' : 'Ordem do treinamento'].filter(Boolean).join(' · ');
    const op = (attr, val, on, rot, extra) => `<button type="button" role="menuitemradio" aria-checked="${on}" class="fm-op ${on ? 'on' : ''}" ${attr}="${esc(val)}">${extra || ''}<span>${rot}</span><i class="fm-ck">${IC.check}</i></button>`;
    return `
      <div class="pq-tb">
        <div class="pq-tt"><b>${plural(lista.length, 'pergunta', 'perguntas')}</b><small>${lista.length < R.perguntas.length ? `de ${n(R.perguntas.length)} no total` : 'no treinamento'}</small></div>
        <div class="fm">
          ${ativo ? '<button type="button" class="fm-limpar" data-plimpar="1">Limpar</button>' : ''}
          <button type="button" class="fm-btn ${ativo ? 'ativo' : ''}" data-pmenu="1" aria-haspopup="true" aria-expanded="false">${IC.funil}<span class="fm-bt"><b>Filtrar</b><small>${esc(resumo)}</small></span><i class="fm-chev" aria-hidden="true"></i></button>
          <div class="fm-menu" role="menu" aria-label="Filtrar perguntas">
            <div class="fm-sec"><h5>Assunto</h5><div class="fm-scroll">
              ${op('data-ptema', '', !st.fTema, 'Todos os assuntos', '<i class="fm-dot" style="background:#9ca3af"></i>').replace('</span><i class="fm-ck">', `</span><em>${n(R.perguntas.length)}</em><i class="fm-ck">`)}
              ${temasQ.map((t, i) => op('data-ptema', t, st.fTema === t, esc(t), `<i class="fm-dot" style="background:${COR_T[i % COR_T.length]}"></i>`).replace('</span><i class="fm-ck">', `</span><em>${n(nTema(t))}</em><i class="fm-ck">`)).join('')}
            </div></div>
            <div class="fm-sec"><h5>Mostrar</h5>
              ${op('data-pbaixo', '0', !st.fBaixo, 'Todas as perguntas')}
              ${op('data-pbaixo', '1', st.fBaixo, 'Só acerto abaixo de 60%', '').replace('</span><i class="fm-ck">', `</span><em class="am">${n(baixo)}</em><i class="fm-ck">`)}
            </div>
            <div class="fm-sec"><h5>Ordenar</h5>
              ${op('data-pord', 'ordem', st.pOrd !== 'acerto', 'Ordem do treinamento')}
              ${op('data-pord', 'acerto', st.pOrd === 'acerto', 'Menor acerto primeiro')}
            </div>
          </div>
        </div>
      </div>
      ${Perg.semTabela ? '<p class="fx-aviso">Para editar as perguntas, aplique no Supabase a migração <b>20261021120000_perguntas_editaveis.sql</b>.</p>' : ''}
      <div class="pq">${lista.map((q) => { const nv = nivel(q.taxa, q.tot); return st.editPerg === q.id ? formPergunta(q) : `
        <article class="card pq-c nv-${nv}">
          <header class="pq-h"><span class="pq-id">${q.id}</span><span class="pq-meta"><small>${esc(q.onde)}</small><span class="tag">${esc(q.tema)}</span></span><em class="nv nv-${nv}">${ROT_NIVEL[nv]}</em></header>
          <div class="pq-top"><h3>${esc(q.q)}</h3>${anel(q.tot ? q.taxa : null, 'de acerto')}</div>
          ${dist(q.opcoes, q.tot)}
          <footer class="pq-f">
            <span>${IC.ok}${plural(q.tot, 'resposta', 'respostas')} de primeira</span>
            ${q.tentativas ? `<span>${IC.atualizar}<b>${q.tentativas.toFixed(1).replace('.', ',')}</b> tentativas até acertar</span>` : ''}
          </footer>
          <div class="pq-ed"><small>${q.editada ? `${IC.lapis}Editada${q.editada.autor ? ` por ${esc(q.editada.autor)}` : ''}${q.editada.em ? ` em ${dataHoraBR(+new Date(q.editada.em))}` : ''}` : 'Texto original'}</small>${Perg.semTabela ? '' : `<button type="button" class="btn" data-pq="editar" data-id="${esc(q.id)}">${IC.lapis}<span>Editar</span></button>`}</div>
        </article>`; }).join('') || card('', '', '<p class="empty">Nenhuma pergunta com esse filtro.</p>')}</div>`;
  };

  // Edição de uma pergunta. As alternativas ficam na mesma posição: as respostas já dadas
  // passam a contar na alternativa nova daquela posição.
  function formPergunta(q) {
    const s = perguntaPorId(q.id);
    const campo = (nome, rot, valor, max, area) => `<label><span>${rot}</span>${area ? `<textarea name="${nome}" rows="2" maxlength="${max}">${esc(valor || '')}</textarea>` : `<input name="${nome}" maxlength="${max}" value="${esc(valor || '')}">`}</label>`;
    return `
      <form class="card pq-c fx-form pq-form" data-pq-form="${esc(q.id)}">
        <header class="pq-h"><span class="pq-id">${q.id}</span><small>${esc(q.onde)} · ${esc(q.tema)}</small></header>
        <label><span>Pergunta</span><textarea name="q" rows="2" maxlength="300" required>${esc(s.q)}</textarea></label>
        <fieldset class="pq-alts"><legend>Alternativas <small>marque a correta</small></legend>
          ${s.options.map((o, i) => `<div class="pq-alt"><input type="radio" name="correta" value="${i}" ${o.ok ? 'checked' : ''} aria-label="Alternativa ${i + 1} é a correta"><input name="op${i}" maxlength="200" value="${esc(o.t)}" required aria-label="Alternativa ${i + 1}"><small>${plural(q.opcoes[i].n, 'resposta', 'respostas')}</small></div>`).join('')}
        </fieldset>
        ${campo('ok', 'Mensagem quando acerta', s.ok, 400, true)}
        ${campo('no', 'Mensagem quando erra', s.no, 400, true)}
        <label><span>Seu nome</span><input name="autor" maxlength="60" value="${esc(autorSalvo())}" placeholder="Quem está editando" required></label>
        <p class="note">As respostas já dadas continuam contadas na alternativa da mesma posição, e o acerto passa a seguir a alternativa marcada como correta.</p>
        <div class="fx-btns">
          ${s.editada ? '<button type="button" class="lnk del" data-pq="restaurar" data-id="' + esc(q.id) + '">Restaurar texto original</button>' : ''}
          <button type="button" class="btn" data-pq="cancelar">Cancelar</button>
          <button type="submit" class="btn primary">Salvar pergunta</button>
        </div>
        <p class="fx-err" role="alert"></p>
      </form>`;
  }

  /* Dúvidas do chat */
  const TELAS = { inicio: 'Início', modulos: 'Lista de módulos', explorar: 'Modo livre', repasses: 'Datas de repasse', revisao: 'O que você aprendeu', certificado: 'Certificado', avaliacao: 'Avaliação', refazer: 'Refazer perguntas' };
  const RES = { respondida: ['Respondida', 'ok', 'ok'], sugestao: ['Você quis dizer', 'info', 'pergunta'], sem_resposta: ['Sem resposta', 'warn', 'alerta'], fora: ['Fora do treinamento', 'off', 'x'] };
  PG.duvidas = ({ R }) => {
    const DV = R.duvidas, P = DV.perguntas;
    const nomeDe = new Map(st.dados.participantes.map((p) => [p.id, p]));
    const segs = [['respondida', DV.respondidas, '#12a150'], ['sugestao', DV.sugestao, '#2563eb'], ['sem_resposta', DV.sem, '#f59e0b'], ['fora', DV.fora, '#9aa6a0']];
    const dias = R.serie.slice(-45), mxD = Math.max(1, ...dias.map((x) => x.duvidas || 0));
    const mxT = Math.max(1, ...DV.temas.map((x) => x.n));
    const fb = DV.lista.filter((e) => e.tipo === 'duvida_feedback');
    const thumb = (e) => { const f = fb.find((x) => x.participante_id === e.participante_id && x.t >= e.t && x.t - e.t < 15 * 60e3 && (x.detalhe || {}).intencao === (e.detalhe || {}).intencao); return f ? (f.detalhe.util ? `<span class="dvr-th ok" title="Ajudou">${IC.joinha}</span>` : `<span class="dvr-th bad" title="Não ajudou">${IC.naojoinha}</span>`) : ''; };
    const recentes = DV.lista.filter((e) => e.tipo === 'duvida').slice(0, 15);
    return `
      <div class="kpis k4">
        ${kpi('chat', 'Perguntas feitas', n(P), `de ${plural(DV.lojas, 'loja', 'lojas')} · ${n(DV.escolhas)} toques em sugestões`, '', 'Perguntas digitadas no chat. Os toques nas perguntas prontas aparecem à parte.')}
        ${kpi('ok', 'Respondidas de primeira', pct(DV.respondidas, P), `${n(DV.respondidas)} de ${n(P)}`, kpiBar(P && DV.respondidas / P), 'O assistente entendeu o assunto e respondeu direto.')}
        ${kpi('joinha', 'Ajudou', pct(DV.uteis, DV.avaliacoes), DV.avaliacoes ? `de ${plural(DV.avaliacoes, 'resposta avaliada', 'respostas avaliadas')}` : 'Nenhuma resposta avaliada', '', 'Respostas marcadas como úteis pelo parceiro.', 'hl')}
        ${kpi('alerta', 'Sem resposta', n(DV.sem + DV.fora), `${n(DV.fora)} fora do treinamento`, '', 'Perguntas que o assistente não soube responder. Veja a lista em "Para melhorar o assistente".', DV.sem + DV.fora ? 'am' : '')}
      </div>
      <div class="cols">
        ${card('Como o assistente respondeu', `${plural(P, 'pergunta', 'perguntas')} no período.`, P ? `
          <div class="stk" role="img" aria-label="Distribuição das respostas">${segs.filter((x) => x[1]).map(([k, v, c]) => `<i style="flex:${v};background:${c}" ${tipAttr(`<b>${RES[k][0]}</b><br>${plural(v, 'pergunta', 'perguntas')} · ${pct(v, P)}`)}></i>`).join('')}</div>
          <ul class="stk-l">${segs.map(([k, v, c]) => `<li><i style="background:${c}"></i><span>${RES[k][0]}</span><b>${pct(v, P)}</b><small>${n(v)}</small></li>`).join('')}</ul>` : '<p class="empty">Nenhuma pergunta no período.</p>', '', 'funil')}
        ${card('Perguntas por dia', dias.length < R.serie.length ? 'Últimos 45 dias do período.' : 'Quantas perguntas chegam a cada dia.', `<div class="dd">${dias.map((x) => `<div class="dd-c" ${tipAttr(`<b>${dataBR(x.t)}</b><br>${plural(x.duvidas || 0, 'pergunta', 'perguntas')}`)}><span class="dd-b"><i style="height:${x.duvidas ? Math.max(6, (x.duvidas / mxD) * 100) : 0}%"></i></span></div>`).join('')}</div><div class="dd-ax"><small>${dias.length ? dataBR(dias[0].t) : ''}</small><small>${dias.length ? dataBR(dias[dias.length - 1].t) : ''}</small></div>`, '', 'grafico')}
      </div>
      <div class="cols">
        ${card('Assuntos mais perguntados', 'O que as telas ainda não deixam claro.', DV.temas.length ? `<ul class="rk">${DV.temas.slice(0, 8).map((x, i) => `<li><span class="rk-n">${i + 1}</span><span class="rk-t"><b>${esc(x.tema)}</b><span class="md-tr"><i style="width:${(x.n / mxT) * 100}%"></i></span></span><b class="rk-v">${n(x.n)}<small>${pct(x.n, DV.temas.reduce((t, y) => t + y.n, 0))}</small></b>${DV.naoTema[x.tema] ? `<span class="badge bi bad" title="Respostas marcadas como não úteis">${IC.naojoinha}${n(DV.naoTema[x.tema])}</span>` : ''}</li>`).join('')}</ul>` : '<p class="empty">Nenhuma pergunta respondida no período.</p>', '', 'livro')}
        ${card('Onde perguntam', 'Telas do treinamento em que as dúvidas foram feitas.', DV.telas.length ? barras(DV.telas.map(([k, v]) => ({ k, v })), { valor: (x) => x.v, rotulo: (x) => TELAS[x.k] || x.k, fmt: (x) => n(x.v), cor: '#12a150' }) : `<p class="empty">${IC.tempo} Esse dado começou a ser registrado agora. As próximas perguntas vão aparecer aqui.</p>`, '', 'cidade')}
      </div>
      ${card('Para melhorar o assistente', 'Perguntas que ficaram sem resposta e respostas que não ajudaram. Use para criar respostas novas, ajustar telas ou criar novos treinamentos.', `
        <div class="dv-csv"><button class="btn ic" data-a="csv-duvidas">${IC.baixar}<span>Exportar dúvidas (CSV)</span></button></div>
        <div class="mel">
          <div><h4 class="sub">Sem resposta ou fora do treinamento</h4>${DV.semResposta.length ? `<ul class="mel-l">${DV.semResposta.slice(0, 10).map((x) => `<li><span class="mel-ic ${x.fora ? 'off' : ''}">${x.fora ? IC.x : IC.alerta}</span><div><b>“${esc(x.texto)}”</b><small>${plural(x.n, 'vez', 'vezes')} · ${plural(x.lojas.size, 'loja', 'lojas')} · ${relativo(x.ultimo)}</small></div>${x.fora ? '<em class="dv-fora">fora do treinamento</em>' : ''}</li>`).join('')}</ul>${DV.semResposta.length > 10 ? `<p class="note">E mais ${n(DV.semResposta.length - 10)}. Exporte o CSV para ver todas.</p>` : ''}` : `<p class="empty bom">${IC.ok}Todas as perguntas tiveram resposta.</p>`}</div>
          <div><h4 class="sub">Respostas que não ajudaram</h4>${DV.naoAjudou.length ? `<ul class="mel-l">${DV.naoAjudou.slice(0, 6).map((o) => { const x = Bot && Bot.porId(o.id); return `<li><span class="mel-ic bad">${IC.naojoinha}</span><div><b>${esc(x ? x.exemplo : `Resposta antiga do assistente (${String(o.id).replace(/_/g, ' ')})`)}</b><small>${x ? `${esc(x.tema)} · ` : ''}${n(o.nao)} de ${n(o.tot)} não ajudou</small>${o.exemplos.length ? `<span class="mel-ex">Perguntaram: ${o.exemplos.map((t) => `“${esc(t)}”`).join(' · ')}</span>` : ''}</div></li>`; }).join('')}</ul>` : `<p class="empty bom">${IC.ok}Nenhuma resposta marcada como não útil.</p>`}</div>
        </div>`, '', 'lampada')}
      ${card('Conversas recentes', 'As últimas perguntas feitas no chat. Toque no nome da loja para abrir a ficha.', recentes.length ? `<ul class="dvr">${recentes.map((e) => { const d = e.detalhe || {}, p = nomeDe.get(e.participante_id), r = RES[d.resultado] || RES.sem_resposta; return `<li>
          <span class="dvr-ic">${IC.chat}</span>
          <div class="dvr-c"><div class="dvr-h">${p && st.R.lojas.some((s) => s.p.id === p.id) ? `<button type="button" class="lnk loja" data-ficha="${esc(p.id)}">${esc(p.loja)}</button>` : `<b>${p ? esc(p.loja) : 'Visitante'}</b>`}<small>${relativo(e.t)}${d.tela ? ` · ${esc(TELAS[d.tela] || d.tela)}` : ''}</small></div>
            <p>“${esc(d.texto || '')}”</p>
            <div class="dvr-f"><span class="badge bi ${r[1]}">${IC[r[2]]}${r[0]}</span>${d.tema ? `<span class="tag">${esc(d.tema)}</span>` : ''}${thumb(e)}</div></div>
        </li>`; }).join('')}</ul>` : '<p class="empty">Nenhuma pergunta no período.</p>', '', 'chat')}`;
  };


  /* Feedback: avaliações das lojas + anotações da equipe, num feed só */
  TABELAS.feedback = () => {
    const aba = rota().aba, lojaDe = new Map(st.R.lojas.map((s) => [s.p.id, s]));
    const b = st.buscaNota.trim().toLowerCase();
    let lista = [];
    if (aba !== 'notas') st.R.lojas.filter((s) => s.aval && (aba !== 'aval' || !st.fAvalCom || s.aval.comentario)).forEach((s) => lista.push({ tipo: 'aval', t: s.aval.t, s, txt: s.aval.comentario || '' }));
    if (aba !== 'aval') (st.dados.anotacoes || []).filter((a) => lojaDe.has(a.participante_id) && (aba !== 'notas' || ((!st.fNotaTema || a.assunto === st.fNotaTema) && (!st.fNotaAutor || a.autor === st.fNotaAutor))))
      .forEach((a) => lista.push({ tipo: 'nota', t: +new Date(a.criado_em), s: lojaDe.get(a.participante_id), a, txt: a.texto || '' }));
    if (b) lista = lista.filter((x) => (x.txt + ' ' + x.s.p.loja + ' ' + x.s.p.cidade).toLowerCase().includes(b));
    lista.sort((x, y) => y.t - x.t);
    const { itens, ctrl } = paginar('feedback', lista);
    if (!itens.length) return `<p class="empty">${b || st.fNotaTema || st.fNotaAutor || st.fAvalCom ? 'Nada encontrado com esses filtros.' : aba === 'notas' ? 'Nenhuma anotação ainda. Abra uma loja em "Lojas" para anotar.' : aba === 'aval' ? 'Nenhuma avaliação ainda.' : 'Nenhuma avaliação ou anotação ainda.'}</p>`;
    return `<ul class="fb">${itens.map((x) => {
      const s = x.s, av = x.tipo === 'aval';
      return `<li class="fb-i ${x.tipo}">
        <span class="fb-ic">${av ? EST : IC.nota}</span>
        <div class="fb-c">
          <div class="fb-h"><button type="button" class="lnk loja" data-ficha="${esc(s.p.id)}">${esc(s.p.loja)}</button><small>${esc(s.p.cidade)}</small>
            ${av ? `${estrelas(s.aval.estrelas)}<span class="badge bi ${s.aval.ajudou ? 'ok' : 'bad'}">${s.aval.ajudou ? IC.joinha + 'Ajudou' : IC.naojoinha + 'Não ajudou'}</span>` : `<span class="tag">${esc(x.a.assunto || 'Outro')}</span>`}</div>
          ${x.txt ? `<p>${av ? '“' + esc(x.txt) + '”' : esc(x.txt)}</p>` : '<p class="mut">Sem comentário.</p>'}
          <div class="fb-f"><small>${av ? 'Avaliação da loja' : esc(x.a.autor || 'Equipe')} · ${dataHoraBR(x.t)}${!av && x.a.atualizado_em ? ' · editada' : ''}</small>
            ${av ? '' : `<span><button type="button" class="lnk" data-ficha="${esc(s.p.id)}" data-editar="${esc(x.a.id)}">Editar</button><button type="button" class="lnk del" data-excluir="${esc(x.a.id)}">Excluir</button></span>`}</div>
        </div>
      </li>`;
    }).join('')}</ul>${ctrl}`;
  };
  PG.feedback = ({ R }) => {
    const AV = R.avaliacao, aba = rota().aba;
    const ids = new Set(R.lojas.map((s) => s.p.id));
    const notas = (st.dados.anotacoes || []).filter((a) => ids.has(a.participante_id));
    const autores = [...new Set(notas.map((a) => a.autor).filter(Boolean))].sort();
    const ruins = R.lojas.filter((s) => s.aval && (!s.aval.ajudou || (s.aval.estrelas && s.aval.estrelas <= 3))).sort((a, b) => b.aval.t - a.aval.t);
    const semAval = R.lojas.filter((s) => s.concluiu && !s.aval).length;
    const mx = Math.max(1, ...AV.dist.map((d) => d.n));
    const filtros = aba === 'notas'
      ? `<label class="sel"><span>Assunto</span><select data-loc="fNotaTema"><option value="">Todos</option>${ASSUNTOS_NOTA.map((t) => `<option ${st.fNotaTema === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
         <label class="sel"><span>Autor</span><select data-loc="fNotaAutor"><option value="">Todos</option>${autores.map((t) => `<option ${st.fNotaAutor === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`
      : aba === 'aval' ? `<label class="chk"><input type="checkbox" data-loc="fAvalCom" ${st.fAvalCom ? 'checked' : ''}> Só com comentário</label>` : '';
    return `
      ${Notas.semTabela ? '<p class="fx-aviso">Para salvar anotações, aplique no Supabase as migrações de <b>supabase/migrations</b>.</p>' : ''}
      <div class="kpis k4">
        ${kpi('estrela', 'Nota média', AV.n ? AV.media.toFixed(1).replace('.', ',') : '—', AV.n ? estrelas(AV.media) : 'Nenhuma avaliação ainda', '', 'Média das estrelas dadas pelas lojas ao concluir, antes do certificado.', 'am')}
        ${kpi('joinha', 'Disseram que ajudou', AV.n ? pct(AV.ajudou, AV.n) : '—', AV.n ? `${n(AV.ajudou)} de ${plural(AV.n, 'loja', 'lojas')}` : '', '', 'Lojas que responderam "sim" para "o treinamento ajudou?".', 'hl')}
        ${kpi('chat', 'Avaliações', n(AV.n), `${n(AV.comentarios.length)} com comentário`, '', 'Avaliações feitas pelas lojas no período e na cidade escolhidos.', '', '#feedback:aval')}
        ${kpi('nota', 'Anotações da equipe', n(notas.length), autores.length ? `por ${plural(autores.length, 'pessoa', 'pessoas')}` : 'Nenhuma ainda', '', 'Registros da equipe sobre as lojas do período.', '', '#feedback:notas')}
      </div>
      <div class="cols">
        ${card('Notas das lojas', AV.n ? `${plural(AV.n, 'avaliação', 'avaliações')} no período.` : '', AV.n ? `<div class="avl-dist">${AV.dist.map((d) => `<div class="avl-r"><span class="avl-e">${d.e} ${EST}</span><span class="hb-track"><i style="width:${(d.n / mx) * 100}%;background:#f5b301"></i></span><b>${n(d.n)}</b></div>`).join('')}</div>` : '<p class="empty">Nenhuma avaliação ainda.</p>', '', 'estrela')}
        ${card('Pedem atenção', 'Avaliações com "não ajudou" ou com 3 estrelas ou menos. Vale um contato.', `${ruins.length ? `<ul class="pa">${ruins.slice(0, 5).map((s) => `<li><div class="pa-h"><b>${esc(s.p.loja)}</b><small>${esc(s.p.cidade)} · ${relativo(s.aval.t)}</small></div><div class="pa-m">${estrelas(s.aval.estrelas)}${s.aval.ajudou ? '' : `<span class="badge bi bad">${IC.naojoinha}Não ajudou</span>`}</div>${s.aval.comentario ? `<p>“${esc(s.aval.comentario)}”</p>` : ''}<button type="button" class="btn" data-ficha="${esc(s.p.id)}"><span>Abrir ficha</span>${IC.seta}</button></li>`).join('')}</ul>${ruins.length > 5 ? `<p class="note">E mais ${n(ruins.length - 5)} na aba Avaliações abaixo.</p>` : ''}` : `<p class="empty bom">${IC.ok}Nenhuma avaliação negativa no período.</p>`}
          ${semAval ? `<div class="pa-sem">${IC.tempo}<span><b>${plural(semAval, 'loja concluiu', 'lojas concluíram')}</b> e ainda não ${semAval === 1 ? 'avaliou' : 'avaliaram'} o treinamento.</span></div>` : ''}`, 'pa-card', 'alerta')}
      </div>
      ${card('Tudo o que chegou', 'Avaliações das lojas e anotações da equipe, das mais recentes para as mais antigas. Toque no nome da loja para abrir a ficha.', `
        ${tabs('feedback', [['tudo', 'Tudo', 'lista', AV.n + notas.length], ['aval', 'Avaliações', 'estrela', AV.n], ['notas', 'Anotações', 'nota', notas.length]], aba)}
        <div class="tb-top">${filtros}<input type="search" class="busca" id="nt-busca" placeholder="Buscar no texto ou na loja" value="${esc(st.buscaNota)}"></div>
        <div id="t-feedback">${TABELAS.feedback()}</div>`, 'fb-card', 'chat')}`;
  };

  /* Cidades */
  TABELAS.cidades = () => {
    const b = st.buscaCid.trim().toLowerCase();
    const rows = st.R.cidades.filter((c) => !b || c.cidade.toLowerCase().includes(b));
    const { itens, ctrl } = paginar('cidades', rows);
    return itens.length ? `<div class="tb-wrap"><table class="tb"><thead><tr><th>Cidade</th><th class="num">Lojas</th><th class="num">Começaram</th><th class="num">Concluíram</th><th class="num">Certificadas</th><th class="num">Acerto médio</th><th class="num">Precisam de contato</th></tr></thead>
      <tbody>${itens.map((c) => { const t = c.comecaram ? c.concluiram / c.comecaram : null; const sd = saude(c.comecaram >= 3 ? t : null);
        return `<tr><td>${esc(c.cidade)}</td><td class="num">${n(c.lojas)}</td><td class="num">${n(c.comecaram)}</td>
        <td class="num"><span class="saude mini ${sd.cls}" title="${t == null ? 'Sem dados' : sd.rot + ' · de quem começou'}">${t == null ? '—' : pct(c.concluiram, c.comecaram)}</span></td>
        <td class="num">${n(c.certificadas)}</td><td class="num">${c.respondidas ? pct(c.certas, c.respondidas) : '<span class="mut">—</span>'}</td>
        <td class="num">${c.contato ? `<b class="ct">${n(c.contato)}</b>` : '<span class="mut">0</span>'}</td></tr>`; }).join('')}</tbody></table></div>${ctrl}` : '<p class="empty">Nenhuma cidade encontrada.</p>';
  };
  PG.cidades = ({ R }) => card('', '', `<input type="search" class="busca" id="cid-busca" placeholder="Buscar cidade" value="${esc(st.buscaCid)}"><div id="t-cidades">${TABELAS.cidades()}</div>
    ${R.semCadastro.length ? `<details class="sem"><summary>${plural(R.semCadastro.length, 'cidade ainda sem', 'cidades ainda sem')} nenhuma loja cadastrada</summary><p>${R.semCadastro.map(esc).join(' · ')}</p></details>` : ''}`);

  /* Uso: conversão, ritmo, tempo, recursos, saídas, horários e aparelhos */
  function durLongo(ms) {
    if (ms == null || !isFinite(ms)) return '—';
    if (ms < 3600e3) return dur(ms);
    if (ms < DIA) return `${Math.round(ms / 3600e3)} h`;
    return `${(ms / DIA).toFixed(1).replace('.', ',')} dias`;
  }
  // Faixas em barras verticais curtas (distribuições)
  function faixas(lista, cor) {
    const tot = lista.reduce((t, x) => t + x.n, 0), mx = Math.max(1, ...lista.map((x) => x.n));
    if (!tot) return '<p class="empty">Ainda sem lojas que concluíram.</p>';
    return `<div class="fx-bars">${lista.map((x) => `<div class="fxb" ${tipAttr(`<b>${x.t}</b><br>${plural(x.n, 'loja', 'lojas')} · ${pct(x.n, tot)}`)}><b>${pct(x.n, tot)}</b><span class="fxb-b"><i style="height:${Math.max(3, (x.n / mx) * 100)}%;background:${cor}"></i></span><small>${x.t}</small></div>`).join('')}</div>`;
  }
  // Grupo (aparelho, navegador, idioma): participação e conclusão
  // Onde a loja mais usa o Bigou App (marcado no cadastro do treinamento)
  function usoTxt(u) {
    const c = Array.isArray(u) && u.includes('celular'), pc = Array.isArray(u) && u.includes('computador');
    return c && pc ? 'Celular e computador' : c ? 'Celular' : pc ? 'Computador' : 'Não informado';
  }
  function grupoBloco(titulo, ic, lista, total) {
    if (!lista.length) return `<div class="gp"><h4>${IC[ic]}${titulo}</h4><p class="empty">Sem dados.</p></div>`;
    return `<div class="gp"><h4>${IC[ic]}${titulo}</h4>${lista.slice(0, 6).map((g) => `<div class="gp-r" ${tipAttr(`<b>${esc(g.k)}</b><br>${plural(g.n, 'loja', 'lojas')}${g.com ? `<br>${pct(g.ok, g.com)} de quem começou concluiu` : ''}`)}>
      <span class="gp-k">${esc(g.k)}</span><span class="md-tr"><i style="width:${(g.n / Math.max(1, total)) * 100}%"></i></span><b>${pct(g.n, total)}</b>
      <small>${g.com >= POUCOS ? `${pct(g.ok, g.com)} concluem` : 'poucos dados'}</small></div>`).join('')}</div>`;
  }
  // Cartões da Visão geral: quanto tempo leva e como saem dos módulos
  const cardTempo = (U) => card('Quanto tempo leva para concluir', 'Lojas que concluíram, por dias corridos e por tempo de tela.', `<div class="fx-2"><div><h4 class="sub">Dias corridos</h4>${faixas(U.faixaDias, '#12a150')}</div><div><h4 class="sub">Tempo de tela</h4>${faixas(U.faixaTela, '#2563eb')}</div></div>`, '', 'tempo');
  const cardSaidas = (U) => card('Como saem dos módulos', 'Saídas no meio de um módulo, pelo jeito que a loja saiu.', U.saidas.length ? `<ul class="sx">${U.saidas.map((x) => `<li><span class="sx-ic">${IC[x.ic]}</span><div><b>${x.t}</b><small>${x.ms != null ? `ficaram ${dur(x.ms)} no passo antes de sair (mediana)` : ''}</small></div><b class="sx-n">${n(x.n)}<small>${pct(x.n, U.saidasTot)}</small></b></li>`).join('')}</ul>` : `<p class="empty bom">${IC.ok}Nenhuma saída no meio de um módulo.</p>`, '', 'sair');
  PG.uso = ({ R, f }) => {
    const U = R.uso, K = R.kpi, cad = K.cadastradas;
    const pico = R.serie.reduce((a, x) => (x.acessos > (a ? a.acessos : 0) ? x : a), null);
    const cel = (() => { let m = null; R.calor.forEach((l, d) => l.forEach((v, h) => { if (v && (!m || v > m.v)) m = { d, h, v }; })); return m; })();
    const cmp = (r) => {
      if (r.apos) return '<small class="mut">Liberado só ao concluir: não dá para comparar.</small>';
      if (r.com < POUCOS || r.sem < POUCOS) return '<small class="mut">Poucos dados para comparar.</small>';
      const a = r.comOk / r.com, b = r.semOk / r.sem, d = Math.round((a - b) * 100);
      return `<div class="rc-cmp">
        <span class="rc-l"><small>Usaram</small><span class="md-tr"><i style="width:${a * 100}%"></i></span><b>${pct(r.comOk, r.com)}</b></span>
        <span class="rc-l nao"><small>Não usaram</small><span class="md-tr"><i style="width:${b * 100}%"></i></span><b>${pct(r.semOk, r.sem)}</b></span>
        <em class="rc-d ${d > 0 ? 'bom' : d < 0 ? 'ruim' : ''}">${d > 0 ? '+' : ''}${d} p.p.</em></div>`;
    };
    return `
      <div class="kpis k4">
        ${kpi('olho', 'Visitas que viraram cadastro', U.visitantes == null ? '—' : pct(cad, cad + U.visitantes), U.visitantes == null ? 'Sem filtro de cidade para calcular' : `${n(cad)} cadastros de ${plural(cad + U.visitantes, 'visitante', 'visitantes')}`, '', 'Quem abriu o treinamento e chegou a se cadastrar. Visitante sem cadastro não tem cidade, por isso o número some com o filtro de cidade.')}
        ${kpi('tempo', 'Tempo até começar', durLongo(U.tempoInicio), 'mediana entre o cadastro e o 1º módulo', '', 'Quanto tempo a loja leva, depois de se cadastrar, para abrir o primeiro módulo.')}
        ${kpi('atualizar', 'Voltaram outro dia', pct(U.voltaram, K.comecaram), `${plural(U.voltaram, 'loja usou', 'lojas usaram')} em 2 dias ou mais`, '', 'Lojas que começaram e tiveram atividade em pelo menos dois dias diferentes.')}
        ${kpi('aparelho', 'Retomaram em outro aparelho', n(U.retomaram), `${pct(U.retomaram, cad)} das cadastradas`, '', 'Lojas que entraram de novo em outro aparelho e continuaram de onde pararam.', 'hl')}
      </div>
      ${card('Ritmo do período', `Acessos e treinamentos concluídos por dia.${pico && pico.acessos ? ` Pico: <b>${plural(pico.acessos, 'acesso', 'acessos')}</b> em ${dataBR(pico.t)}.` : ''} Passe o dedo ou o mouse sobre o gráfico.`, '<div id="linha"></div>', '', 'pulso')}
      ${card('Recursos que ajudam a concluir', `Quanto cada recurso é usado e a conclusão de quem usou × quem não usou (só lojas que começaram). Com menos de ${POUCOS} lojas em um dos lados, não comparamos.`, `<ul class="rc">${U.recursos.map((r) => `<li class="rc-i">
          <span class="rc-ic">${IC[r.ic]}</span>
          <div class="rc-t"><b>${r.t}</b><small>${r.usaram ? `${pct(r.usaram, cad)} das lojas usaram (${n(r.usaram)})` : 'Ninguém usou no período'}</small></div>
          ${r.usaram ? cmp(r) : ''}
        </li>`).join('')}</ul>`, '', 'raio')}
      <div class="cols">
        ${card('Quando acessam', cel ? `Acessos por dia da semana e hora. Mais movimento: <b>${SEMANA[cel.d]}, ${cel.h}h</b>.` : 'Acessos por dia da semana e hora.', graficoCalor(R), '', 'calendario')}
        ${card('Por onde acessam', 'Participação de cada aparelho, navegador e idioma, onde usam o Bigou App, e quanto concluem.', `<div class="gps">${grupoBloco('Aparelho', 'aparelho', U.grupos.dispositivo, cad)}${grupoBloco('Navegador', 'olho', U.grupos.navegador, cad)}${grupoBloco('Idioma', 'chat', U.grupos.idioma, cad)}${grupoBloco('Usa o Bigou App no', 'aparelho', U.grupos.usoApp, U.grupos.usoApp.reduce((t, g) => t + g.n, 0))}</div>${U.grupos.usoApp.length ? '' : '<p class="note">“Usa o Bigou App no” começa a ser preenchido com os próximos cadastros.</p>'}`, '', 'aparelho')}
      </div>
      ${f.cidade ? '' : ''}`;
  };

  /* Exportar */
  const EXPORTS = [
    ['csv-plano', 'Dúvidas e anotações', 'Uma linha por erro em pergunta (com a resposta escolhida), comentário da avaliação e anotação da equipe. É o principal para o plano de ação.', true],
    ['csv', 'Lojas', 'Situação, progresso, acerto, dúvidas, anotações e avaliação de cada loja.'],
    ['csv-perguntas', 'Perguntas', 'As 19 perguntas com quantas lojas escolheram cada alternativa.'],
    ['csv-passos', 'Passo a passo', 'Cada passo de cada módulo: quantas viram, saíram, pularam e o tempo mediano.'],
    ['csv-modulos', 'Módulos', 'Iniciaram, concluíram, pararam e tempo de cada módulo.'],
    ['csv-avaliacoes', 'Avaliações', 'Estrelas, "ajudou?" e comentários de cada loja.'],
    ['csv-cidades', 'Cidades', 'Lojas, conclusão, certificação, acerto médio e contatos por cidade.'],
  ].concat(CHAT ? [['csv-duvidas', 'Dúvidas do chat', 'Perguntas feitas no assistente e as avaliações das respostas.']] : []);
  PG.exportar = ({ periodoTxt, f }) => `
    <p class="ex-nota">Os arquivos seguem os filtros atuais: lojas cadastradas ${periodoTxt}${f.cidade ? ` em ${esc(f.cidade)}` : ''}. Abrem no Excel e no Google Planilhas.</p>
    <div class="ex">${EXPORTS.map(([a, t, d, destaque]) => `<div class="card ex-c ${destaque ? 'hl' : ''}"><h3>${t}</h3><p>${d}</p><button class="btn ${destaque ? 'primary' : ''} ic" data-a="${a}">${IC.baixar}<span>Baixar CSV</span></button></div>`).join('')}</div>`;

  function desenharLinha() {
    const el = document.getElementById('linha');
    if (el) el.innerHTML = graficoLinha(st.R, el.clientWidth || 600);
  }

  const SIT = {
    parada: ['Parada', 'bad', 'parado'], naocomecou: ['Não começou', 'off', 'tempo'], semcert: ['Sem certificado', 'warn', 'alerta'],
    andamento: ['Em andamento', 'info', 'andamento'], recente: ['Recém-cadastrada', 'info', 'andamento'], certificada: ['Certificada', 'ok', 'ok'],
  };
  // Situação sempre com ícone + rótulo (nunca só cor)
  const sitBadge = (sit) => `<span class="badge bi ${SIT[sit][1]}">${IC[SIT[sit][2]]}${SIT[sit][0]}</span>`;
  /* Lojas: abas por situação e cartões com o que fazer */
  const ABA_LOJA = { contato: (s) => s.contato, andamento: (s) => s.sit === 'andamento' || s.sit === 'recente', certificadas: (s) => s.sit === 'certificada', todas: () => true };
  const MAIS_FILTROS = [['', 'Sem filtro extra'], ['parada', 'Paradas'], ['naocomecou', 'Não começaram'], ['semcert', 'Sem certificado'], ['contatadas', 'Contatadas'], ['reincidente', 'Certificadas após refazer'], ['notas', 'Com anotações']];
  const extra = (s) => !st.status || (st.status === 'contatadas' ? s.contatada : st.status === 'notas' ? s.notas.length > 0 : st.status === 'reincidente' ? s.reincidente : s.sit === st.status);
  // Aba de Lojas: a do endereço; sem aba no endereço, "Precisam de contato" quando houver
  const abaLojas = () => (location.hash.includes(':') ? rota().aba : st.R && st.R.sit.contato ? 'contato' : 'todas');
  const URG = { parada: 0, naocomecou: 1, semcert: 2, andamento: 3, recente: 4, certificada: 5 };
  function linhasLojas() {
    const b = st.busca.trim().toLowerCase(), aba = ABA_LOJA[abaLojas()] || ABA_LOJA.todas;
    const rows = st.R.lojas.filter((s) => aba(s) && extra(s) && (!b || s.p.loja.toLowerCase().includes(b) || s.p.cidade.toLowerCase().includes(b)));
    const o = st.ordLoja;
    const cmp = o === 'nome' ? (a, c) => a.p.loja.localeCompare(c.p.loja, 'pt-BR')
      : o === 'prog' ? (a, c) => c.fim.size - a.fim.size || c.ultimo - a.ultimo
      : o === 'ultimo' ? (a, c) => c.ultimo - a.ultimo
      : (a, c) => (a.contato === c.contato ? 0 : a.contato ? -1 : 1) || URG[a.sit] - URG[c.sit] || a.ultimo - c.ultimo;
    return rows.sort(cmp);
  }
  const bolinhas = (s) => `<ol class="dots" aria-label="${s.fim.size} de ${NMOD} módulos concluídos">${MODS.map((m) => `<li class="${s.fim.has(m.n) ? 'ok' : s.ini.has(m.n) ? 'meio' : ''}" title="Módulo ${m.n}: ${esc(m.titulo)}"></li>`).join('')}</ol>`;
  const K_VISTA = 'bigou-admin-vista-lojas';
  let vistaLoja = (() => { try { return localStorage.getItem(K_VISTA) === 'lista' ? 'lista' : 'cartoes'; } catch (e) { return 'cartoes'; } })();
  const emLista = () => vistaLoja === 'lista' && !matchMedia('(max-width: 759px)').matches;
  const tabelaLojas = (itens) => `<div class="lj-tw"><table class="lj-tb">
      <thead><tr><th>Loja</th><th>Situação</th><th>Progresso</th><th>O que aconteceu</th><th>Último acesso</th><th><span class="sr">Ações</span></th></tr></thead>
      <tbody>${itens.map((s) => `
        <tr class="lj-row lj-l ${s.contato ? 'need' : ''} s-${s.sit}" data-loja="${esc(s.p.id)}" tabindex="0" aria-label="Abrir a ficha de ${esc(s.p.loja)}">
          <td><b class="lj-n">${esc(s.p.loja)}</b><small class="lj-ci">${IC.cidade}${esc(s.p.cidade)}${s.reincidente ? ' <span class="badge warn">Reincidente</span>' : ''}${s.contatada ? ` <span class="badge ok" title="${esc(contatoTxt(s.contatoFeito))}">Contatada</span>` : ''}</small></td>
          <td>${sitBadge(s.sit)}</td>
          <td><span class="lj-pb" title="${s.fim.size} de ${NMOD} módulos"><span><i style="width:${(s.fim.size / NMOD) * 100}%"></i></span><b>${s.fim.size}/${NMOD}</b></span></td>
          <td class="lj-mo" title="${esc(s.motivo)}">${esc(s.motivo)}</td>
          <td class="lj-ua" title="${dataHoraBR(s.ultimo)}">${relativo(s.ultimo)}</td>
          <td class="lj-ac"><div class="lj-acw">${s.contato ? `<button type="button" class="btn ct-btn sm" data-contato="${esc(s.p.id)}" title="Registrar contato feito">${IC.ok}<span>Contato feito</span></button>` : ''}<button type="button" class="btn sm" data-ficha="${esc(s.p.id)}" aria-label="Abrir a ficha de ${esc(s.p.loja)}"><span>Abrir</span>${IC.seta}</button></div></td>
        </tr>`).join('')}</tbody></table></div>`;
  TABELAS.lojas = () => {
    const { itens, ctrl } = paginar('lojas', linhasLojas());
    if (!itens.length) {
      const aba = abaLojas();
      return `<p class="empty ${aba === 'contato' ? 'bom' : ''}">${aba === 'contato' && !st.busca && !st.status ? `${IC.ok}Nenhuma loja precisa de contato agora.` : 'Nenhuma loja com esse filtro.'}</p>`;
    }
    if (emLista()) return tabelaLojas(itens) + ctrl;
    return `<div class="lj-g">${itens.map((s) => `
      <article class="lj-row lj-c ${s.contato ? 'need' : ''} s-${s.sit}" data-loja="${esc(s.p.id)}" tabindex="0" aria-label="Abrir a ficha de ${esc(s.p.loja)}">
        <header class="lj-ch"><div><b class="lj-n">${esc(s.p.loja)}</b><small class="lj-ci">${IC.cidade}${esc(s.p.cidade)}</small></div>${sitBadge(s.sit)}</header>
        <div class="lj-pr">${bolinhas(s)}<b>${s.fim.size}/${NMOD}</b></div>
        <p class="lj-mt">${IC[SIT[s.sit][2]]}<span>${esc(s.motivo)}</span></p>
        <div class="lj-meta">
          <span class="${s.erros.length ? 'ct' : ''}" title="Erros na 1ª tentativa">${IC.pergunta}${plural(s.erros.length, 'dúvida', 'dúvidas')}</span>
          <span title="Anotações da equipe">${IC.nota}${plural(s.notas.length, 'anotação', 'anotações')}</span>
          <span title="${dataHoraBR(s.ultimo)}">${IC.tempo}${relativo(s.ultimo)}</span>
          ${s.reincidente ? '<span class="badge warn" title="Só passou de 70% depois de refazer as perguntas que errou">Reincidente</span>' : ''}${s.contatada ? `<span class="badge ok" title="${esc(contatoTxt(s.contatoFeito))}">Contatada</span>` : ''}
        </div>
        <footer class="lj-f">${s.contato ? `<button type="button" class="btn ct-btn" data-contato="${esc(s.p.id)}">${IC.ok}<span>Contato feito</span></button>` : ''}<button type="button" class="btn primary" data-ficha="${esc(s.p.id)}"><span>Abrir</span>${IC.seta}</button></footer>
      </article>`).join('')}</div>${ctrl}`;
  };
  PG.lojas = ({ R }) => {
    const SI = R.sit, K = R.kpi, tot = R.lojas.length, and = SI.andamento + SI.recente, aba = abaLojas();
    const cont = (k) => R.lojas.filter(ABA_LOJA[k]).length;
    return `
      <div class="kpis k4">
        ${kpi('loja', 'Total de lojas', n(tot), 'Cadastradas no período', '', 'Lojas cadastradas no período e na cidade escolhidos.', '', 'todas')}
        ${kpi('ok', 'Concluíram', n(K.concluiram), `${pct(K.concluiram, tot)} de conclusão`, kpiBar(tot && K.concluiram / tot), `Lojas que concluíram os ${NMOD} módulos.`, '', 'certificadas')}
        ${kpi('andamento', 'Em andamento', n(and), `${pct(and, tot)} em andamento`, kpiBar(tot && and / tot, 'am'), 'Lojas que começaram e seguem ativas, ou se cadastraram há pouco.', 'am', 'andamento')}
        ${kpi('critico', 'Precisam de atenção', n(SI.contato), `${pct(SI.contato, tot)} precisam de contato`, kpiBar(tot && SI.contato / tot, 'vm'), `Paradas há ${PARADA_DIAS}+ dias, sem começar há ${SEM_INICIO_DIAS}+ dias ou concluíram sem certificado, e ainda sem contato feito.`, 'vm', 'contato')}
      </div>
      ${card('Lista de lojas', aba === 'contato' ? 'Comece por aqui: lojas paradas, que não começaram ou sem certificado, ainda sem contato. Depois de falar com a loja, toque em Contato feito.' : 'Toque numa loja para ver o que ela errou, a avaliação e as anotações.', `
        ${tabs('lojas', [['contato', 'Precisam de contato', 'critico', cont('contato')], ['andamento', 'Em andamento', 'andamento', cont('andamento')], ['certificadas', 'Certificadas', 'medalha', cont('certificadas')], ['todas', 'Todas', 'lista', tot]], aba)}
        <div class="lj-top">
          <input type="search" class="busca" id="lj-busca" placeholder="Buscar loja ou cidade" value="${esc(st.busca)}">
          <label class="sel"><span>Mais filtros</span><select data-loc="status">${MAIS_FILTROS.map(([k, t]) => `<option value="${k}" ${st.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label class="sel"><span>Ordenar</span><select data-loc="ordLoja">${[['urgencia', 'Mais urgentes primeiro'], ['ultimo', 'Último acesso'], ['nome', 'Nome'], ['prog', 'Progresso']].map(([k, t]) => `<option value="${k}" ${st.ordLoja === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <div class="vw" role="group" aria-label="Ver lojas como">
            <button type="button" data-vista="cartoes" aria-pressed="${vistaLoja !== 'lista'}" title="Ver em cartões">${IC.cartoes}<span>Cartões</span></button>
            <button type="button" data-vista="lista" aria-pressed="${vistaLoja === 'lista'}" title="Ver em lista">${IC.lista}<span>Lista</span></button>
          </div>
        </div>
        <div class="lj-leg ${vistaLoja === 'lista' ? 'so-cel' : ''}"><span><i class="ok"></i>Módulo concluído</span><span><i class="meio"></i>Começou</span><span><i></i>Não abriu</span></div>
        <div id="t-lojas">${TABELAS.lojas()}</div>`, 'lj-card', 'lista')}`;
  };

  const desenharLojas = () => redesenhar('lojas');
  function fecharMenus() { document.querySelectorAll('.fm.open').forEach((m) => { m.classList.remove('open'); const b = m.querySelector('[data-pmenu]'); if (b) b.setAttribute('aria-expanded', 'false'); }); }
  const contatoTxt = (a) => `Contato feito em ${dataHoraBR(+new Date(a.criado_em))}${a.autor ? ` por ${a.autor}` : ''}`;

  /* ------------------------------ Ficha da loja ------------------------------ */
  const ASSUNTOS_NOTA = [...new Set(MODS.flatMap((m) => m.steps.filter((x) => x.tema).map((x) => x.tema)))].concat(['Plataforma', 'Atendimento', ASSUNTO_CONTATO, 'Outro']);
  const autorSalvo = () => { try { return localStorage.getItem('bigou-admin-autor') || ''; } catch (e) { return ''; } };
  const fx = document.createElement('div');
  fx.className = 'fx-wrap';
  fx.hidden = true;
  document.body.appendChild(fx);
  let fxId = null, fxEditando = null, fxContato = false, fxResumo = false;   // fxContato: caixinha "Contato feito" aberta; fxResumo: resumo das dúvidas aberto

  // Resumo das dúvidas da loja, já no formato de mensagem para o parceiro (WhatsApp aceita *negrito*)
  const semTags = (t) => String(t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  // HTML das respostas do assistente → texto corrido (listas viram "1) … 2) …")
  const htmlTexto = (h) => {
    let i = 0;
    return String(h || '').replace(/<small[\s\S]*?<\/small>/g, '').replace(/<ol[^>]*>/g, () => { i = 0; return ' '; })
      .replace(/<li[^>]*>/g, () => `${++i}) `).replace(/<\/li>/g, '; ').replace(/<br\s*\/?>/g, ' ').replace(/<\/?[^>]+>/g, '')
      .replace(/;\s*(?=[A-ZÁÉÍÓÚ])/g, '. ').replace(/\s+/g, ' ').replace(/\s([.,;:])/g, '$1').trim();
  };
  const frase = (t) => { t = String(t || '').trim(); return t && !/[.!?]$/.test(t) ? t + '.' : t; };
  const minusc = (t) => (t && !/^[A-Z]{2}/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
  // Explicação do assunto: entre as respostas do Assistente Bigou do mesmo assunto, a que mais
  // compartilha palavras com a pergunta, a resposta certa e a explicação do exercício
  const palavras = (t) => new Set(String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]{4,}/g) || []);
  function explicacao(q, certa, ok, tema) {
    const Bot = TREINO.Bot;
    if (!Bot) return null;
    const base = palavras(`${q} ${certa} ${ok}`);
    let melhor = null, nota = -1;
    Bot.intencoes.filter((c) => c.tema === tema).forEach((c) => {
      let txt = '';
      try { txt = htmlTexto(c.r()); } catch (e) { return; }
      const w = palavras(`${c.exemplo} ${c.exemplo} ${txt}`);
      let sc = 0;
      base.forEach((x) => { if (w.has(x)) sc++; });
      if (sc > nota) { nota = sc; melhor = { id: c.id, texto: txt, rever: c.rever }; }
    });
    return melhor;
  }
  // Resumo das dúvidas da loja: texto natural, pronto para mandar ao parceiro (WhatsApp aceita *negrito*)
  function resumoDuvidas(s) {
    const porId = new Map();
    MODS.forEach((m) => m.steps.forEach((stp) => { if (stp.mode === 'quiz') porId.set(stp.id, { stp, m }); }));
    const vistos = new Set(), temas = new Map();
    s.erros.slice().sort((a, b) => a.t - b.t).forEach((x) => {
      if (vistos.has(x.id)) return;
      vistos.add(x.id);
      const ref = porId.get(x.id);
      const tema = x.tema || 'Outros assuntos';
      if (!temas.has(tema)) temas.set(tema, { itens: [], mods: new Set() });
      temas.get(tema).itens.push({
        q: ref ? semTags(ref.stp.q) : semTags(x.q),
        certa: ref ? semTags((ref.stp.options.find((o) => o.ok) || {}).t) : '',
        ok: ref ? semTags(ref.stp.ok) : '',
      });
      if (ref) temas.get(tema).mods.add(ref.m.n);
    });
    let temValores = false;
    const blocos = [...temas.entries()].map(([tema, g], k) => {
      const usadas = new Set();
      const linhas = g.itens.map((i) => {
        if (/R\$\s?\d|\d+%/.test(i.certa + i.ok)) temValores = true;
        const certa = i.certa ? ` a resposta é *${i.certa}*.` : '';
        const ok = i.ok && i.ok !== i.certa ? ` ${frase(i.ok)}` : '';
        return `Na pergunta “${i.q}”,${certa || ' vale rever este ponto.'}${ok}`;
      });
      const ex = explicacao(g.itens.map((i) => i.q).join(' '), g.itens.map((i) => i.certa).join(' '), g.itens.map((i) => i.ok).join(' '), tema);
      // Para rever: o módulo que ensina o assunto (o exercício final fica no 10, que só repete)
      if (ex && ex.rever) { g.mods = new Set([ex.rever]); }
      let explica = '';
      if (ex && !usadas.has(ex.id)) {
        usadas.add(ex.id);
        if (/R\$\s?\d|\d+%/.test(ex.texto)) temValores = true;
        explica = `\n\nExplicando melhor: ${minusc(frase(ex.texto))}`;
      }
      const mods = [...g.mods].sort((a, b) => a - b);
      const rever = mods.length ? `\nSe quiser rever, esse assunto está no *Módulo ${mods.join(' e ')}* do treinamento${mods.length === 1 ? ` (${MODS.find((m) => m.n === mods[0]).titulo})` : ''}.` : '';
      return `*${k + 1}. ${tema}*\n${linhas.join('\n')}${explica}${rever}`;
    });
    const n = vistos.size;
    const abertura = `Olá, ${s.p.loja}! Tudo bem?\n\nAqui é da equipe do Financeiro Bigou. Acompanhamos o seu Treinamento Financeiro e vimos que ${n === 1 ? 'uma pergunta deixou dúvida' : `${n} perguntas deixaram dúvida`}. Para facilitar, preparamos uma explicação ${temas.size === 1 ? 'do assunto' : 'de cada assunto'}:`;
    const nota = temValores ? '\n\nOs valores e percentuais citados são os exemplos usados no treinamento. Os da sua loja estão no seu contrato.' : '';
    return `${abertura}\n\n${blocos.join('\n\n')}${nota}\n\nSe ficar qualquer dúvida, é só responder esta mensagem que a gente explica de novo. Estamos à disposição!`;
  }
  async function copiarTexto(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (x) { /* */ } ta.remove(); return ok;
    }
  }

  function abrirFicha(id) {
    const s = st.R.lojas.find((x) => x.p.id === id);
    if (!s) return fecharFicha();
    fxId = id;
    const acerto = s.respondidas ? Math.round((s.certas / s.respondidas) * 100) : null;
    const dots = MODS.map((m) => `<li class="${s.fim.has(m.n) ? 'ok' : s.ini.has(m.n) ? 'meio' : ''}" title="Módulo ${m.n}: ${esc(m.titulo)} · ${s.fim.has(m.n) ? 'concluído' : s.ini.has(m.n) ? 'começou' : 'não abriu'}">${m.n}</li>`).join('');
    const opcoes = (sel) => ASSUNTOS_NOTA.map((a) => `<option ${a === sel ? 'selected' : ''}>${esc(a)}</option>`).join('');
    const form = (a) => `
      <form class="fx-form" data-fx-form="${a ? esc(a.id) : 'nova'}">
        <div class="fx-row">
          <label><span>Assunto</span><select name="assunto">${opcoes(a ? a.assunto : (s.erros[0] && s.erros[0].tema) || ASSUNTOS_NOTA[0])}</select></label>
          <label><span>Seu nome</span><input name="autor" maxlength="60" value="${esc(a ? a.autor || '' : autorSalvo())}" placeholder="Quem está anotando" required></label>
        </div>
        <label><span>${a ? 'Editar anotação' : 'Nova anotação'}</span><textarea name="texto" rows="3" maxlength="2000" required placeholder="Qual foi a dúvida do parceiro? O que foi explicado? O que poderia melhorar?">${a ? esc(a.texto) : ''}</textarea></label>
        <div class="fx-btns">${a ? '<button type="button" class="btn" data-fx="cancelar">Cancelar</button>' : ''}<button type="submit" class="btn primary">${a ? 'Salvar alterações' : 'Adicionar anotação'}</button></div>
        <p class="fx-err" role="alert"></p>
      </form>`;
    // Igual à anotação, com o assunto fixo: registra o contato e tira a loja de "Precisam de contato"
    const formContato = () => `
      <form class="fx-form fx-contato" data-fx-form="nova">
        <input type="hidden" name="assunto" value="${esc(ASSUNTO_CONTATO)}">
        <label><span>O que foi feito no contato?</span><textarea name="texto" rows="3" maxlength="2000" required placeholder="Como foi o contato (ligação, WhatsApp…), o que o parceiro disse e o que ficou combinado."></textarea></label>
        <label><span>Seu nome</span><input name="autor" maxlength="60" value="${esc(autorSalvo())}" placeholder="Quem fez o contato" required></label>
        <div class="fx-btns"><button type="button" class="btn" data-fx="contato-cancelar">Cancelar</button><button type="submit" class="btn primary">Salvar contato</button></div>
        <p class="fx-err" role="alert"></p>
      </form>`;
    const contato = s.contato
      ? `<section class="fx-s fx-ct">${fxContato ? formContato() : `<button type="button" class="btn ct-btn" data-fx="contato">${IC.ok}<span>Contato feito</span></button><small>Registre o contato para tirar a loja de "Precisam de contato".</small>`}</section>`
      : s.contatada ? `<p class="fx-ct-ok">${IC.ok}<span>${esc(contatoTxt(s.contatoFeito))}</span></p>` : '';
    const anot = s.notas.map((a) => fxEditando === a.id ? `<li class="fx-nota ed">${form(a)}</li>` : `
      <li class="fx-nota">
        <div class="fx-nota-h"><span class="tag">${esc(a.assunto || 'Outro')}</span><small>${esc(a.autor || 'Equipe')} · ${dataHoraBR(+new Date(a.criado_em))}${a.atualizado_em ? ' · editada' : ''}</small></div>
        <p>${esc(a.texto)}</p>
        <div class="fx-nota-a"><button type="button" class="lnk" data-fx="editar" data-id="${esc(a.id)}">Editar</button><button type="button" class="lnk del" data-fx="excluir" data-id="${esc(a.id)}">Excluir</button></div>
      </li>`).join('');
    fx.innerHTML = `
      <div class="fx-scrim" data-fx="fechar"></div>
      <aside class="fx" role="dialog" aria-modal="true" aria-labelledby="fx-t">
        <header class="fx-h">
          <div><h2 id="fx-t">${esc(s.p.loja)}</h2><small>${esc(s.p.cidade)} · cadastrada ${relativo(+new Date(s.p.criado_em))} · último acesso ${relativo(s.ultimo)}${s.uso && s.uso.length ? ` · usa o app no ${usoTxt(s.uso).toLowerCase()}` : ''}</small></div>
          <button type="button" class="fx-x" data-fx="fechar" aria-label="Fechar">${IC.x}</button>
        </header>
        <div class="fx-b">
          <div class="fx-sit">${sitBadge(s.sit)}${s.reincidente ? '<span class="badge warn">Reincidente</span>' : ''}<span>${esc(s.motivo)}</span></div>
          ${contato}

          <section class="fx-s">
            <h3><span class="fx-ic">${IC.rota}</span>Progresso</h3>
            <ol class="fx-dots">${dots}</ol>
            <div class="fx-nums">
              <div><b>${s.fim.size}/${NMOD}</b><small>módulos concluídos</small></div>
              <div><b>${acerto == null ? '—' : acerto + '%'}</b><small>${s.respondidas ? `acerto de primeira (${s.certas} de ${s.respondidas})` : 'ainda sem respostas'}</small></div>
              <div><b>${s.certificada ? (s.reincidente ? 'Sim, refazendo' : 'Sim') : 'Não'}</b><small>${s.reincidente ? `certificada · na 1ª vez acertou ${Math.round(s.notaPrimeira * 100)}%` : 'certificada'}</small></div>
            </div>
            ${s.certificada ? `<button type="button" class="btn ic fx-cert" data-fx="certificado">${IC.trofeu}<span>Ver certificado</span></button>` : ''}
          </section>

          <section class="fx-s">
            <div class="fx-hh"><h3><span class="fx-ic">${IC.pergunta}</span>Dúvidas nas perguntas <small>${plural(s.erros.length, 'erro', 'erros')} na 1ª tentativa</small></h3>${s.erros.length ? `<button type="button" class="btn sm fx-rs-b" data-fx="resumo" aria-expanded="${fxResumo}">${IC.chat}<span>${fxResumo ? 'Fechar resumo' : 'Fazer resumo'}</span></button>` : ''}</div>
            ${fxResumo && s.erros.length ? (() => { const r = resumoDuvidas(s); return `<div class="fx-rs" role="region" aria-label="Resumo para enviar ao parceiro">
              <p class="fx-rs-h">${IC.ok}<span>Resumo pronto para enviar ao parceiro. Revise e edite se quiser.</span></p>
              <textarea class="fx-rs-t" rows="${Math.min(18, r.split('\n').length + 1)}" aria-label="Texto do resumo">${esc(r)}</textarea>
              <div class="fx-rs-a"><button type="button" class="btn primary" data-fx="resumo-copiar">${IC.baixar}<span>Copiar texto</span></button><button type="button" class="btn" data-fx="resumo-whats">${IC.chat}<span>Abrir no WhatsApp</span></button><button type="button" class="btn" data-fx="resumo-nota" title="Salva o resumo como anotação desta loja">${IC.nota}<span>Salvar como anotação</span></button></div>
            </div>`; })() : ''}
            ${s.erros.length ? `<ul class="fx-erros">${s.erros.sort((a, b) => b.t - a.t).map((x) => `
              <li><span class="tag">${esc(x.tema)}</span>
                <b>${esc(x.q)}</b>${x.resposta ? `<span>Respondeu: “${esc(semValor(x.resposta))}”</span>` : ''}</li>`).join('')}</ul>` : '<p class="empty">Nenhum erro registrado.</p>'}
          </section>

          <section class="fx-s">
            <h3><span class="fx-ic">${IC.estrela}</span>Avaliação do treinamento</h3>
            ${s.aval ? `<div class="fx-av">${estrelas(s.aval.estrelas)}<span>${s.aval.ajudou ? 'Disse que o treinamento ajudou' : 'Disse que o treinamento não ajudou'}</span></div>${s.aval.comentario ? `<blockquote>“${esc(s.aval.comentario)}”</blockquote>` : ''}` : '<p class="empty">Ainda não avaliou.</p>'}
          </section>

          <section class="fx-s">
            <h3><span class="fx-ic">${IC.nota}</span>Anotações da equipe <small>${plural(s.notas.length, 'anotação', 'anotações')}</small></h3>
            ${Notas.semTabela ? '<p class="fx-aviso">Para salvar anotações, aplique no Supabase as migrações de <b>supabase/migrations</b>.</p>' : ''}
            ${fxEditando ? '' : form(null)}
            ${s.notas.length ? `<ul class="fx-notas">${anot}</ul>` : ''}
          </section>
        </div>
      </aside>`;
    if (fx.hidden) { fx.hidden = false; document.body.classList.add('fx-on'); requestAnimationFrame(() => fx.classList.add('in')); fx.querySelector('.fx-x').focus(); }
    if (fxContato) fx.querySelector('.fx-contato textarea').focus();
  }

  // Reemite o certificado de uma loja certificada (quando ela pede), numa aba própria para imprimir ou salvar em PDF
  function abrirCertificado(s) {
    const c = { loja: s.p.loja, cidade: s.p.cidade, quando: s.certEm || s.concluiuEm || Date.now(), nMods: NMOD, es: s.idioma === 'es' };
    if (!window.open('certificado.html#' + encodeURIComponent(JSON.stringify(c)), '_blank')) alert('O navegador bloqueou a nova aba. Permita pop-ups para este site e tente de novo.');
  }

  function fecharFicha() {
    fxId = null; fxEditando = null; fxContato = false; fxResumo = false;
    fx.classList.remove('in');
    document.body.classList.remove('fx-on');
    setTimeout(() => { if (!fxId) { fx.hidden = true; fx.innerHTML = ''; } }, 200);
  }

  // Depois de criar, editar ou excluir: recalcula e mantém a ficha aberta
  function atualizarDepois(id) {
    const y = scrollY;
    render();
    scrollTo(0, y);
    abrirFicha(id);
  }

  fx.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-fx]');
    if (!b) return;
    const a = b.dataset.fx;
    if (a === 'fechar') fecharFicha();
    else if (a === 'editar') { fxEditando = b.dataset.id; abrirFicha(fxId); }
    else if (a === 'cancelar') { fxEditando = null; abrirFicha(fxId); }
    else if (a === 'contato') { fxContato = true; abrirFicha(fxId); }
    else if (a === 'contato-cancelar') { fxContato = false; abrirFicha(fxId); }
    else if (a === 'resumo') { fxResumo = !fxResumo; const y = fx.querySelector('.fx') ? fx.querySelector('.fx').scrollTop : 0; abrirFicha(fxId); const p = fx.querySelector('.fx'); if (p) p.scrollTop = y; const t = fx.querySelector('.fx-rs-t'); if (t) t.focus({ preventScroll: true }); }
    else if (a === 'resumo-copiar') { const t = fx.querySelector('.fx-rs-t'); const ok = t && await copiarTexto(t.value); const sp = b.querySelector('span'); if (sp) { sp.textContent = ok ? 'Copiado!' : 'Não deu para copiar'; setTimeout(() => { sp.textContent = 'Copiar texto'; }, 1800); } }
    else if (a === 'resumo-whats') { const t = fx.querySelector('.fx-rs-t'); if (t) window.open('https://wa.me/?text=' + encodeURIComponent(t.value), '_blank', 'noopener'); }
    else if (a === 'resumo-nota') {
      // Preenche o formulário de nova anotação; quem salva é a pessoa, depois de revisar
      const t = fx.querySelector('.fx-rs-t'), form = fx.querySelector('form.fx-form:not(.fx-contato)[data-fx-form="nova"]');
      const ta = form && form.querySelector('textarea[name]');
      if (t && ta) { ta.value = 'Resumo enviado ao parceiro:\n' + t.value; ta.scrollIntoView({ behavior: 'smooth', block: 'center' }); ta.focus({ preventScroll: true }); }
    }
    else if (a === 'certificado') { const s = st.R.lojas.find((x) => x.p.id === fxId); if (s) abrirCertificado(s); }
    else if (a === 'excluir') {
      if (!confirm('Excluir esta anotação? Essa ação não pode ser desfeita.')) return;
      try { await Notas.excluir(b.dataset.id); atualizarDepois(fxId); } catch (err) { alert(err.message); }
    }
  });
  fx.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-fx-form]');
    if (!f) return;
    e.preventDefault();
    const dados = { assunto: f.assunto.value, texto: f.texto.value.trim(), autor: f.autor.value.trim() };
    const erro = f.querySelector('.fx-err');
    if (!dados.texto || !dados.autor) { erro.textContent = 'Preencha o seu nome e a anotação.'; return; }
    try { localStorage.setItem('bigou-admin-autor', dados.autor); } catch (err) { /* */ }
    const bt = f.querySelector('[type=submit]');
    bt.disabled = true; bt.textContent = 'Salvando…';
    try {
      if (f.dataset.fxForm === 'nova') await Notas.criar(fxId, dados.assunto, dados.texto, dados.autor);
      else await Notas.editar(f.dataset.fxForm, dados.assunto, dados.texto, dados.autor);
      fxEditando = null; fxContato = false;
      atualizarDepois(fxId);
    } catch (err) {
      erro.textContent = err.message;
      bt.disabled = false; bt.textContent = 'Tentar de novo';
      if (err.auth) { sessao.sair(); }
    }
  });
  document.addEventListener('keydown', (e) => {
    // Ctrl+B / Cmd+B recolhe ou expande o menu lateral (fora de campos de texto)
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'b' && !e.target.closest('input, textarea, select, [contenteditable]') && matchMedia('(min-width: 1000px)').matches) { e.preventDefault(); alternarSb(); return; }
    if (e.key === 'Escape' && document.querySelector('.fm.open')) { const b = document.querySelector('.fm.open [data-pmenu]'); fecharMenus(); if (b) b.focus(); return; }
    if (e.key === 'Escape' && !fx.hidden) fecharFicha();
  });

  function baixarCSV(nome, linhas) {
    // Texto vindo de visitantes pode começar com = + - @ e virar fórmula no Excel/Sheets: prefixa com '.
    const q = (v) => {
      const t = String(v == null ? '' : v);
      return `"${(typeof v === 'string' && /^[\s]*[=+\-@\t\r]/.test(t) ? "'" + t : t).replace(/"/g, '""')}"`;
    };
    const csv = '\ufeff' + linhas.map((l) => l.map(q).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `${nome}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function exportarDuvidas() {
    const part = new Map(st.dados.participantes.map((p) => [p.id, p]));
    const RES = { respondida: 'Respondida', sugestao: 'Você quis dizer', sem_resposta: 'Sem resposta', fora: 'Fora do treinamento' };
    const linhas = st.R.duvidas.lista.map((e) => {
      const d = e.detalhe || {}, p = part.get(e.participante_id) || {}, x = Bot && d.intencao ? Bot.porId(d.intencao) : null;
      return e.tipo === 'duvida'
        ? [dataHoraBR(e.t), p.loja, p.cidade, 'Pergunta', d.texto, RES[d.resultado] || d.resultado, d.tema || '', x ? x.exemplo : '', '']
        : [dataHoraBR(e.t), p.loja, p.cidade, 'Avaliação', d.texto, '', d.tema || '', x ? x.exemplo : '', d.util ? 'Ajudou' : 'Não ajudou'];
    });
    baixarCSV('treinamento-duvidas', [['Data', 'Loja', 'Cidade', 'Tipo', 'Texto', 'Resultado', 'Assunto', 'Resposta dada', 'Avaliação']].concat(linhas));
  }

  function exportarCSV() {
    const cab = ['Loja', 'Cidade', 'Módulos concluídos', 'Situação', 'Reincidente', 'Acerto na 1ª vez', 'Perguntas refeitas', 'Motivo', 'Acerto (das respondidas)', 'Dúvidas (erros)', 'Assunto com mais erro', 'Anotações', 'Ajudou', 'Estrelas', 'Comentário', 'Último acesso', 'Cadastro', 'Aparelho', 'Usa o Bigou App no'];
    const linhas = linhasLojas().map((s) => [s.p.loja, s.p.cidade, `${s.fim.size}/${NMOD}`, SIT[s.sit][0], s.reincidente ? 'Sim' : 'Não', s.respondidas ? `${Math.round(s.notaPrimeira * 100)}%` : '', s.refeitas.size, s.motivo, s.respondidas ? `${Math.round((s.certas / s.respondidas) * 100)}% (${s.certas} de ${s.respondidas})` : '', s.erros.length, s.erroTema || '', s.notas.length, s.aval ? (s.aval.ajudou ? 'Sim' : 'Não') : '', s.aval ? s.aval.estrelas : '', s.aval ? s.aval.comentario || '' : '', dataHoraBR(s.ultimo), dataHoraBR(s.p.criado_em), s.p.dispositivo, s.uso && s.uso.length ? usoTxt(s.uso) : '']);
    baixarCSV('treinamento-lojas', [cab].concat(linhas));
  }

  // Uma linha por dúvida: erros nas perguntas, comentários da avaliação e anotações da equipe.
  // É a base para o plano de ação de melhorias na plataforma e no treinamento.
  function exportarPlano() {
    const cab = ['Tipo', 'Loja', 'Cidade', 'Situação', 'Acerto da loja (das respondidas)', 'Assunto', 'Pergunta ou texto', 'Resposta escolhida / avaliação', 'Autor', 'Data', 'Editado em'];
    const linhas = [];
    linhasLojas().forEach((s) => {
      const base = [s.p.loja, s.p.cidade, SIT[s.sit][0], s.respondidas ? `${Math.round((s.certas / s.respondidas) * 100)}% (${s.certas} de ${s.respondidas})` : ''];
      s.erros.forEach((x) => linhas.push(['Erro em pergunta'].concat(base, [x.tema, x.q, x.resposta ? semValor(x.resposta) : '', '', dataHoraBR(x.t), ''])));
      if (s.aval && s.aval.comentario) linhas.push(['Comentário da avaliação'].concat(base, ['', s.aval.comentario, `${s.aval.estrelas} estrelas · ${s.aval.ajudou ? 'ajudou' : 'não ajudou'}`, '', '', dataHoraBR(s.aval.t), '']));
      s.notas.forEach((a) => linhas.push(['Anotação da equipe'].concat(base, [a.assunto || '', a.texto, '', '', a.autor || '', dataHoraBR(+new Date(a.criado_em)), a.atualizado_em ? dataHoraBR(+new Date(a.atualizado_em)) : ''])));
    });
    baixarCSV('treinamento-duvidas-e-anotacoes', [cab].concat(linhas));
  }

  /* ------------------------------ CSVs com os dados completos ------------------------------ */
  function exportarPerguntas() {
    const linhas = [];
    st.R.perguntas.forEach((q) => {
      q.opcoes.forEach((o) => linhas.push([q.id, q.onde, q.tema, q.q, o.t, o.ok ? 'Sim' : 'Não', o.n, q.tot ? pct(o.n, q.tot) : '', q.tot ? pct(q.ok, q.tot) : '', q.tentativas ? q.tentativas.toFixed(1).replace('.', ',') : '']));
    });
    baixarCSV('treinamento-perguntas', [['Id', 'Onde', 'Assunto', 'Pergunta', 'Alternativa', 'Correta', 'Escolheram (1ª tentativa)', '% das respostas', 'Acerto de primeira', 'Tentativas até acertar']].concat(linhas));
  }
  function exportarPassos() {
    baixarCSV('treinamento-passos', [['Módulo', 'Passo', 'Título', 'Tipo', 'Viram', 'Saíram aqui', 'Pularam', 'Tempo mediano (s)']].concat(st.R.passos.map((x) => [x.m, x.p, x.titulo, x.tipo, x.viram, x.sairam, x.pulos, x.tempo ? Math.round(x.tempo / 1000) : ''])));
  }
  function exportarModulos() {
    baixarCSV('treinamento-modulos', [['Módulo', 'Título', 'Iniciaram', 'Concluíram', 'Conclusão', 'Pararam aqui', 'Tempo mediano (min)', 'Passo onde mais saem']].concat(st.R.modulos.map((x) => [x.m, x.titulo, x.ini, x.fim, x.taxa == null ? '' : pct(x.fim, x.ini), x.pararam, x.tempo ? (x.tempo / 60000).toFixed(1).replace('.', ',') : '', x.passoSai ? tituloPasso(x.m, x.passoSai.p) : ''])));
  }
  function exportarAvaliacoes() {
    baixarCSV('treinamento-avaliacoes', [['Loja', 'Cidade', 'Estrelas', 'Ajudou', 'Comentário', 'Data']].concat(st.R.lojas.filter((s) => s.aval).map((s) => [s.p.loja, s.p.cidade, s.aval.estrelas, s.aval.ajudou ? 'Sim' : 'Não', s.aval.comentario || '', dataHoraBR(s.aval.t)])));
  }
  function exportarCidades() {
    baixarCSV('treinamento-cidades', [['Cidade', 'Lojas', 'Começaram', 'Concluíram', 'Certificadas', 'Acerto médio', 'Precisam de contato']].concat(st.R.cidades.map((c) => [c.cidade, c.lojas, c.comecaram, c.concluiram, c.certificadas, c.respondidas ? pct(c.certas, c.respondidas) : '', c.contato])));
  }

  /* ------------------------------ Interações ------------------------------ */
  window.addEventListener('hashchange', () => { if (!st.dados) return; st.menu = false; if (paginaAtual() === 'lojas') st.pag.lojas = 1; render(); window.scrollTo(0, 0); });
  root.addEventListener('change', (e) => {
    const s = e.target.closest('[data-f]');
    if (s) { st.filtros[s.dataset.f] = s.dataset.f === 'dias' ? +s.value : s.value; st.pag = {}; render(); return; }
    const l = e.target.closest('[data-loc]');
    if (l) {
      st[l.dataset.loc] = l.type === 'checkbox' ? l.checked : l.value;
      st.pag = {};
      const pg = paginaAtual();
      if (TABELAS[pg] && pg !== 'perguntas') redesenhar(pg); else render();
    }
  });
  root.addEventListener('input', (e) => {
    const alvo = { 'lj-busca': ['busca', 'lojas'], 'cid-busca': ['buscaCid', 'cidades'], 'nt-busca': ['buscaNota', 'feedback'] }[e.target.id];
    if (alvo) { st[alvo[0]] = e.target.value; st.pag[alvo[1]] = 1; redesenhar(alvo[1]); }
  });
  const ACOES = { csv: () => exportarCSV(), 'csv-duvidas': () => exportarDuvidas(), 'csv-plano': () => exportarPlano(), 'csv-perguntas': exportarPerguntas, 'csv-passos': exportarPassos, 'csv-modulos': exportarModulos, 'csv-avaliacoes': exportarAvaliacoes, 'csv-cidades': exportarCidades };
  root.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-a]');
    if (a) {
      const x = a.dataset.a;
      if (x === 'atualizar') iniciar();
      else if (x === 'sair') { sessao.sair(); telaLogin(); }
      else if (x === 'sbmini') alternarSb();
      else if (x === 'tema') { if (window.TemaAdmin) TemaAdmin.alternar(); const b = document.querySelector('.sb-tema'); if (b) { const esc2 = temaEscuro(), t = esc2 ? 'Modo claro' : 'Modo escuro'; b.innerHTML = `${esc2 ? IC.sol : IC.lua}<span>${t}</span>`; b.dataset.sbtip = t; b.setAttribute('aria-pressed', String(esc2)); } }
      else if (x === 'menu') { st.menu = !st.menu; document.querySelector('.painel').classList.toggle('menu-on', st.menu); }
      else if (ACOES[x]) ACOES[x]();
      return;
    }
    const fm = e.target.closest('[data-fmod]');
    if (fm) { st.fModulo = fm.dataset.fmod; st.pag.passos = 1; render(); return; }
    const dm = e.target.closest('[data-modulo]');
    if (dm) { st.fModulo = dm.dataset.modulo; st.pag.passos = 1; }   // o link segue para #jornada:passos
    const ds = e.target.closest('[data-status]');
    if (ds) { st.status = ''; st.pag.lojas = 1; const h = '#lojas:' + ds.dataset.status; if (location.hash === h) render(); else location.hash = h; return; }
    const vw = e.target.closest('[data-vista]');
    if (vw) { vistaLoja = vw.dataset.vista; try { localStorage.setItem(K_VISTA, vistaLoja); } catch (err) { /* */ } document.querySelectorAll('[data-vista]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === vistaLoja))); const lg = document.querySelector('.lj-leg'); if (lg) lg.classList.toggle('so-cel', vistaLoja === 'lista'); desenharLojas(); return; }
    const pm = e.target.closest('[data-pmenu]');
    if (pm) { const fmEl = pm.closest('.fm'), abre = !fmEl.classList.contains('open'); fecharMenus(); if (abre) { fmEl.classList.add('open'); pm.setAttribute('aria-expanded', 'true'); const on = fmEl.querySelector('.fm-op.on'); if (on) on.focus({ preventScroll: true }); } return; }
    if (!e.target.closest('.fm-menu')) fecharMenus();
    const pt = e.target.closest('[data-ptema],[data-pbaixo],[data-pord],[data-plimpar]');
    if (pt) { if (pt.dataset.plimpar) { st.fTema = ''; st.fBaixo = false; st.pOrd = 'ordem'; } else if (pt.dataset.ptema != null) st.fTema = pt.dataset.ptema; else if (pt.dataset.pbaixo != null) st.fBaixo = pt.dataset.pbaixo === '1'; else st.pOrd = pt.dataset.pord; const y = scrollY; render(); scrollTo(0, y); return; }
    const pb = e.target.closest('[data-pgn] [data-ir]');
    if (pb) {
      const ch = pb.closest('[data-pgn]').dataset.pgn;
      st.pag[ch] = +pb.dataset.ir;
      redesenhar(ch);
      const el = document.getElementById('t-' + ch);
      if (el && el.getBoundingClientRect().top < 0) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90 });
      return;
    }
    const pq = e.target.closest('[data-pq]');
    if (pq) {
      const y = scrollY;
      if (pq.dataset.pq === 'editar') st.editPerg = pq.dataset.id;
      else if (pq.dataset.pq === 'cancelar') st.editPerg = null;
      else if (pq.dataset.pq === 'restaurar') {
        if (!confirm('Voltar esta pergunta ao texto original? A edição feita no painel será descartada.')) return;
        try { await Perg.restaurar(pq.dataset.id); st.editPerg = null; } catch (err) { alert(err.message); if (err.auth) { sessao.sair(); telaLogin(err.message); } return; }
      }
      render(); scrollTo(0, y);
      return;
    }
    const fi = e.target.closest('[data-ficha]');
    if (fi) { fxEditando = fi.dataset.editar || null; fxContato = false; fxResumo = false; abrirFicha(fi.dataset.ficha); return; }
    const ct = e.target.closest('[data-contato]');
    if (ct) { fxEditando = null; fxContato = true; abrirFicha(ct.dataset.contato); return; }
    const ex = e.target.closest('[data-excluir]');
    if (ex) {
      if (!confirm('Excluir esta anotação? Essa ação não pode ser desfeita.')) return;
      try { await Notas.excluir(ex.dataset.excluir); const y = scrollY; render(); scrollTo(0, y); } catch (err) { alert(err.message); }
      return;
    }
    const row = e.target.closest('.lj-row');
    if (row) { fxContato = false; fxResumo = false; abrirFicha(row.dataset.loja); return; }
    const th = e.target.closest('th.sort');
    if (th) { const k = th.dataset.k; st.ordem = { k, dir: st.ordem.k === k ? -st.ordem.dir : k === 'loja' ? 1 : -1 }; desenharLojas(); }
  });

  root.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-pq-form]');
    if (!f) return;
    e.preventDefault();
    const s = perguntaPorId(f.dataset.pqForm), erro = f.querySelector('.fx-err');
    const val = (nome) => (f.elements[nome] ? f.elements[nome].value.trim() : '');
    const opcoes = s.options.map((o, i) => val('op' + i));
    const marcada = f.querySelector('[name=correta]:checked');
    const dados = { id: s.id, q: val('q'), opcoes, correta: marcada ? +marcada.value : -1, ok: val('ok') || null, no: val('no') || null, autor: val('autor') };
    if (dados.q.length < 3 || opcoes.some((t) => !t)) { erro.textContent = 'Preencha a pergunta e todas as alternativas.'; return; }
    if (dados.correta < 0) { erro.textContent = 'Marque qual alternativa é a correta.'; return; }
    if (new Set(opcoes.map((t) => t.toLowerCase())).size < opcoes.length) { erro.textContent = 'As alternativas precisam ser diferentes entre si.'; return; }
    if (!dados.autor) { erro.textContent = 'Preencha o seu nome.'; return; }
    try { localStorage.setItem('bigou-admin-autor', dados.autor); } catch (err) { /* */ }
    const bt = f.querySelector('[type=submit]');
    bt.disabled = true; bt.textContent = 'Salvando…';
    try {
      await Perg.salvar(dados);
      st.editPerg = null;
      const y = scrollY; render(); scrollTo(0, y);
    } catch (err) {
      erro.textContent = err.message;
      bt.disabled = false; bt.textContent = 'Tentar de novo';
      if (err.auth) sessao.sair();
    }
  });

  // Tooltip único para todos os gráficos
  function mostrarTip(html, x, y) {
    tip.innerHTML = html;
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 14)) + 'px';
    tip.style.top = Math.max(8, y - h - 12 < 8 ? y + 16 : y - h - 12) + 'px';
  }
  const esconderTip = () => { tip.hidden = true; };
  // Menu recolhido: o nome de cada item aparece ao lado do ícone
  const tipSb = (el) => { const r = el.getBoundingClientRect(); tip.innerHTML = esc(el.dataset.sbtip); tip.hidden = false; tip.style.left = (r.right + 12) + 'px'; tip.style.top = (r.top + r.height / 2 - tip.offsetHeight / 2) + 'px'; };
  const sbAtivo = () => sbMini && matchMedia('(min-width: 1000px)').matches;
  root.addEventListener('mousemove', (e) => {
    const sbEl = e.target.closest('[data-sbtip]');
    if (sbEl) { if (sbAtivo()) tipSb(sbEl); else esconderTip(); return; }
    const el = e.target.closest('[data-tip]');
    if (el) return mostrarTip(el.dataset.tip, e.clientX, e.clientY);
    const hit = e.target.closest('.lc-hit');
    if (hit) return linhaHover(hit, e.clientX);
    esconderTip();
    limparLinha();
  });
  root.addEventListener('focusin', (e) => { const sbEl = e.target.closest('[data-sbtip]'); if (sbEl) { if (sbAtivo()) tipSb(sbEl); return; } const el = e.target.closest('[data-tip]'); if (el) { const r = el.getBoundingClientRect(); mostrarTip(el.dataset.tip, r.left + r.width / 2, r.top); } });
  root.addEventListener('focusout', esconderTip);
  root.addEventListener('keydown', (e) => { const row = e.target.closest && !e.target.closest('button') && e.target.closest('.lj-row'); if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirFicha(row.dataset.loja); } });
  root.addEventListener('touchstart', (e) => { const hit = e.target.closest('.lc-hit'); if (hit) linhaHover(hit, e.touches[0].clientX); else { const el = e.target.closest('[data-tip]'); if (el) mostrarTip(el.dataset.tip, e.touches[0].clientX, e.touches[0].clientY); else esconderTip(); } }, { passive: true });
  root.addEventListener('touchmove', (e) => { const hit = e.target.closest('.lc-hit'); if (hit) linhaHover(hit, e.touches[0].clientX); }, { passive: true });
  window.addEventListener('scroll', esconderTip, { passive: true });

  function linhaHover(hit, cx) {
    const box = hit.closest('.lc'), svg = box.querySelector('svg');
    const S = JSON.parse(box.dataset.linha), G = JSON.parse(box.dataset.geo);
    const r = svg.getBoundingClientRect(), sx = G.W / r.width;
    const x = (cx - r.left) * sx;
    const i = Math.max(0, Math.min(S.length - 1, Math.round(((x - G.pl) / (G.W - G.pl - G.pr)) * (S.length - 1))));
    const X = G.pl + (S.length < 2 ? 0 : (i * (G.W - G.pl - G.pr)) / (S.length - 1));
    const Y = (v) => G.pt + (G.H - G.pt - G.pb) * (1 - v / G.top);
    const set = (c, a) => Object.entries(a).forEach(([k, v]) => box.querySelector(c).setAttribute(k, v));
    set('.lc-x', { x1: X, x2: X, visibility: 'visible' });
    set('.lc-a', { cx: X, cy: Y(S[i][1]), visibility: 'visible' });
    set('.lc-b', { cx: X, cy: Y(S[i][2]), visibility: 'visible' });
    mostrarTip(`<b>${new Date(S[i][0]).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</b><br><i class="sw" style="background:${LINHA.a}"></i>Acessos: ${n(S[i][1])}<br><i class="sw" style="background:${LINHA.b}"></i>Concluídos: ${n(S[i][2])}`, r.left + X / sx, r.top + Y(Math.max(S[i][1], S[i][2])) / sx);
  }
  function limparLinha() { document.querySelectorAll('.lc-x,.lc-a,.lc-b').forEach((el) => el.setAttribute('visibility', 'hidden')); }

  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (st.R) desenharLinha(); }, 150); });

  /* ------------------------------ Seletor (lista suspensa própria) ------------------------------
     Todo <select> do painel ganha um botão e um menu no visual do painel, em vez do seletor do
     aparelho. O <select> continua no lugar (escondido): guarda o valor, vai no envio do formulário
     e dispara o mesmo evento "change" de antes, então nenhuma tela precisa saber disso. */
  const Seletor = (() => {
    let aberto = null;   // { sel, btn, menu, itens, i }
    const menu = document.createElement('div');
    menu.className = 'ss-menu';
    menu.hidden = true;
    document.body.appendChild(menu);
    const textoDe = (sel) => { const o = sel.options[sel.selectedIndex]; return o ? o.textContent : ''; };
    // Rótulo do campo: o primeiro <span> do <label> que não envolve o próprio select
    const rotuloDe = (sel) => { const l = sel.closest('label'); const sp = l && [...l.querySelectorAll('span')].find((x) => !x.contains(sel) && !x.closest('.ss')); return sp ? sp.textContent.trim() : ''; };

    function melhorar(sel) {
      if (sel.dataset.ss || sel.multiple) return;
      sel.dataset.ss = '1';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ss' + (sel.closest('.flt-c') ? ' ss-plano' : '');
      btn.setAttribute('aria-haspopup', 'listbox');
      btn.setAttribute('aria-expanded', 'false');
      const rot = rotuloDe(sel);
      if (rot) btn.setAttribute('aria-label', `${rot}: ${textoDe(sel)}`);
      btn.innerHTML = `<span class="ss-v"></span><i class="ss-chev" aria-hidden="true"></i>`;
      btn.querySelector('.ss-v').textContent = textoDe(sel);
      sel.hidden = true;
      sel.tabIndex = -1;
      sel.after(btn);
      btn._sel = sel;
    }
    function varrer(el) { (el.querySelectorAll ? el.querySelectorAll('select') : []).forEach(melhorar); if (el.tagName === 'SELECT') melhorar(el); }

    function fechar(devolverFoco) {
      if (!aberto) return;
      const { btn } = aberto;
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('on');
      menu.hidden = true;
      menu.classList.remove('folha');
      document.body.classList.remove('ss-aberto');
      aberto = null;
      if (devolverFoco) btn.focus({ preventScroll: true });
    }
    function posicionar() {
      if (!aberto) return;
      const folha = matchMedia('(max-width: 639px)').matches;
      menu.classList.toggle('folha', folha);
      document.body.classList.toggle('ss-aberto', folha);
      if (folha) { menu.style.cssText = ''; return; }
      const caixa = (aberto.btn.closest('.flt-c, .sel, label') || aberto.btn).getBoundingClientRect();
      const larg = Math.max(caixa.width, 220);
      menu.style.minWidth = larg + 'px';
      menu.style.maxWidth = Math.max(larg, 360) + 'px';
      const h = menu.offsetHeight, abaixo = innerHeight - caixa.bottom - 12;
      const cima = abaixo < Math.min(h, 260) && caixa.top > abaixo;
      menu.style.top = (cima ? Math.max(8, caixa.top - h - 6) : caixa.bottom + 6) + 'px';
      menu.style.left = Math.max(8, Math.min(innerWidth - menu.offsetWidth - 8, caixa.left)) + 'px';
    }
    function pintar(filtro) {
      const { sel } = aberto;
      const f = (filtro || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const ops = [...sel.options].map((o, i) => ({ o, i })).filter(({ o }) => !f || o.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(f));
      const lista = menu.querySelector('.ss-l');
      lista.innerHTML = ops.length ? ops.map(({ o, i }) => `<li role="option" class="ss-o ${i === sel.selectedIndex ? 'on' : ''}" data-i="${i}" aria-selected="${i === sel.selectedIndex}" tabindex="-1"><span>${esc(o.textContent)}</span><i class="ss-ck">${IC.check}</i></li>`).join('') : '<li class="ss-vazio">Nada encontrado</li>';
      aberto.itens = [...lista.querySelectorAll('.ss-o')];
    }
    function abrir(btn) {
      if (aberto && aberto.btn === btn) { fechar(true); return; }
      fechar();
      const sel = btn._sel, muitos = sel.options.length > 10, rot = rotuloDe(sel);
      aberto = { sel, btn, itens: [] };
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('on');
      menu.innerHTML = `${rot ? `<p class="ss-t">${esc(rot)}</p>` : ''}${muitos ? `<div class="ss-b">${IC.lupa}<input type="search" placeholder="Buscar…" aria-label="Buscar"></div>` : ''}<ul class="ss-l" role="listbox"${rot ? ` aria-label="${esc(rot)}"` : ''}></ul>`;
      pintar('');
      menu.hidden = false;
      posicionar();
      const atual = aberto.itens.find((x) => x.classList.contains('on')) || aberto.itens[0];
      const busca = menu.querySelector('.ss-b input');
      if (busca && !matchMedia('(pointer: coarse)').matches) busca.focus({ preventScroll: true }); else if (atual) atual.focus({ preventScroll: true });
      if (atual) atual.scrollIntoView({ block: 'nearest' });
    }
    function escolher(i) {
      if (!aberto) return;
      const { sel, btn } = aberto;
      const mudou = sel.selectedIndex !== i;
      sel.selectedIndex = i;
      btn.querySelector('.ss-v').textContent = textoDe(sel);
      const rot = rotuloDe(sel);
      if (rot) btn.setAttribute('aria-label', `${rot}: ${textoDe(sel)}`);
      fechar(true);
      if (mudou) sel.dispatchEvent(new Event('change', { bubbles: true }));
    }

    document.addEventListener('click', (e) => {
      const b = e.target.closest('.ss');
      if (b) { e.preventDefault(); abrir(b); return; }
      // Clicar em qualquer parte do filtro (ícone, rótulo) abre o seletor dele
      const caixa = !e.target.closest('.ss-menu') && e.target.closest('.flt-c, label.sel');
      if (caixa && caixa.querySelector('.ss')) { e.preventDefault(); abrir(caixa.querySelector('.ss')); return; }
      const o = e.target.closest('.ss-o');
      if (o) { escolher(+o.dataset.i); return; }
      if (aberto && !e.target.closest('.ss-menu')) fechar();
    });
    menu.addEventListener('input', (e) => { if (e.target.matches('.ss-b input')) { pintar(e.target.value); } });
    document.addEventListener('keydown', (e) => {
      const b = e.target.closest && e.target.closest('.ss');
      if (b && !aberto && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); abrir(b); return; }
      if (!aberto) return;
      const itens = aberto.itens, i = itens.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(true); }
      else if (e.key === 'Tab') fechar();
      else if (e.key === 'ArrowDown') { e.preventDefault(); (itens[i + 1] || itens[0]).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0 && menu.querySelector('.ss-b input')) menu.querySelector('.ss-b input').focus(); else (itens[i - 1] || itens[itens.length - 1]).focus(); }
      else if (e.key === 'Home') { e.preventDefault(); if (itens[0]) itens[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); if (itens.length) itens[itens.length - 1].focus(); }
      else if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { e.preventDefault(); escolher(+itens[i].dataset.i); }
      else if (e.key === 'Enter' && e.target.matches('.ss-b input') && itens[0]) { e.preventDefault(); escolher(+itens[0].dataset.i); }
      else if (e.key.length === 1 && !e.target.matches('input')) {
        // Digitar uma letra pula para a primeira opção que começa com ela
        const alvo = itens.find((x) => x.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()));
        if (alvo) alvo.focus();
      }
    }, true);
    addEventListener('resize', () => fechar());
    addEventListener('scroll', (e) => { if (aberto && !menu.contains(e.target) && !matchMedia('(max-width: 639px)').matches) fechar(); }, true);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) varrer(n); }))).observe(document.body, { childList: true, subtree: true });
    varrer(document.body);
    return { fechar };
  })();

  // Exposto para testes
  window.ADMIN = { calcular, estado: st, abrirFicha, MODS };
  iniciar();
})();
