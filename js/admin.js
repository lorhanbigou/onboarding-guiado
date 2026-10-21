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
  const SEQ = ['#f1f6fd', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];
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
  };

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
    const S = new Map(parts.map((p) => [p.id, { p, ini: new Set(), fim: new Set(), msMod: {}, saidas: [], ultimo: +new Date(p.criado_em), primeiroIni: null, concluiuEm: null, voz: false, cert: false, notaQ: {}, primeiraQ: {}, refeitas: new Set(), aval: null, erros: [], notas: [] }]));
    for (const e of evs) {
      const s = S.get(e.participante_id);
      if (!s) continue;
      s.ultimo = Math.max(s.ultimo, e.t);
      if (e.tipo === 'modulo_inicio') { s.ini.add(e.modulo); if (s.primeiroIni == null || e.t < s.primeiroIni) s.primeiroIni = e.t; }
      else if (e.tipo === 'modulo_fim') { if (!s.fim.has(e.modulo)) s.msMod[e.modulo] = (e.detalhe && e.detalhe.ms) || 0; s.fim.add(e.modulo); if (s.fim.size === NMOD && !s.concluiuEm) s.concluiuEm = e.t; }
      else if (e.tipo === 'treino_concluido') { if (!s.concluiuEm) s.concluiuEm = e.t; }
      else if (e.tipo === 'modulo_saida') s.saidas.push(e);
      else if (e.tipo === 'voz' && e.detalhe && e.detalhe.ligada) s.voz = true;
      else if (e.tipo === 'certificado') s.cert = true;
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
      s.contato = ['parada', 'naocomecou', 'semcert'].includes(s.sit);
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
    sit.contato = sit.parada + sit.naocomecou + sit.semcert;

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

    const uso = {
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

  function kpi(icone, rotulo, valor, sub, dl, ajudaTxt, cls) {
    return `<div class="kpi ${cls || ''}">
      <div class="kpi-h"><span class="kpi-ic">${IC[icone]}</span><span class="kpi-r">${rotulo}</span>${ajudaTxt ? ajuda(ajudaTxt) : ''}</div>
      <b class="kpi-v">${valor}</b>
      <div class="kpi-f">${sub ? `<small>${sub}</small>` : ''}${dl || ''}</div>
    </div>`;
  }

  // Status sempre com ícone + rótulo (nunca só cor)
  function saude(taxa) {
    if (taxa == null) return { cls: 'neutro', ic: IC.andamento, rot: 'Sem dados ainda' };
    if (taxa >= 0.5) return { cls: 'bom', ic: IC.ok, rot: 'Saudável' };
    if (taxa >= 0.3) return { cls: 'atencao', ic: IC.alerta, rot: 'Atenção' };
    return { cls: 'critico', ic: IC.critico, rot: 'Crítico' };
  }

  function anel(taxa) {
    const r = 46, c = 2 * Math.PI * r, v = taxa == null ? 0 : Math.max(0, Math.min(1, taxa));
    return `<svg class="anel" viewBox="0 0 120 120" role="img" aria-label="Taxa de conclusão ${Math.round(v * 100)}%">
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="#e9efeb" stroke-width="12"/>
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="#0b8a47" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/>
      <text x="60" y="58" text-anchor="middle" class="anel-v">${taxa == null ? '—' : Math.round(v * 100) + '%'}</text>
      <text x="60" y="76" text-anchor="middle" class="anel-r">concluem</text>
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
    return `<ol class="jr">${J.map((e, i) => {
      const a = i ? J[i - 1].v : null, perda = i ? a - e.v : 0, g = pior && pior.i === i;
      return `${i ? `<li class="jr-seta ${g ? 'is-g' : ''}" aria-hidden="true"><span>${perda > 0 ? `−${n(perda)}` : '='}</span></li>` : ''}
        <li class="jr-c ${g ? 'is-g' : ''}" ${tipAttr(`<b>${e.nome}</b>${e.sub ? `<br>${e.sub}` : ''}<br>${plural(e.v, 'loja', 'lojas')} · ${pct(e.v, base)} das cadastradas${perda > 0 ? `<br>Perda: ${plural(perda, 'loja', 'lojas')} (${pct(perda, a)})` : ''}`)}>
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
  function assuntosVisual(R) {
    if (!R.assuntos.length) return '<p class="empty">Ninguém respondeu as perguntas ainda.</p>';
    return `<div class="as">${R.assuntos.map((t) => {
      const nv = nivel(t.taxa, t.tot), v = t.taxa == null ? null : Math.round(t.taxa * 100);
      return `<details class="as-i nv-${nv}">
        <summary>
          <span class="as-t"><b>${esc(t.tema)}</b><small>${plural(t.perguntas.length, 'pergunta', 'perguntas')} · ${plural(t.tot, 'resposta', 'respostas')}</small></span>
          <span class="as-bar"><i style="width:${v == null ? 0 : Math.max(2, v)}%"></i></span>
          <span class="as-v">${v == null ? '—' : v + '%'}<em class="nv nv-${nv}">${ROT_NIVEL[nv]}</em></span>
        </summary>
        <ul class="as-q">${t.perguntas.map((q) => `
          <li>
            <div><small>${esc(q.onde)}</small><b>${esc(q.q)}</b>
              ${q.erroComum ? `<span class="as-err">Erro mais comum: “${esc(q.erroComum.t)}” (${pct(q.erroComum.n, q.tot)})</span>` : ''}            </div>
            <b class="as-qv">${q.tot ? pct(q.ok, q.tot) : '—'}<small>${plural(q.tot, 'resposta', 'respostas')}</small></b>
          </li>`).join('')}</ul>
      </details>`;
    }).join('')}</div>`;
  }

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
      <div class="legend"><span><i style="background:${COR.a}"></i>Acessos</span><span><i style="background:${COR.b}"></i>Treinamentos concluídos</span></div>
      <div class="lc" data-linha='${esc(JSON.stringify(S.map((x) => [x.t, x.acessos, x.conclusoes])))}' data-geo='${JSON.stringify({ W, H, pl, pr, pt, pb, top })}'>
        <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Acessos e conclusões por dia">
          <defs><linearGradient id="lc-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${COR.a}" stop-opacity=".16"/><stop offset="1" stop-color="${COR.a}" stop-opacity="0"/></linearGradient></defs>
          ${grid}${xl}
          <path d="${area}" fill="url(#lc-g)"/>
          <path d="${path('acessos')}" fill="none" stroke="${COR.a}" stroke-width="2" stroke-linejoin="round"/>
          <path d="${path('conclusoes')}" fill="none" stroke="${COR.b}" stroke-width="2" stroke-linejoin="round"/>
          <line class="lc-x" x1="0" x2="0" y1="${pt}" y2="${H - pb}" visibility="hidden"/>
          <circle class="lc-a" r="4" fill="${COR.a}" stroke="#fff" stroke-width="2" visibility="hidden"/>
          <circle class="lc-b" r="4" fill="${COR.b}" stroke="#fff" stroke-width="2" visibility="hidden"/>
          <rect class="lc-hit" x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent"/>
        </svg>
      </div>`;
  }

  /* =====================================================================
     TELAS
     ===================================================================== */
  const st = {
    dados: null, filtros: { dias: 28, cidade: '' }, R: null, P: null, menu: false,
    busca: '', status: 'contato', buscaCid: '', ordem: { k: 'ultimo', dir: -1 },
    pag: {}, fModulo: '', fTema: '', fBaixo: false, editPerg: null, fNotaTema: '', fNotaAutor: '', buscaNota: '', fAvalCom: false,
  };
  // Assistente de dúvidas desligado neste ambiente: a seção do chat some do painel
  const CHAT = TREINO.recurso('assistente');

  function telaLogin(msg) {
    root.innerHTML = `
      <main class="lg">
        <form class="lg-card" id="lg-form">
          <img src="../assets/bigou-logo.png" alt="Bigou" width="56" height="56">
          <h1>Painel do Treinamento</h1>
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
          <h1>Painel do Treinamento</h1>
          <p class="lg-err" role="alert">O painel não está configurado: faltam a URL e a chave do Supabase (veja "Ambientes" no README).</p>
        </div>
      </main>`;
  }

  function telaCarregando() {
    root.innerHTML = `
      <div class="hd"><div class="hd-l"><img src="../assets/bigou-logo.png" alt="" width="32" height="32"><div><b>Painel do Treinamento</b><small>Carregando dados…</small></div></div></div>
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
  const card = (titulo, desc, corpo, cls) => `<div class="card ${cls || ''}">${titulo ? `<div class="card-h"><h3>${titulo}</h3>${desc ? `<p>${desc}</p>` : ''}</div>` : ''}${corpo}</div>`;

  // Seção "Dúvidas do chat" (só com o assistente ligado)
  function secDuvidas(R, DV, periodoTxt, f) {
    return sec('duvidas', 'Dúvidas do chat', `Perguntas feitas no assistente ${periodoTxt}${f.cidade ? ` em ${esc(f.cidade)}` : ''}. O assistente fica disponível a qualquer momento.`, `
          <div class="kpis k3">
            ${kpi('olho', 'Perguntas', n(DV.perguntas), `de ${n(DV.lojas)} ${DV.lojas === 1 ? 'loja' : 'lojas'} · ${n(DV.escolhas)} toques em sugestões`, '', 'Perguntas digitadas no chat. Os toques nas perguntas prontas aparecem à parte.')}
            ${kpi('ok', 'Respondidas de primeira', pct(DV.respondidas, DV.perguntas), `${n(DV.sugestao)} com "você quis dizer" · ${n(DV.sem)} sem resposta · ${n(DV.fora)} fora do treinamento`, '', 'Perguntas em que o assistente entendeu o assunto e respondeu direto.')}
            ${kpi('trofeu', 'Ajudou', pct(DV.uteis, DV.avaliacoes), `de ${n(DV.avaliacoes)} ${DV.avaliacoes === 1 ? 'avaliação' : 'avaliações'} 👍👎`, '', 'Respostas marcadas como úteis pelo parceiro.')}
          </div>
          <div class="cols">
            ${card('Assuntos mais perguntados', 'O que as telas ainda não deixam claro.', DV.temas.length ? barras(DV.temas, { valor: (x) => x.n, rotulo: (x) => x.tema, fmt: (x) => n(x.n) }) : '<p class="empty">Nenhuma pergunta no período.</p>')}
            ${card('Sem resposta ou fora do treinamento', 'O que o assistente não soube responder. Use para criar respostas novas, ajustar telas ou criar novos treinamentos.', DV.semResposta.length ? `<ul class="dv">${DV.semResposta.slice(0, 12).map((x) => `<li><span>“${esc(x.texto)}”${x.fora ? ' <em class="dv-fora">fora do treinamento</em>' : ''}</span><small>${x.n > 1 ? `${n(x.n)}× · ` : ''}${relativo(x.ultimo)}</small></li>`).join('')}</ul>${DV.semResposta.length > 12 ? `<p class="note">E mais ${n(DV.semResposta.length - 12)}. Exporte o CSV para ver todas.</p>` : ''}` : '<p class="empty">Todas as perguntas tiveram resposta. 🎉</p>')}
          </div>
          ${DV.naoAjudou.length ? card('Respostas que não ajudaram', 'Marcadas com 👎. Vale reescrever a resposta ou melhorar a tela do assunto.', `<ul class="dv-r">${DV.naoAjudou.slice(0, 6).map((o) => { const x = Bot && Bot.porId(o.id); return `<li><div><b>${esc(x ? x.exemplo : o.id)}</b><small>${esc(x ? x.tema : '')}</small>${o.exemplos.length ? `<span>Perguntaram: ${o.exemplos.map((t) => `“${esc(t)}”`).join(' · ')}</span>` : ''}</div><b class="dv-n">${n(o.nao)} de ${n(o.tot)} 👎</b></li>`; }).join('')}</ul>`) : ''}
          <div class="dv-csv"><button class="btn ic" data-a="csv-duvidas">${IC.baixar}<span>Exportar dúvidas (CSV)</span></button></div>
        `);
  }

  // Avaliação do treinamento: feita antes do certificado
  function avaliacaoCard(AV) {
    if (!AV.n) return card('Avaliação do treinamento', 'Feita ao concluir, antes do certificado.', '<p class="empty">Nenhuma avaliação ainda.</p>');
    const mx = Math.max(1, ...AV.dist.map((d) => d.n));
    return card('Avaliação do treinamento', `${n(AV.n)} ${AV.n === 1 ? 'loja avaliou' : 'lojas avaliaram'} ao concluir, antes do certificado.`, `
      <div class="avl">
        <div class="avl-num">
          <div><b>${pct(AV.ajudou, AV.n)}</b><small>disseram que o treinamento ajudou</small></div>
          <div><b>${AV.media.toFixed(1).replace('.', ',')} <span class="avl-st">★</span></b><small>média das estrelas</small></div>
        </div>
        <div class="avl-dist">${AV.dist.map((d) => `<div class="avl-r"><span>${d.e} ★</span><span class="hb-track"><i style="width:${(d.n / mx) * 100}%;background:#f2b51d"></i></span><b>${n(d.n)}</b></div>`).join('')}</div>
      </div>
      ${AV.comentarios.length ? `<h4 class="avl-h">Comentários</h4><ul class="dv">${AV.comentarios.slice(0, 8).map((a) => `<li><span>“${esc(a.comentario)}”<small class="avl-q">${esc(a.loja)} · ${a.estrelas} ★ · ${a.ajudou ? 'ajudou' : 'não ajudou'}</small></span><small>${relativo(a.t)}</small></li>`).join('')}</ul>` : ''}`);
  }

  /* ------------------------------ Páginas da sidebar ------------------------------ */
  const PAGINAS = [
    { id: 'visao', t: 'Visão geral', ic: 'casa', d: (ctx) => `Lojas que se cadastraram ${ctx.periodoTxt}${ctx.f.cidade ? ` em ${esc(ctx.f.cidade)}` : ''}.` },
    { id: 'jornada', t: 'Jornada', ic: 'rota', d: () => 'Até onde as lojas chegam, módulo por módulo, e onde ficam pelo caminho.' },
    { id: 'passos', t: 'Passo a passo', ic: 'lista', d: () => 'Cada passo de cada módulo: quantas lojas viram, onde saem, o que pulam e quanto tempo levam.' },
    { id: 'assuntos', t: 'Assuntos', ic: 'livro', d: () => `Acerto de primeira por assunto, nas perguntas atuais. Com menos de ${POUCOS} respostas, mostramos "poucos dados".` },
    { id: 'perguntas', t: 'Perguntas', ic: 'pergunta', d: () => 'As 19 perguntas com a distribuição completa das respostas. Toque em Editar para mudar a pergunta e as alternativas.' },
  ].concat(CHAT ? [{ id: 'duvidas', t: 'Dúvidas do chat', ic: 'chat', d: (ctx) => `Perguntas feitas no assistente ${ctx.periodoTxt}.` }] : [], [
    { id: 'lojas', t: 'Lojas', ic: 'loja', d: () => 'Toque em uma loja para ver o que ela errou, a avaliação e as anotações da equipe.' },
    { id: 'anotacoes', t: 'Anotações', ic: 'nota', d: () => 'Tudo o que a equipe registrou sobre as dúvidas dos parceiros.' },
    { id: 'avaliacoes', t: 'Avaliações', ic: 'estrela', d: () => 'O que as lojas acharam do treinamento, respondido antes do certificado.' },
    { id: 'cidades', t: 'Cidades', ic: 'cidade', d: () => 'Desempenho e contatos pendentes por cidade.' },
    { id: 'uso', t: 'Uso', ic: 'grafico', d: () => 'Quando e como o treinamento é usado.' },
    { id: 'exportar', t: 'Exportar', ic: 'baixar', d: () => 'Baixe os dados completos em CSV. Eles são a base para o plano de melhorias.' },
  ]);
  const paginaAtual = () => { const h = location.hash.replace('#', ''); return PAGINAS.some((p) => p.id === h) ? h : 'visao'; };

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

  function render() {
    const f = st.filtros;
    const R = (st.R = calcular(st.dados, f));
    const P = (st.P = f.dias ? calcular(st.dados, Object.assign({}, f, { ate: Date.now() - f.dias * DIA })) : null);
    const pg = paginaAtual();
    const ctx = { R, P, f, periodoTxt: f.dias ? `nos últimos ${f.dias} dias` : 'desde o início' };
    const cont = { lojas: R.sit.contato, anotacoes: (st.dados.anotacoes || []).filter((a) => R.lojas.some((s) => s.p.id === a.participante_id)).length, avaliacoes: R.avaliacao.n };
    const cidadesOpc = [...new Set(st.dados.participantes.map((p) => p.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const atual = PAGINAS.find((p) => p.id === pg);

    root.innerHTML = `
      <div class="painel ${st.menu ? 'menu-on' : ''}">
        <aside class="sb" aria-label="Menu do painel">
          <div class="sb-logo"><img src="../assets/bigou-logo.png" alt="Bigou" width="34" height="34"><div><b>Painel do Treinamento</b><small>Treinamento Financeiro</small></div></div>
          <nav class="sb-nav">${PAGINAS.map((p) => `<a href="#${p.id}" class="${p.id === pg ? 'on' : ''}" ${p.id === pg ? 'aria-current="page"' : ''}>${IC[p.ic] || ''}<span>${p.t}</span>${cont[p.id] ? `<em class="${p.id === 'lojas' ? 'w' : ''}">${n(cont[p.id])}</em>` : ''}</a>`).join('')}</nav>
          <div class="sb-pe">
            <button class="sb-a" data-a="atualizar">${IC.atualizar}<span>Atualizar dados</span></button>
            <button class="sb-a" data-a="sair">${IC.sair}<span>Sair</span></button>
          </div>
        </aside>
        <div class="sb-scrim" data-a="menu"></div>
        <div class="painel-main">
          <header class="ph">
            <button class="sb-btn" data-a="menu" aria-label="Abrir menu">${IC.menu}</button>
            <div class="ph-t"><h1>${atual.t}</h1><p>${atual.d(ctx)}</p></div>
            <div class="flt" role="group" aria-label="Filtros">
              <label><span>Cadastradas</span><select data-f="dias">
                ${[[7, 'Últimos 7 dias'], [14, 'Últimos 14 dias'], [28, 'Últimos 28 dias'], [0, 'Todo o período']].map(([v, t]) => `<option value="${v}" ${+f.dias === v ? 'selected' : ''}>${t}</option>`).join('')}
              </select></label>
              <label><span>Cidade</span><select data-f="cidade"><option value="">Todas as cidades</option>${cidadesOpc.map((c) => `<option ${f.cidade === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
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
    const acoes = [
      SI.contato && ['parado', 'lojas', `<b>${plural(SI.contato, 'loja precisa', 'lojas precisam')} de contato</b>: ${[SI.parada && `${n(SI.parada)} paradas há ${PARADA_DIAS}+ dias`, SI.naocomecou && `${n(SI.naocomecou)} não começaram`, SI.semcert && `${n(SI.semcert)} concluíram sem certificado`].filter(Boolean).join(', ')}.`, 'Ver lojas'],
      pior && ['critico', 'assuntos', `<b>Reforçar no atendimento: ${esc(pior.tema)}.</b> Só ${pct(pior.ok, pior.tot)} acertam de primeira.`, 'Ver assunto'],
      CHAT && R.duvidas.sem + R.duvidas.fora >= 5 && ['olho', 'duvidas', `<b>${n(R.duvidas.sem + R.duvidas.fora)} dúvidas no chat sem resposta.</b>`, 'Ver dúvidas'],
      pa && ['alerta', 'jornada', `<b>Mais lojas param no Módulo ${pa.m}</b> (${esc(tituloMod(pa.m))}): ${plural(pa.pararam, 'loja', 'lojas')}.`, 'Ver jornada'],
    ].filter(Boolean);
    return `
      <div class="kpis k4">
        ${kpi('loja', 'Cadastradas', n(K.cadastradas), '', dl('cadastradas'), 'Lojas que preencheram o nome e a cidade no período.')}
        ${kpi('play', 'Começaram', n(K.comecaram), `${pct(K.comecaram, K.cadastradas)} das cadastradas`, dl('comecaram'), 'Lojas que abriram pelo menos um módulo.')}
        ${kpi('trofeu', 'Concluíram', n(K.concluiram), `${pct(K.concluiram, K.comecaram)} de quem começou`, dl('concluiram'), `Lojas que concluíram os ${NMOD} módulos.`)}
        ${kpi('ok', 'Certificadas', n(K.certificadas), `${pct(K.certificadas, K.concluiram)} de quem concluiu`, dl('certificadas'), 'Viram todo o conteúdo e acertaram mais de 70% das perguntas.', 'hl')}
      </div>
      <div class="cols">
        ${card('Saúde do treinamento', '', `<div class="status">
          <div class="status-l"><span class="saude ${sd.cls}">${sd.ic}${sd.rot}</span><span>${deCada10 == null ? 'Ainda não há lojas que começaram o treinamento.' : `De cada 10 lojas que começam, <b>${deCada10}</b> ${deCada10 === 1 ? 'termina' : 'terminam'}.`}${KP && KP.taxa != null && K.taxa != null && KP.comecaram >= POUCOS ? ` <small>No período anterior: ${Math.round(KP.taxa * 10)} de 10.</small>` : ''}</span></div>
          ${R.avaliacao.n ? `<div class="status-l"><span class="estrela">★</span><span><b>${R.avaliacao.media.toFixed(1).replace('.', ',')}</b> de média · <b>${pct(R.avaliacao.ajudou, R.avaliacao.n)}</b> disseram que ajudou <small>(${plural(R.avaliacao.n, 'avaliação', 'avaliações')})</small></span></div>` : '<div class="status-l"><span class="estrela">★</span><span>Nenhuma avaliação ainda.</span></div>'}
          <div class="status-l"><span class="ic-st">${IC.tempo}</span><span>Tempo mediano para concluir: <b>${dur(R.uso.tempoAtivo)}</b> <small>de tela, ${dias(R.uso.tempoCal)}</small></span></div>
        </div>`)}
        ${card('O que fazer agora', '', acoes.length ? `<ul class="ac">${acoes.map(([i, s, t, l]) => `<li><span class="ac-ic ${i}">${IC[i]}</span><span class="ac-t">${t}</span><a href="#${s}" class="ac-a">${l} →</a></li>`).join('')}</ul>` : '<p class="empty">Nada urgente por aqui. 🎉</p>', 'ac-card')}
      </div>
      ${card('Jornada', 'Passe o mouse ou toque em cada etapa para ver os detalhes.', jornadaVisual(R))}`;
  };

  /* Jornada */
  PG.jornada = ({ R }) => `
    ${card('Até onde chegam', '', jornadaVisual(R))}
    ${card('Por módulo', 'Os 10 módulos, na ordem do treinamento.', `<div class="tb-wrap"><table class="tb"><thead><tr><th>Módulo</th><th class="num">Iniciaram</th><th class="num">Concluíram</th><th>Conclusão</th><th class="num">Pararam aqui</th><th class="num">Tempo mediano</th><th>Passo onde mais saem</th></tr></thead>
      <tbody>${R.modulos.map((x) => `<tr><td><b>M${x.m}</b> ${esc(x.titulo)}</td><td class="num">${n(x.ini)}</td><td class="num">${n(x.fim)}</td>
        <td>${x.taxa == null ? '—' : `<span class="inl"><i style="width:${Math.round(x.taxa * 100)}%"></i></span>${pct(x.fim, x.ini)}`}</td>
        <td class="num">${x.pararam ? `<b class="ct">${n(x.pararam)}</b>` : '<span class="mut">0</span>'}</td><td class="num">${dur(x.tempo)}</td>
        <td>${x.passoSai ? `${esc(tituloPasso(x.m, x.passoSai.p))} <small class="mut">(${n(x.passoSai.c)})</small>` : '<span class="mut">—</span>'}</td></tr>`).join('')}</tbody></table></div>`)}
    ${card('Onde param', 'Módulos em que lojas em andamento pararam e ainda não voltaram.', paradasVisual(R))}`;

  /* Passo a passo */
  TABELAS.passos = () => {
    const rows = st.R.passos.filter((x) => !st.fModulo || x.m === +st.fModulo);
    const mxSai = Math.max(1, ...rows.map((x) => x.sairam));
    const { itens, ctrl } = paginar('passos', rows);
    return itens.length ? `<div class="tb-wrap"><table class="tb"><thead><tr><th>Módulo</th><th>Passo</th><th>Tipo</th><th class="num">Viram</th><th>Saíram aqui</th><th class="num">Pularam</th><th class="num">Tempo mediano</th></tr></thead>
      <tbody>${itens.map((x) => `<tr><td>M${x.m}</td><td><small class="mut">${x.p}.</small> ${esc(x.titulo)}</td><td><span class="tag ${x.tipo === 'Pergunta' ? '' : 'cinza'}">${x.tipo}</span></td>
        <td class="num">${n(x.viram)}</td>
        <td>${x.sairam ? `<span class="inl o"><i style="width:${(x.sairam / mxSai) * 100}%"></i></span><b class="ct">${n(x.sairam)}</b> <small class="mut">${pct(x.sairam, x.viram)}</small>` : '<span class="mut">0</span>'}</td>
        <td class="num">${x.pulos ? n(x.pulos) : '<span class="mut">0</span>'}</td>
        <td class="num">${x.amostra >= 3 ? dur(x.tempo) : '<span class="mut">poucos dados</span>'}</td></tr>`).join('')}</tbody></table></div>${ctrl}` : '<p class="empty">Nenhum passo com esse filtro.</p>';
  };
  PG.passos = () => card('', '', `
    <div class="tb-top"><label class="sel"><span>Módulo</span><select data-loc="fModulo"><option value="">Todos os módulos</option>${MODS.map((m) => `<option value="${m.n}" ${+st.fModulo === m.n ? 'selected' : ''}>M${m.n} · ${esc(m.titulo)}</option>`).join('')}</select></label></div>
    <div id="t-passos">${TABELAS.passos()}</div>`);

  /* Assuntos */
  PG.assuntos = ({ R }) => card('', '', assuntosVisual(R));

  /* Perguntas: distribuição completa por alternativa */
  PG.perguntas = ({ R }) => {
    const temasQ = [...new Set(R.perguntas.map((q) => q.tema))];
    const lista = R.perguntas.filter((q) => (!st.fTema || q.tema === st.fTema) && (!st.fBaixo || (q.taxa != null && q.taxa < 0.6)));
    const dist = (ops, tot) => `<ul class="pq-ops">${ops.map((o) => `<li class="${o.ok ? 'ok' : ''}"><span class="pq-t">${o.ok ? '<i aria-label="Correta">✔</i>' : ''}${esc(o.t)}</span><span class="pq-bar"><i style="width:${tot ? (o.n / tot) * 100 : 0}%"></i></span><b>${n(o.n)}<small>${tot ? pct(o.n, tot) : ''}</small></b></li>`).join('')}</ul>`;
    return `
      <div class="tb-top">
        <label class="sel"><span>Assunto</span><select data-loc="fTema"><option value="">Todos</option>${temasQ.map((t) => `<option ${st.fTema === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
        <label class="chk"><input type="checkbox" data-loc="fBaixo" ${st.fBaixo ? 'checked' : ''}> Só com acerto abaixo de 60%</label>
      </div>
      ${Perg.semTabela ? '<p class="fx-aviso">Para editar as perguntas, aplique no Supabase a migração <b>20261021120000_perguntas_editaveis.sql</b>.</p>' : ''}
      <div class="pq">${lista.map((q) => { const nv = nivel(q.taxa, q.tot); return st.editPerg === q.id ? formPergunta(q) : `
        <article class="card pq-c nv-${nv}">
          <header class="pq-h"><span class="pq-id">${q.id}</span><small>${esc(q.onde)} · ${esc(q.tema)}</small><em class="nv nv-${nv}">${ROT_NIVEL[nv]}</em></header>
          <h3>${esc(q.q)}</h3>
          ${dist(q.opcoes, q.tot)}
          <footer class="pq-f">
            <span><b>${q.tot ? pct(q.ok, q.tot) : '—'}</b> acertam de primeira <small>(${plural(q.tot, 'resposta', 'respostas')})</small></span>
            <span>${q.tentativas ? `<b>${q.tentativas.toFixed(1).replace('.', ',')}</b> tentativas, em média, até acertar` : ''}</span>
          </footer>
          <div class="pq-ed"><small>${q.editada ? `Editada${q.editada.autor ? ` por ${esc(q.editada.autor)}` : ''}${q.editada.em ? ` em ${dataHoraBR(+new Date(q.editada.em))}` : ''}` : 'Texto original'}</small>${Perg.semTabela ? '' : `<button type="button" class="btn" data-pq="editar" data-id="${esc(q.id)}">Editar</button>`}</div>
        </article>`; }).join('') || '<p class="empty">Nenhuma pergunta com esse filtro.</p>'}</div>`;
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

  PG.duvidas = ({ R, periodoTxt, f }) => secDuvidas(R, R.duvidas, periodoTxt, f);

  /* Lojas */
  PG.lojas = ({ R }) => {
    const SI = R.sit;
    const contagem = { contato: SI.contato, parada: SI.parada, naocomecou: SI.naocomecou, semcert: SI.semcert, andamento: SI.andamento + SI.recente, certificada: SI.certificada, reincidente: SI.reincidente, notas: R.lojas.filter((x) => x.notas.length).length, todas: R.lojas.length };
    return card('', '', `
      <div class="lj-top">
        <div class="chips" role="group" aria-label="Situação">${[['contato', 'Precisam de contato'], ['parada', 'Paradas'], ['naocomecou', 'Não começaram'], ['semcert', 'Sem certificado'], ['andamento', 'Em andamento'], ['certificada', 'Certificadas'], ['reincidente', 'Certificadas após refazer'], ['notas', 'Com anotações'], ['todas', 'Todas']].map(([k, t]) => `<button class="chip ${k === 'contato' ? 'warn' : ''} ${st.status === k ? 'on' : ''}" data-st="${k}" aria-pressed="${st.status === k}">${t}<em>${n(contagem[k])}</em></button>`).join('')}</div>
        <div class="lj-act"><input type="search" class="busca" id="lj-busca" placeholder="Buscar loja ou cidade" value="${esc(st.busca)}"></div>
      </div>
      <div id="t-lojas">${TABELAS.lojas()}</div>`);
  };

  /* Anotações */
  TABELAS.anotacoes = () => {
    const lojaDe = new Map(st.R.lojas.map((s) => [s.p.id, s]));
    const b = st.buscaNota.trim().toLowerCase();
    const rows = (st.dados.anotacoes || []).filter((a) => lojaDe.has(a.participante_id))
      .filter((a) => (!st.fNotaTema || a.assunto === st.fNotaTema) && (!st.fNotaAutor || a.autor === st.fNotaAutor) && (!b || (a.texto + ' ' + lojaDe.get(a.participante_id).p.loja).toLowerCase().includes(b)))
      .sort((x, y) => +new Date(y.criado_em) - +new Date(x.criado_em));
    const { itens, ctrl } = paginar('anotacoes', rows);
    return itens.length ? `<ul class="nt-l">${itens.map((a) => { const s = lojaDe.get(a.participante_id); return `
      <li class="nt-i">
        <div class="nt-h"><button class="lnk loja" data-ficha="${esc(s.p.id)}">${esc(s.p.loja)}</button><small>${esc(s.p.cidade)}</small><span class="tag">${esc(a.assunto || 'Outro')}</span></div>
        <p>${esc(a.texto)}</p>
        <div class="nt-f"><small>${esc(a.autor || 'Equipe')} · ${dataHoraBR(+new Date(a.criado_em))}${a.atualizado_em ? ' · editada' : ''}</small>
          <span><button class="lnk" data-ficha="${esc(s.p.id)}" data-editar="${esc(a.id)}">Editar</button><button class="lnk del" data-excluir="${esc(a.id)}">Excluir</button></span></div>
      </li>`; }).join('')}</ul>${ctrl}` : `<p class="empty">${(st.dados.anotacoes || []).length ? 'Nenhuma anotação com esse filtro.' : 'Nenhuma anotação ainda. Abra uma loja em "Lojas" para anotar.'}</p>`;
  };
  PG.anotacoes = () => {
    const todas = st.dados.anotacoes || [];
    const autores = [...new Set(todas.map((a) => a.autor).filter(Boolean))].sort();
    const porTema = {}; todas.forEach((a) => { porTema[a.assunto || 'Outro'] = (porTema[a.assunto || 'Outro'] || 0) + 1; });
    return `
      ${Notas.semTabela ? '<p class="fx-aviso">Para salvar anotações, aplique no Supabase as migrações de <b>supabase/migrations</b>.</p>' : ''}
      ${Object.keys(porTema).length ? card('Por assunto', '', barras(Object.entries(porTema).map(([tema, c]) => ({ tema, c })).sort((a, b) => b.c - a.c), { valor: (x) => x.c, rotulo: (x) => x.tema, fmt: (x) => n(x.c) })) : ''}
      ${card('', '', `
        <div class="tb-top">
          <label class="sel"><span>Assunto</span><select data-loc="fNotaTema"><option value="">Todos</option>${ASSUNTOS_NOTA.map((t) => `<option ${st.fNotaTema === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
          <label class="sel"><span>Autor</span><select data-loc="fNotaAutor"><option value="">Todos</option>${autores.map((t) => `<option ${st.fNotaAutor === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
          <input type="search" class="busca" id="nt-busca" placeholder="Buscar no texto ou na loja" value="${esc(st.buscaNota)}">
        </div>
        <div id="t-anotacoes">${TABELAS.anotacoes()}</div>`)}`;
  };

  /* Avaliações */
  TABELAS.avaliacoes = () => {
    const rows = st.R.lojas.filter((s) => s.aval && (!st.fAvalCom || s.aval.comentario)).sort((a, b) => b.aval.t - a.aval.t);
    const { itens, ctrl } = paginar('avaliacoes', rows);
    return itens.length ? `<div class="tb-wrap"><table class="tb"><thead><tr><th>Loja</th><th>Estrelas</th><th>Ajudou?</th><th>Comentário</th><th>Data</th></tr></thead>
      <tbody>${itens.map((s) => `<tr class="lj-row" data-loja="${esc(s.p.id)}" tabindex="0"><td><b class="lj-n">${esc(s.p.loja)}</b><small class="lj-c">${esc(s.p.cidade)}</small></td>
        <td><span class="estrelas">${'★'.repeat(s.aval.estrelas || 0)}<i>${'★'.repeat(5 - (s.aval.estrelas || 0))}</i></span></td>
        <td>${s.aval.ajudou ? '<span class="badge ok">Sim</span>' : '<span class="badge bad">Não</span>'}</td>
        <td class="cm">${s.aval.comentario ? esc(s.aval.comentario) : '<span class="mut">—</span>'}</td><td>${dataHoraBR(s.aval.t)}</td></tr>`).join('')}</tbody></table></div>${ctrl}` : '<p class="empty">Nenhuma avaliação com esse filtro.</p>';
  };
  PG.avaliacoes = ({ R }) => `
    ${avaliacaoCard(Object.assign({}, R.avaliacao, { comentarios: [] }))}
    ${card('Todas as avaliações', '', `<div class="tb-top"><label class="chk"><input type="checkbox" data-loc="fAvalCom" ${st.fAvalCom ? 'checked' : ''}> Só com comentário</label></div><div id="t-avaliacoes">${TABELAS.avaliacoes()}</div>`)}`;

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

  /* Uso */
  PG.uso = ({ R }) => {
    const K = R.kpi;
    return `
      <div class="kpis k4">
        ${kpi('tempo', 'Tempo para concluir', dur(R.uso.tempoAtivo), `de tela · ${dias(R.uso.tempoCal)}`, '', 'Mediana de quem concluiu: tempo de tela somado e dias entre o primeiro e o último módulo.')}
        ${kpi('olho', 'Acessos', n(R.uso.acessos), 'vezes que o treinamento foi aberto', '', 'Inclui visitantes que ainda não se cadastraram, quando não há filtro de cidade.')}
        ${kpi('loja', 'No celular', pct(R.uso.celular, K.cadastradas), 'das cadastradas', '', 'Lojas que fizeram o treinamento pelo celular.')}
        ${kpi('raio', 'Usaram a narração', pct(R.uso.voz, K.cadastradas), 'das cadastradas', '', 'Lojas que ligaram a narração por voz.')}
      </div>
      ${card('Acessos e conclusões por dia', 'Passe o dedo ou o mouse sobre o gráfico para ver cada dia.', '<div id="linha"></div>')}
      <div class="cols">
        ${card('Quando acessam', 'Acessos por dia da semana e hora.', graficoCalor(R))}
        ${card('Perfil', '', `<div class="pf">${perfilBloco('Aparelho', R.perfil.dispositivo, K.cadastradas)}${perfilBloco('Navegador', R.perfil.navegador, K.cadastradas)}${perfilBloco('Dicas mais abertas', R.perfil.dicas, 0, true)}</div>`)}
      </div>`;
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
    parada: ['Parada', 'bad'], naocomecou: ['Não começou', 'off'], semcert: ['Sem certificado', 'warn'],
    andamento: ['Em andamento', 'info'], recente: ['Recém-cadastrada', 'info'], certificada: ['Certificada', 'ok'],
  };
  function linhasLojas() {
    const b = st.busca.trim().toLowerCase();
    const filtro = (s) => st.status === 'todas' || (st.status === 'contato' ? s.contato : st.status === 'notas' ? s.notas.length > 0 : st.status === 'reincidente' ? s.reincidente : st.status === 'andamento' ? s.sit === 'andamento' || s.sit === 'recente' : s.sit === st.status);
    const rows = st.R.lojas.filter((s) => filtro(s) && (!b || s.p.loja.toLowerCase().includes(b) || s.p.cidade.toLowerCase().includes(b)));
    const k = st.ordem.k, d = st.ordem.dir;
    const val = (s) => (k === 'loja' ? s.p.loja : k === 'prog' ? s.fim.size : k === 'sit' ? SIT[s.sit][0] : k === 'erros' ? s.erros.length : k === 'notas' ? s.notas.length : k === 'tempo' ? s.tempoTotal : k === 'concl' ? s.concluiuEm || 0 : s.ultimo);
    return rows.sort((a, c) => { const x = val(a), y = val(c); return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * d; });
  }

  TABELAS.lojas = () => {
    const { itens, ctrl } = paginar('lojas', linhasLojas());
    const th = (k, t, num) => `<th class="${num ? 'num ' : ''}sort" data-k="${k}" aria-sort="${st.ordem.k === k ? (st.ordem.dir > 0 ? 'ascending' : 'descending') : 'none'}">${t}</th>`;
    return itens.length ? `<div class="tb-wrap"><table class="tb tb-lojas"><thead><tr>${th('loja', 'Loja')}${th('prog', 'Progresso')}${th('sit', 'Situação')}${th('erros', 'Dúvidas', true)}${th('notas', 'Anotações', true)}${th('tempo', 'Tempo de tela', true)}${th('concl', 'Concluiu em')}${th('ultimo', 'Último acesso')}</tr></thead>
      <tbody>${itens.map((s) => `<tr class="lj-row" data-loja="${esc(s.p.id)}" tabindex="0" aria-label="Abrir a ficha de ${esc(s.p.loja)}">
        <td><b class="lj-n">${esc(s.p.loja)}</b><small class="lj-c">${esc(s.p.cidade)}</small></td>
        <td><span class="pg-mini"><i style="width:${(s.fim.size / NMOD) * 100}%"></i></span>${s.fim.size}/${NMOD}</td>
        <td class="sit"><span class="badge ${SIT[s.sit][1]}">${SIT[s.sit][0]}</span>${s.reincidente ? ' <span class="badge warn" title="Só passou de 70% depois de refazer as perguntas que errou">Reincidente</span>' : ''}<small>${esc(s.motivo)}</small></td>
        <td class="num">${s.erros.length ? `<b class="ct">${n(s.erros.length)}</b>` : '<span class="mut">0</span>'}</td>
        <td class="num">${s.notas.length ? `<span class="nt">${n(s.notas.length)}</span>` : '<span class="mut">—</span>'}</td>
        <td class="num">${s.tempoTotal ? dur(s.tempoTotal) : '<span class="mut">—</span>'}</td>
        <td>${s.concluiuEm ? dataBR(s.concluiuEm) : '<span class="mut">—</span>'}</td>
        <td title="${dataHoraBR(s.ultimo)}">${relativo(s.ultimo)}</td></tr>`).join('')}</tbody></table></div>${ctrl}` : `<p class="empty">${st.status === 'contato' ? 'Nenhuma loja precisa de contato agora. 🎉' : 'Nenhuma loja com esse filtro.'}</p>`;
  };
  const desenharLojas = () => redesenhar('lojas');

  /* ------------------------------ Ficha da loja ------------------------------ */
  const ASSUNTOS_NOTA = [...new Set(MODS.flatMap((m) => m.steps.filter((x) => x.tema).map((x) => x.tema)))].concat(['Plataforma', 'Atendimento', 'Outro']);
  const autorSalvo = () => { try { return localStorage.getItem('bigou-admin-autor') || ''; } catch (e) { return ''; } };
  const fx = document.createElement('div');
  fx.className = 'fx-wrap';
  fx.hidden = true;
  document.body.appendChild(fx);
  let fxId = null, fxEditando = null;

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
          <div><h2 id="fx-t">${esc(s.p.loja)}</h2><small>${esc(s.p.cidade)} · cadastrada ${relativo(+new Date(s.p.criado_em))} · último acesso ${relativo(s.ultimo)}</small></div>
          <button type="button" class="fx-x" data-fx="fechar" aria-label="Fechar">✕</button>
        </header>
        <div class="fx-b">
          <div class="fx-sit"><span class="badge ${SIT[s.sit][1]}">${SIT[s.sit][0]}</span>${s.reincidente ? '<span class="badge warn">Reincidente</span>' : ''}<span>${esc(s.motivo)}</span></div>

          <section class="fx-s">
            <h3>Progresso</h3>
            <ol class="fx-dots">${dots}</ol>
            <div class="fx-nums">
              <div><b>${s.fim.size}/${NMOD}</b><small>módulos concluídos</small></div>
              <div><b>${acerto == null ? '—' : acerto + '%'}</b><small>${s.respondidas ? `acerto de primeira (${s.certas} de ${s.respondidas})` : 'ainda sem respostas'}</small></div>
              <div><b>${s.certificada ? (s.reincidente ? 'Sim, refazendo' : 'Sim') : 'Não'}</b><small>${s.reincidente ? `certificada · na 1ª vez acertou ${Math.round(s.notaPrimeira * 100)}%` : 'certificada'}</small></div>
            </div>
          </section>

          <section class="fx-s">
            <h3>Dúvidas nas perguntas <small>${plural(s.erros.length, 'erro', 'erros')} na 1ª tentativa</small></h3>
            ${s.erros.length ? `<ul class="fx-erros">${s.erros.sort((a, b) => b.t - a.t).map((x) => `
              <li><span class="tag">${esc(x.tema)}</span>
                <b>${esc(x.q)}</b>${x.resposta ? `<span>Respondeu: “${esc(semValor(x.resposta))}”</span>` : ''}</li>`).join('')}</ul>` : '<p class="empty">Nenhum erro registrado.</p>'}
          </section>

          <section class="fx-s">
            <h3>Avaliação do treinamento</h3>
            ${s.aval ? `<div class="fx-av"><span class="estrelas" aria-label="${esc(s.aval.estrelas)} de 5 estrelas">${'★'.repeat(s.aval.estrelas || 0)}<i>${'★'.repeat(5 - (s.aval.estrelas || 0))}</i></span><span>${s.aval.ajudou ? 'Disse que o treinamento ajudou' : 'Disse que o treinamento não ajudou'}</span></div>${s.aval.comentario ? `<blockquote>“${esc(s.aval.comentario)}”</blockquote>` : ''}` : '<p class="empty">Ainda não avaliou.</p>'}
          </section>

          <section class="fx-s">
            <h3>Anotações da equipe <small>${plural(s.notas.length, 'anotação', 'anotações')}</small></h3>
            ${Notas.semTabela ? '<p class="fx-aviso">Para salvar anotações, aplique no Supabase as migrações de <b>supabase/migrations</b>.</p>' : ''}
            ${fxEditando ? '' : form(null)}
            ${s.notas.length ? `<ul class="fx-notas">${anot}</ul>` : ''}
          </section>
        </div>
      </aside>`;
    if (fx.hidden) { fx.hidden = false; document.body.classList.add('fx-on'); requestAnimationFrame(() => fx.classList.add('in')); fx.querySelector('.fx-x').focus(); }
  }

  function fecharFicha() {
    fxId = null; fxEditando = null;
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
      fxEditando = null;
      atualizarDepois(fxId);
    } catch (err) {
      erro.textContent = err.message;
      bt.disabled = false; bt.textContent = 'Tentar de novo';
      if (err.auth) { sessao.sair(); }
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !fx.hidden) fecharFicha(); });

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
    const cab = ['Loja', 'Cidade', 'Módulos concluídos', 'Situação', 'Reincidente', 'Acerto na 1ª vez', 'Perguntas refeitas', 'Motivo', 'Acerto (das respondidas)', 'Dúvidas (erros)', 'Assunto com mais erro', 'Anotações', 'Ajudou', 'Estrelas', 'Comentário', 'Último acesso', 'Cadastro', 'Aparelho'];
    const linhas = linhasLojas().map((s) => [s.p.loja, s.p.cidade, `${s.fim.size}/${NMOD}`, SIT[s.sit][0], s.reincidente ? 'Sim' : 'Não', s.respondidas ? `${Math.round(s.notaPrimeira * 100)}%` : '', s.refeitas.size, s.motivo, s.respondidas ? `${Math.round((s.certas / s.respondidas) * 100)}% (${s.certas} de ${s.respondidas})` : '', s.erros.length, s.erroTema || '', s.notas.length, s.aval ? (s.aval.ajudou ? 'Sim' : 'Não') : '', s.aval ? s.aval.estrelas : '', s.aval ? s.aval.comentario || '' : '', dataHoraBR(s.ultimo), dataHoraBR(s.p.criado_em), s.p.dispositivo]);
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
  window.addEventListener('hashchange', () => { if (!st.dados) return; st.menu = false; render(); window.scrollTo(0, 0); });
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
    const alvo = { 'lj-busca': ['busca', 'lojas'], 'cid-busca': ['buscaCid', 'cidades'], 'nt-busca': ['buscaNota', 'anotacoes'] }[e.target.id];
    if (alvo) { st[alvo[0]] = e.target.value; st.pag[alvo[1]] = 1; redesenhar(alvo[1]); }
  });
  const ACOES = { csv: () => exportarCSV(), 'csv-duvidas': () => exportarDuvidas(), 'csv-plano': () => exportarPlano(), 'csv-perguntas': exportarPerguntas, 'csv-passos': exportarPassos, 'csv-modulos': exportarModulos, 'csv-avaliacoes': exportarAvaliacoes, 'csv-cidades': exportarCidades };
  root.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-a]');
    if (a) {
      const x = a.dataset.a;
      if (x === 'atualizar') iniciar();
      else if (x === 'sair') { sessao.sair(); telaLogin(); }
      else if (x === 'menu') { st.menu = !st.menu; document.querySelector('.painel').classList.toggle('menu-on', st.menu); }
      else if (ACOES[x]) ACOES[x]();
      return;
    }
    const pb = e.target.closest('[data-pgn] [data-ir]');
    if (pb) {
      const ch = pb.closest('[data-pgn]').dataset.pgn;
      st.pag[ch] = +pb.dataset.ir;
      redesenhar(ch);
      const el = document.getElementById('t-' + ch);
      if (el && el.getBoundingClientRect().top < 0) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90 });
      return;
    }
    const chip = e.target.closest('[data-st]');
    if (chip) {
      st.status = chip.dataset.st; st.pag.lojas = 1;
      document.querySelectorAll('[data-st]').forEach((c) => { const on = c.dataset.st === st.status; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      desenharLojas();
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
    if (fi) { fxEditando = fi.dataset.editar || null; abrirFicha(fi.dataset.ficha); return; }
    const ex = e.target.closest('[data-excluir]');
    if (ex) {
      if (!confirm('Excluir esta anotação? Essa ação não pode ser desfeita.')) return;
      try { await Notas.excluir(ex.dataset.excluir); const y = scrollY; render(); scrollTo(0, y); } catch (err) { alert(err.message); }
      return;
    }
    const row = e.target.closest('.lj-row');
    if (row) { abrirFicha(row.dataset.loja); return; }
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
  root.addEventListener('mousemove', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el) return mostrarTip(el.dataset.tip, e.clientX, e.clientY);
    const hit = e.target.closest('.lc-hit');
    if (hit) return linhaHover(hit, e.clientX);
    esconderTip();
    limparLinha();
  });
  root.addEventListener('focusin', (e) => { const el = e.target.closest('[data-tip]'); if (el) { const r = el.getBoundingClientRect(); mostrarTip(el.dataset.tip, r.left + r.width / 2, r.top); } });
  root.addEventListener('focusout', esconderTip);
  root.addEventListener('keydown', (e) => { const row = e.target.closest && e.target.closest('.lj-row'); if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirFicha(row.dataset.loja); } });
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
    mostrarTip(`<b>${new Date(S[i][0]).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</b><br><i class="sw" style="background:${COR.a}"></i>Acessos: ${n(S[i][1])}<br><i class="sw" style="background:${COR.b}"></i>Concluídos: ${n(S[i][2])}`, r.left + X / sx, r.top + Y(Math.max(S[i][1], S[i][2])) / sx);
  }
  function limparLinha() { document.querySelectorAll('.lc-x,.lc-a,.lc-b').forEach((el) => el.setAttribute('visibility', 'hidden')); }

  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (st.R) desenharLinha(); }, 150); });

  // Exposto para testes
  window.ADMIN = { calcular, estado: st, abrirFicha, MODS };
  iniciar();
})();
