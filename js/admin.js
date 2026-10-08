/* =========================================================================
   PAINEL ADMIN — analytics do treinamento
   - Real: login (senha do usuário admin do Supabase) e leitura das tabelas.
   - Demonstração: sem configuração, ou com ?demo=1, gera dados simulados
     fixos (mesma estrutura do banco) para avaliar o painel.
   Todos os números são calculados no navegador por calcular(dados, filtros).
   ========================================================================= */
(function () {
  const CFG = window.TREINO_ANALYTICS || {};
  const root = document.getElementById('adm');
  const tip = document.getElementById('adm-tip');
  const DIA = 864e5;
  const COR = { a: '#2a78d6', b: '#eb6834' };            // validados (dataviz): série 1 e 2

  const demo = /[?&]demo=1/.test(location.search) || !(CFG.url && CFG.anonKey && CFG.adminEmail);

  /* ------------------------------ Metadados do treinamento ------------------------------ */
  const MODS = TREINO.buildModules(TREINO.calc(TREINO.dados));
  const NMOD = MODS.length;
  const tituloMod = (m) => (MODS[m - 1] ? MODS[m - 1].titulo : 'Módulo ' + m);
  const passoDe = (m, p) => MODS[m - 1] && MODS[m - 1].steps[p - 1];
  const tituloPasso = (m, p) => { const s = passoDe(m, p); return s ? (s.desafio ? 'Desafio rápido' : s.title) : 'Passo ' + p; };
  const semValor = (t) => String(t || '').replace(/R\$[\d.,]+/g, 'R$…');
  const NPERG = MODS.reduce((t, m) => t + m.steps.filter((x) => x.mode === 'quiz').length, 0);
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

  /* =====================================================================
     DADOS DE DEMONSTRAÇÃO (fixos, mesma estrutura do banco)
     ===================================================================== */
  function gerarDemo() {
    let seed = 20261005;
    const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const uid = () => 'demo-' + Math.floor(rnd() * 1e12).toString(36) + Math.floor(rnd() * 1e6).toString(36);
    const agora = Date.now();
    const grandes = ['Muriaé - MG', 'Ubá - MG', 'Viçosa - MG', 'Rio Pomba - MG', 'Cataguases - MG', 'Ponte Nova - MG'];
    // Algumas cidades ficam sem lojas de propósito (para a lista "sem cadastro"); as grandes nunca
    const pesoCid = TREINO.cidades.map((c, i) => (grandes.includes(c) ? 14 + Math.floor(rnd() * 6) : i % 7 === 0 ? 0 : 1 + Math.floor(rnd() * 6)));
    const totPeso = pesoCid.reduce((a, b) => a + b, 0);
    const cidade = () => { let r = rnd() * totPeso; for (let i = 0; i < pesoCid.length; i++) { r -= pesoCid[i]; if (r <= 0) return TREINO.cidades[i]; } return TREINO.cidades[0]; };
    const tipos = ['Lanchonete', 'Pizzaria', 'Restaurante', 'Hamburgueria', 'Açaí', 'Padaria', 'Sorveteria', 'Pastelaria', 'Marmitaria', 'Doceria', 'Espetinho', 'Cafeteria'];
    const nomes = ['da Ana', 'do Zé', 'Sabor & Cia', 'Bom Gosto', 'da Praça', 'Central', 'Delícia', 'do Bairro', 'Primavera', 'Estrela', 'Família', 'Dona Maria', 'Point', 'Express', 'da Esquina'];
    const hora = () => { const r = rnd(); return r < 0.4 ? 9 + Math.floor(rnd() * 3) : r < 0.8 ? 14 + Math.floor(rnd() * 4) : 7 + Math.floor(rnd() * 15); };
    const quando = (base) => { const d = new Date(base); d.setHours(hora(), Math.floor(rnd() * 60), Math.floor(rnd() * 60)); return d.getTime(); };

    const continua = [0.94, 0.93, 0.92, 0.82, 0.89, 0.78, 0.9, 0.8, 0.85, 0.92];   // chance de concluir cada módulo
    const gargaloPasso = { 4: 1, 6: 9, 8: 4, 9: 11 };                               // passos onde mais gente para
    const acertoFinal = [0.86, 0.78, 0.71, 0.66, 0.62, 0.44, 0.52, 0.69, 0.8, 0.83];
    const acertoDesafio = [0.9, 0.82, 0.88, 0.7, 0.76, 0.64, 0.6, 0.58, 0.66];

    const P = [], E = [];
    const ev = (pid, tipo, t, x) => E.push(Object.assign({ participante_id: pid, tipo, modulo: null, passo: null, alvo: null, detalhe: null, criado_em: new Date(t).toISOString() }, x || {}));

    for (let i = 0; i < 70; i++) ev(uid(), 'acesso', quando(agora - rnd() * 60 * DIA));   // visitantes sem cadastro

    for (let i = 0; i < 320; i++) {
      const id = uid();
      let t = quando(agora - Math.pow(rnd(), 0.8) * 75 * DIA);
      if (t > agora) t = agora - 3600e3;
      const cel = rnd() < 0.72;
      P.push({ id, loja: `${pick(tipos)} ${pick(nomes)}`, cidade: cidade(), dispositivo: cel ? 'celular' : 'computador', navegador: cel ? pick(['Chrome', 'Chrome', 'Safari', 'Samsung']) : pick(['Chrome', 'Edge', 'Safari']), criado_em: new Date(t).toISOString() });
      ev(id, 'acesso', t - 60e3);
      ev(id, 'cadastro', t);
      if (rnd() < 0.18) ev(id, 'voz', t + 5e3, { detalhe: { ligada: true } });
      if (rnd() < 0.35) ev(id, 'dica', t + 8e3, { detalhe: { dica: pick(['Antecipação de valores', 'Boleto', 'Repasse mensal', 'Pagamento online', 'Cupons de desconto', 'Pedidos com tempo expirado', 'Antecipação de valores', 'Boleto']) } });
      if (rnd() < 0.16) continue;                       // cadastrou e não começou
      let concluidos = 0, acertosPrimeira = 0;
      const habilidade = (rnd() - 0.5) * 0.3;          // umas lojas entendem mais que outras
      for (let m = 1; m <= NMOD; m++) {
        if (rnd() < 0.08) { t = quando(t + (1 + Math.floor(rnd() * 4)) * DIA); ev(id, 'acesso', t - 30e3); }
        const ini = (t += 20e3 + rnd() * 60e3);
        ev(id, 'modulo_inicio', t, { modulo: m });
        const steps = MODS[m - 1].steps.length;
        const termina = rnd() < continua[m - 1];
        const paraEm = termina ? steps + 1 : (gargaloPasso[m] && rnd() < 0.55 ? gargaloPasso[m] : 1 + Math.floor(rnd() * steps));
        let ant = 0;
        for (let p = 1; p <= Math.min(paraEm, steps); p++) {
          const ms = Math.round((6 + rnd() * 18 + (gargaloPasso[m] === p - 1 ? 40 * rnd() : 0)) * 1000);
          t += ms;
          const st = MODS[m - 1].steps[p - 1];
          ev(id, 'passo', t, { modulo: m, passo: p, alvo: st.target, detalhe: { titulo: st.title, anterior: ant, ms } });
          ant = p;
          if (st.mode === 'click' && rnd() < 0.07) ev(id, 'passo_pulado', t + 2e3, { modulo: m, passo: p, alvo: st.target, detalhe: { titulo: st.title } });
          if (st.mode === 'quiz') {
            const base = (st.desafio ? acertoDesafio[m - 1] : acertoFinal[p - 1]) + habilidade;
            const certa = st.options.findIndex((o) => o.ok);
            const erradas = st.options.map((_, i) => i).filter((i) => i !== certa);
            for (let tent = 1; tent < 4; tent++) {
              const ok = rnd() < base + (tent - 1) * 0.25;
              // O erro se concentra numa alternativa (o equívoco mais comum)
              const opcao = ok ? certa : erradas[rnd() < 0.7 ? 0 : erradas.length - 1];
              ev(id, 'quiz', t + tent * 4e3, { modulo: m, passo: p, alvo: st.target, detalhe: { pergunta: st.title, acertou: ok, tentativa: tent, opcao } });
              if (tent === 1 && ok) acertosPrimeira++;
              if (ok) break;
            }
          }
        }
        if (!termina) { ev(id, 'modulo_saida', t + 15e3, { modulo: m, passo: ant, detalhe: { motivo: rnd() < 0.6 ? 'fechou' : 'navegou', ms: t - ini } }); break; }
        t += 8e3;
        ev(id, 'modulo_fim', t, { modulo: m, detalhe: { ms: t - ini, ultimo_passo: ant, ultimo_passo_ms: 8000 } });
        concluidos++;
      }
      if (concluidos === NMOD) {
        ev(id, 'treino_concluido', t + 1e3);
        const nota = acertosPrimeira / NPERG;
        if (nota > ACERTO_MIN && rnd() < 0.8) ev(id, 'certificado', t + 6e4, { detalhe: { acertos: Math.round(nota * 100) } });
      }
    }
    return { participantes: P, eventos: E.filter((e) => +new Date(e.criado_em) <= agora) };
  }

  /* =====================================================================
     SUPABASE (modo real)
     ===================================================================== */
  const base = () => CFG.url.replace(/\/$/, '');
  const sessao = {
    get() { try { const s = JSON.parse(sessionStorage.getItem('bigou-admin')); return s && s.exp > Date.now() ? s : null; } catch (e) { return null; } },
    set(s) { try { sessionStorage.setItem('bigou-admin', JSON.stringify(s)); } catch (e) { /* */ } },
    sair() { try { sessionStorage.removeItem('bigou-admin'); } catch (e) { /* */ } },
  };

  async function login(senha) {
    const r = await fetch(`${base()}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: CFG.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: CFG.adminEmail, password: senha }),
    });
    if (!r.ok) throw new Error(r.status === 400 ? 'Senha incorreta.' : 'Não foi possível entrar (' + r.status + ').');
    const j = await r.json();
    sessao.set({ token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60e3 });
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
    if (demo) return gerarDemo();
    const [participantes, eventos] = await Promise.all([
      lerTudo('treino_participantes', 'id,loja,cidade,dispositivo,navegador,criado_em', 'criado_em.asc'),
      lerTudo('treino_eventos', 'participante_id,tipo,modulo,passo,alvo,detalhe,criado_em', 'id.asc'),
    ]);
    return { participantes, eventos };
  }

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
    const S = new Map(parts.map((p) => [p.id, { p, ini: new Set(), fim: new Set(), msMod: {}, saidas: [], ultimo: +new Date(p.criado_em), primeiroIni: null, concluiuEm: null, voz: false, cert: false, notaQ: {} }]));
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
    // Assuntos: primeira resposta de cada loja em cada pergunta (o entendimento "de primeira")
    const primeira = new Map();
    evP.filter((e) => e.tipo === 'quiz' && e.detalhe && e.detalhe.tentativa === 1).forEach((e) => {
      const s = S.get(e.participante_id), k = chave(e.modulo, e.passo);
      s.notaQ[k] = !!e.detalhe.acertou;
      const kk = e.participante_id + '|' + k;
      if (!primeira.has(kk)) primeira.set(kk, e);
    });
    const porPergunta = new Map();
    primeira.forEach((e) => {
      const k = chave(e.modulo, e.passo);
      const o = porPergunta.get(k) || { m: e.modulo, p: e.passo, ok: 0, tot: 0, erradas: {} };
      o.tot++;
      if (e.detalhe.acertou) o.ok++;
      else if (e.detalhe.opcao != null) o.erradas[e.detalhe.opcao] = (o.erradas[e.detalhe.opcao] || 0) + 1;
      porPergunta.set(k, o);
    });
    const temas = new Map();
    porPergunta.forEach((o) => {
      const st = passoDe(o.m, o.p);
      if (!st) return;
      const [opErr, nErr] = Object.entries(o.erradas).sort((a, b) => b[1] - a[1])[0] || [];
      Object.assign(o, {
        taxa: o.ok / o.tot,
        q: semValor(st.q),
        onde: st.desafio ? `Desafio do Módulo ${o.m}` : `Exercício final, ${st.title}`,
        erroComum: opErr != null && st.options[opErr] ? { t: semValor(st.options[opErr].t), n: nErr } : null,
      });
      const t = temas.get(st.tema) || { tema: st.tema, ok: 0, tot: 0, perguntas: [] };
      t.ok += o.ok; t.tot += o.tot; t.perguntas.push(o);
      temas.set(st.tema, t);
    });
    const assuntos = [...temas.values()].map((t) => Object.assign(t, { taxa: t.ok / t.tot, perguntas: t.perguntas.sort((a, b) => a.taxa - b.taxa) })).sort((a, b) => a.taxa - b.taxa);

    /* ---------- Situação de cada loja ---------- */
    L.forEach((s) => {
      const ks = Object.keys(s.notaQ);
      s.nota = ks.filter((k) => s.notaQ[k]).length / NPERG;
      const erros = {};
      ks.filter((k) => !s.notaQ[k]).forEach((k) => { const [m, p] = k.split(':').map(Number); const st = passoDe(m, p); if (st) erros[st.tema] = (erros[st.tema] || 0) + 1; });
      s.erroTema = (Object.entries(erros).sort((a, b) => b[1] - a[1])[0] || [])[0] || null;
      // Certificada: abriu o certificado, ou concluiu com mais de 70% (o certificado já está liberado)
      s.certificada = s.cert || (s.concluiu && s.nota > ACERTO_MIN);
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
        certificada: `Acertou ${Math.round(s.nota * 100)}%`,
        andamento: `Em andamento, ${ondeParou.replace(/^no /, 'no ').replace(/^antes do /, 'indo para o ')}`,
        recente: 'Cadastrou há pouco',
      }[s.sit];
    });
    const conta = (sit) => L.filter((s) => s.sit === sit).length;
    const sit = { parada: conta('parada'), naocomecou: conta('naocomecou'), semcert: conta('semcert'), certificada: conta('certificada'), andamento: conta('andamento'), recente: conta('recente') };
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

    /* ---------- Cidades ---------- */
    const cid = new Map();
    const C = (c) => { if (!cid.has(c)) cid.set(c, { cidade: c, lojas: 0, comecaram: 0, concluiram: 0, certificadas: 0, contato: 0 }); return cid.get(c); };
    L.forEach((s) => { const o = C(s.p.cidade); o.lojas++; if (s.comecou) o.comecaram++; if (s.concluiu) o.concluiram++; if (s.certificada) o.certificadas++; if (s.contato) o.contato++; });
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

    const uso = {
      celular: parts.filter((p) => p.dispositivo === 'celular').length,
      voz: L.filter((s) => s.voz).length,
      tempoAtivo: mediana(tempoAtivo),
      tempoCal: mediana(tempoCal),
      acessos: acessos.length,
    };

    return {
      kpi: { cadastradas: L.length, comecaram, concluiram, certificadas: sit.certificada, taxa: comecaram ? concluiram / comecaram : null },
      sit, jornada, paradas, assuntos, cidades, semCadastro, serie, uso, lojas: L,
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
    if (anterior === 0) return atual ? '<span class="dl neutro">novo</span>' : '';
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

  // Jornada em 5 marcos: barra única por marco, com a perda entre eles
  function jornadaVisual(R) {
    const J = R.jornada, base = Math.max(1, J[0].v);
    let pior = null;
    for (let i = 1; i < J.length; i++) { const a = J[i - 1].v; if (a >= 5) { const q = (a - J[i].v) / a; if (!pior || q > pior.q) pior = { i, q }; } }
    return `<ol class="jr">${J.map((e, i) => {
      const a = i ? J[i - 1].v : null, perda = i ? a - e.v : 0, g = pior && pior.i === i && perda > 0;
      return `${i ? `<li class="jr-perda ${g ? 'is-g' : ''}" aria-hidden="true"><span>${perda > 0 ? `−${n(perda)} lojas (${pct(perda, a)})` : 'sem perda'}${g ? ' · maior perda' : ''}</span></li>` : ''}
        <li class="jr-st ${g ? 'is-g' : ''}">
          <span class="jr-l"><b>${e.nome}</b>${e.sub ? `<small>${e.sub}</small>` : ''}</span>
          <span class="jr-bar"><i style="width:${Math.max(2, (e.v / base) * 100)}%"></i></span>
          <span class="jr-v">${n(e.v)}<small>${pct(e.v, base)}</small></span>
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

  // Assuntos do pior para o melhor; ao abrir, as perguntas e a resposta errada mais escolhida
  function assuntosVisual(R) {
    if (!R.assuntos.length) return '<p class="empty">Ninguém respondeu as perguntas ainda.</p>';
    return `<div class="as">${R.assuntos.map((t) => {
      const al = t.taxa < 0.6, v = Math.round(t.taxa * 100);
      return `<details class="as-i ${al ? 'al' : ''}">
        <summary>
          <span class="as-t">${al ? `<span class="st-crit" title="Pouco entendido">${IC.alerta}</span>` : ''}<b>${esc(t.tema)}</b><small>${t.perguntas.length} ${t.perguntas.length === 1 ? 'pergunta' : 'perguntas'} · ${n(t.tot)} respostas</small></span>
          <span class="as-bar"><i style="width:${Math.max(1, v)}%"></i></span>
          <span class="as-v">${v}%<small>acertam de primeira</small></span>
        </summary>
        <ul class="as-q">${t.perguntas.map((q) => `
          <li><div><small>${esc(q.onde)}</small><b>${esc(q.q)}</b>${q.erroComum ? `<span class="as-err">Erro mais comum: “${esc(q.erroComum.t)}” (${pct(q.erroComum.n, q.tot)})</span>` : ''}</div><b class="as-qv">${pct(q.ok, q.tot)}</b></li>`).join('')}</ul>
      </details>`;
    }).join('')}</div>`;
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
  const st = { dados: null, filtros: { dias: 28, cidade: '' }, busca: '', status: 'contato', buscaCid: '', ordem: { k: 'ultimo', dir: -1 }, R: null, P: null };
  const SECOES = [['resumo', 'Resumo'], ['jornada', 'Jornada'], ['assuntos', 'Assuntos'], ['lojas', 'Lojas para acompanhar'], ['cidades', 'Cidades'], ['uso', 'Uso']];

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
          <a class="lg-demo" href="?demo=1">Ver com dados de demonstração</a>
        </form>
      </main>`;
    const fm = document.getElementById('lg-form');
    document.getElementById('lg-senha').focus();
    fm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const b = fm.querySelector('button');
      b.disabled = true; b.textContent = 'Entrando…';
      try { await login(document.getElementById('lg-senha').value); iniciar(); }
      catch (err) { telaLogin(err.message); }
    });
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
    if (!demo && !sessao.get()) return telaLogin();
    telaCarregando();
    try { st.dados = await carregar(); render(); }
    catch (err) { if (err.auth) { sessao.sair(); telaLogin(err.message); } else root.innerHTML = `<main class="ld"><p class="lg-err">${esc(err.message)}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></main>`; }
  }

  const sec = (id, titulo, desc, corpo, extra) => `
    <section class="sec" id="s-${id}" aria-labelledby="h-${id}">
      <div class="sec-h"><div><h2 id="h-${id}">${titulo}</h2>${desc ? `<p>${desc}</p>` : ''}</div>${extra || ''}</div>
      ${corpo}
    </section>`;
  const card = (titulo, desc, corpo, cls) => `<div class="card ${cls || ''}">${titulo ? `<div class="card-h"><h3>${titulo}</h3>${desc ? `<p>${desc}</p>` : ''}</div>` : ''}${corpo}</div>`;

  function render() {
    const f = st.filtros;
    const R = (st.R = calcular(st.dados, f));
    // Período anterior, de mesmo tamanho (só quando há período definido)
    const P = (st.P = f.dias ? calcular(st.dados, Object.assign({}, f, { ate: Date.now() - f.dias * DIA })) : null);
    const K = R.kpi, KP = P && P.kpi, SI = R.sit;
    const dl = (k, menor) => (KP ? delta(K[k], KP[k], menor) : '');
    const cidadesOpc = [...new Set(st.dados.participantes.map((p) => p.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const sd = saude(K.taxa);
    const deCada10 = K.taxa == null ? null : Math.round(K.taxa * 10);
    const periodoTxt = f.dias ? `nos últimos ${f.dias} dias` : 'desde o início';

    // O que fazer agora: no máximo 3 ações, cada uma levando à seção
    const pa = R.paradas[0], pior = R.assuntos.find((t) => t.tot >= 5 && t.taxa < 0.7);
    const acoes = [
      SI.contato && ['parado', 'lojas', `<b>${n(SI.contato)} ${SI.contato === 1 ? 'loja precisa' : 'lojas precisam'} de contato</b>: ${[SI.parada && `${n(SI.parada)} paradas há ${PARADA_DIAS}+ dias`, SI.naocomecou && `${n(SI.naocomecou)} não começaram`, SI.semcert && `${n(SI.semcert)} concluíram sem certificado`].filter(Boolean).join(', ')}.`, 'Ver lista'],
      pior && ['critico', 'assuntos', `<b>Reforçar no atendimento: ${esc(pior.tema)}.</b> Só ${pct(pior.ok, pior.tot)} acertam de primeira.`, 'Ver perguntas'],
      pa && ['alerta', 'jornada', `<b>Mais lojas param no Módulo ${pa.m}</b> (${esc(tituloMod(pa.m))}): ${n(pa.pararam)} ${pa.pararam === 1 ? 'loja' : 'lojas'}.`, 'Ver jornada'],
    ].filter(Boolean);

    const contagem = { contato: SI.contato, parada: SI.parada, naocomecou: SI.naocomecou, semcert: SI.semcert, andamento: SI.andamento + SI.recente, certificada: SI.certificada, todas: R.lojas.length };

    root.innerHTML = `
      <header class="hd">
        <div class="hd-l"><img src="../assets/bigou-logo.png" alt="Bigou" width="34" height="34"><div><b>Painel do Treinamento</b><small><span class="hd-sub">Treinamento Financeiro</span>${demo ? '<span class="demo">Dados de demonstração</span>' : ''}</small></div></div>
        <div class="hd-r">
          <button class="btn ic" data-a="atualizar" title="Atualizar">${IC.atualizar}<span>Atualizar</span></button>
          ${demo ? '' : `<button class="btn ic" data-a="sair" title="Sair">${IC.sair}<span>Sair</span></button>`}
        </div>
      </header>

      <div class="bar">
        <div class="flt" role="group" aria-label="Filtros">
          <label><span>Cadastradas</span><select data-f="dias">
            ${[[7, 'Últimos 7 dias'], [14, 'Últimos 14 dias'], [28, 'Últimos 28 dias'], [0, 'Todo o período']].map(([v, t]) => `<option value="${v}" ${+f.dias === v ? 'selected' : ''}>${t}</option>`).join('')}
          </select></label>
          <label><span>Cidade</span><select data-f="cidade"><option value="">Todas as cidades</option>${cidadesOpc.map((c) => `<option ${f.cidade === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        </div>
        <nav class="nav" aria-label="Seções">${SECOES.map(([id, t]) => `<a href="#s-${id}" data-sec="${id}">${t}</a>`).join('')}</nav>
      </div>

      <main class="pg">
        ${sec('resumo', 'Resumo', `Lojas que se cadastraram ${periodoTxt}${f.cidade ? ` em ${esc(f.cidade)}` : ''}.`, `
          <div class="kpis k4">
            ${kpi('loja', 'Cadastradas', n(K.cadastradas), '', dl('cadastradas'), 'Lojas que preencheram o nome e a cidade no período.')}
            ${kpi('play', 'Começaram', n(K.comecaram), `${pct(K.comecaram, K.cadastradas)} das cadastradas`, dl('comecaram'), 'Lojas que abriram pelo menos um módulo.')}
            ${kpi('trofeu', 'Concluíram', n(K.concluiram), `${pct(K.concluiram, K.comecaram)} de quem começou`, dl('concluiram'), `Lojas que concluíram os ${NMOD} módulos.`)}
            ${kpi('ok', 'Certificadas', n(K.certificadas), `${pct(K.certificadas, K.concluiram)} de quem concluiu`, dl('certificadas'), 'Viram todo o conteúdo e acertaram mais de 70% das perguntas. É quem realmente entendeu.', 'hl')}
          </div>
          <div class="status-l"><span class="saude ${sd.cls}">${sd.ic}${sd.rot}</span><span>${deCada10 == null ? 'Ainda não há lojas que começaram o treinamento.' : `De cada 10 lojas que começam, <b>${deCada10}</b> ${deCada10 === 1 ? 'termina' : 'terminam'}.`}${KP && KP.taxa != null && K.taxa != null ? ` <small>No período anterior: ${Math.round(KP.taxa * 10)} de 10.</small>` : ''}</span></div>
          ${acoes.length ? card('O que fazer agora', '', `<ul class="ac">${acoes.map(([i, s, t, l]) => `<li><span class="ac-ic ${i}">${IC[i]}</span><span class="ac-t">${t}</span><a href="#s-${s}" class="ac-a" data-ir="${s}">${l} →</a></li>`).join('')}</ul>`, 'ac-card') : ''}
        `)}

        ${sec('jornada', 'Jornada', 'Até onde as lojas chegam e onde ficam pelo caminho.', `
          <div class="cols j2">
            ${card('Até onde chegam', '', jornadaVisual(R))}
            ${card('Onde param', 'Módulos em que lojas em andamento pararam e ainda não voltaram.', paradasVisual(R))}
          </div>
        `)}

        ${sec('assuntos', 'Assuntos', 'O que os parceiros entendem de primeira. Abaixo de 60% (com alerta) vale reforçar no atendimento. Toque em um assunto para ver as perguntas e o erro mais comum.', card('', '', assuntosVisual(R)))}

        ${sec('lojas', 'Lojas para acompanhar', 'Quem precisa de contato e por quê.', card('', '', `
          <div class="lj-top">
            <div class="chips" role="group" aria-label="Situação">${[['contato', 'Precisam de contato'], ['parada', 'Paradas'], ['naocomecou', 'Não começaram'], ['semcert', 'Sem certificado'], ['andamento', 'Em andamento'], ['certificada', 'Certificadas'], ['todas', 'Todas']].map(([k, t]) => `<button class="chip ${k === 'contato' ? 'warn' : ''} ${st.status === k ? 'on' : ''}" data-st="${k}" aria-pressed="${st.status === k}">${t}<em>${n(contagem[k])}</em></button>`).join('')}</div>
            <div class="lj-act"><input type="search" class="busca" id="lj-busca" placeholder="Buscar loja ou cidade" value="${esc(st.busca)}"><button class="btn ic" data-a="csv">${IC.baixar}<span>Exportar CSV</span></button></div>
          </div>
          <div class="tb-wrap" id="lj"></div>`))}

        ${sec('cidades', 'Cidades', 'Conclusão e contatos pendentes por cidade.', card('', '', `<input type="search" class="busca" id="cid-busca" placeholder="Buscar cidade" value="${esc(st.buscaCid)}"><div class="tb-wrap" id="cid-tb"></div>
          ${R.semCadastro.length ? `<details class="sem"><summary>${n(R.semCadastro.length)} cidades ainda sem nenhuma loja cadastrada</summary><p>${R.semCadastro.map(esc).join(' · ')}</p></details>` : ''}`))}

        ${sec('uso', 'Uso', 'Como e quando o treinamento é usado.', `
          <div class="kpis k3">
            ${kpi('tempo', 'Tempo para concluir', dur(R.uso.tempoAtivo), `de tela · ${dias(R.uso.tempoCal)}`, '', 'Mediana de quem concluiu: tempo de tela somado e dias entre o primeiro e o último módulo.')}
            ${kpi('olho', 'No celular', pct(R.uso.celular, K.cadastradas), `${n(R.uso.acessos)} acessos no período`, '', 'Lojas que fizeram o treinamento pelo celular.')}
            ${kpi('raio', 'Usaram a narração', pct(R.uso.voz, K.cadastradas), 'das cadastradas', '', 'Lojas que ligaram a narração por voz.')}
          </div>
          ${card('Acessos e conclusões por dia', 'Passe o dedo ou o mouse sobre o gráfico para ver cada dia.', '<div id="linha"></div>')}
        `)}
      </main>`;

    desenharLinha();
    desenharCidades();
    desenharLojas();
    observarSecoes();
  }

  function desenharLinha() {
    const el = document.getElementById('linha');
    if (el) el.innerHTML = graficoLinha(st.R, el.clientWidth || 600);
  }

  function desenharCidades() {
    const el = document.getElementById('cid-tb');
    if (!el) return;
    const b = st.buscaCid.trim().toLowerCase();
    const rows = st.R.cidades.filter((c) => !b || c.cidade.toLowerCase().includes(b));
    el.innerHTML = rows.length ? `<table class="tb"><thead><tr><th>Cidade</th><th class="num">Lojas</th><th class="num">Concluíram</th><th class="num">Certificadas</th><th class="num">Precisam de contato</th></tr></thead>
      <tbody>${rows.map((c) => { const t = c.comecaram ? c.concluiram / c.comecaram : null; const sd = saude(c.comecaram >= 3 ? t : null);
        return `<tr><td>${esc(c.cidade)}</td><td class="num">${n(c.lojas)}</td>
        <td class="num"><span class="saude mini ${sd.cls}" title="${t == null ? 'Sem dados' : sd.rot + ' · de quem começou'}">${t == null ? '—' : pct(c.concluiram, c.comecaram)}</span></td>
        <td class="num">${n(c.certificadas)}</td><td class="num">${c.contato ? `<b class="ct">${n(c.contato)}</b>` : '<span class="mut">0</span>'}</td></tr>`; }).join('')}</tbody></table>` : '<p class="empty">Nenhuma cidade encontrada.</p>';
  }

  const SIT = {
    parada: ['Parada', 'bad'], naocomecou: ['Não começou', 'off'], semcert: ['Sem certificado', 'warn'],
    andamento: ['Em andamento', 'info'], recente: ['Recém-cadastrada', 'info'], certificada: ['Certificada', 'ok'],
  };
  function linhasLojas() {
    const b = st.busca.trim().toLowerCase();
    const filtro = (s) => st.status === 'todas' || (st.status === 'contato' ? s.contato : st.status === 'andamento' ? s.sit === 'andamento' || s.sit === 'recente' : s.sit === st.status);
    const rows = st.R.lojas.filter((s) => filtro(s) && (!b || s.p.loja.toLowerCase().includes(b) || s.p.cidade.toLowerCase().includes(b)));
    const k = st.ordem.k, d = st.ordem.dir;
    const val = (s) => (k === 'loja' ? s.p.loja : k === 'cidade' ? s.p.cidade : k === 'prog' ? s.fim.size : k === 'sit' ? SIT[s.sit][0] : s.ultimo);
    return rows.sort((a, c) => { const x = val(a), y = val(c); return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * d; });
  }

  function desenharLojas() {
    const el = document.getElementById('lj');
    if (!el) return;
    const todas = linhasLojas(), rows = todas.slice(0, 300);
    const th = (k, t, num) => `<th class="${num ? 'num ' : ''}sort" data-k="${k}" aria-sort="${st.ordem.k === k ? (st.ordem.dir > 0 ? 'ascending' : 'descending') : 'none'}">${t}</th>`;
    el.innerHTML = rows.length ? `<table class="tb"><thead><tr>${th('loja', 'Loja')}${th('cidade', 'Cidade')}${th('prog', 'Progresso')}${th('sit', 'Situação')}${th('ultimo', 'Último acesso')}</tr></thead>
      <tbody>${rows.map((s) => `<tr><td><b class="lj-n">${esc(s.p.loja)}</b></td><td>${esc(s.p.cidade)}</td>
        <td><span class="pg-mini"><i style="width:${(s.fim.size / NMOD) * 100}%"></i></span>${s.fim.size}/${NMOD}</td>
        <td class="sit"><span class="badge ${SIT[s.sit][1]}">${SIT[s.sit][0]}</span><small>${esc(s.motivo)}</small></td>
        <td title="${dataHoraBR(s.ultimo)}">${relativo(s.ultimo)}</td></tr>`).join('')}</tbody></table>
      ${todas.length > 300 ? `<p class="note">Mostrando 300 de ${n(todas.length)} lojas. Use a busca ou exporte o CSV para ver todas.</p>` : ''}` : `<p class="empty">${st.status === 'contato' ? 'Nenhuma loja precisa de contato agora.' : 'Nenhuma loja com esse filtro.'}</p>`;
  }

  function exportarCSV() {
    const cab = ['Loja', 'Cidade', 'Módulos concluídos', 'Situação', 'Motivo', 'Acerto', 'Assunto com mais erro', 'Último acesso', 'Cadastro', 'Aparelho'];
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const linhas = linhasLojas().map((s) => [s.p.loja, s.p.cidade, `${s.fim.size}/${NMOD}`, SIT[s.sit][0], s.motivo, Object.keys(s.notaQ).length ? Math.round(s.nota * 100) + '%' : '', s.erroTema || '', dataHoraBR(s.ultimo), dataHoraBR(s.p.criado_em), s.p.dispositivo]);
    const csv = '﻿' + [cab].concat(linhas).map((l) => l.map(q).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `treinamento-lojas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // Destaca na navegação a seção que está na tela
  let obs = null;
  function observarSecoes() {
    if (obs) obs.disconnect();
    if (!('IntersectionObserver' in window)) return;
    obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.sec === e.target.id.slice(2))); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('.sec').forEach((s) => obs.observe(s));
  }

  /* ------------------------------ Interações ------------------------------ */
  root.addEventListener('change', (e) => {
    const s = e.target.closest('[data-f]');
    if (!s) return;
    st.filtros[s.dataset.f] = s.dataset.f === 'dias' ? +s.value : s.value;
    render();
  });
  root.addEventListener('input', (e) => {
    if (e.target.id === 'lj-busca') { st.busca = e.target.value; desenharLojas(); }
    if (e.target.id === 'cid-busca') { st.buscaCid = e.target.value; desenharCidades(); }
  });
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]');
    if (a) {
      if (a.dataset.a === 'atualizar') iniciar();
      else if (a.dataset.a === 'sair') { sessao.sair(); telaLogin(); }
      else if (a.dataset.a === 'csv') exportarCSV();
      return;
    }
    const chip = e.target.closest('[data-st]');
    if (chip) {
      st.status = chip.dataset.st;
      document.querySelectorAll('[data-st]').forEach((c) => { const on = c.dataset.st === st.status; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
      desenharLojas();
      return;
    }
    const nav = e.target.closest('.nav a, [data-ir]');
    if (nav) {
      e.preventDefault();
      const alvo = document.querySelector(nav.getAttribute('href'));
      if (alvo) window.scrollTo({ top: alvo.getBoundingClientRect().top + scrollY - document.querySelector('.bar').offsetHeight - 70, behavior: 'smooth' });
      return;
    }
    const th = e.target.closest('th.sort');
    if (th) { const k = th.dataset.k; st.ordem = { k, dir: st.ordem.k === k ? -st.ordem.dir : k === 'loja' || k === 'cidade' ? 1 : -1 }; desenharLojas(); }
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
  root.addEventListener('touchstart', (e) => { const hit = e.target.closest('.lc-hit'); if (hit) linhaHover(hit, e.touches[0].clientX); else { const el = e.target.closest('[data-tip]'); if (el) mostrarTip(el.dataset.tip, e.touches[0].clientX, e.touches[0].clientY); else esconderTip(); } }, { passive: true });
  root.addEventListener('touchmove', (e) => { const hit = e.target.closest('.lc-hit'); if (hit) linhaHover(hit, e.touches[0].clientX); }, { passive: true });
  window.addEventListener('scroll', () => {
    esconderTip();
    // No fim da página, a última seção nunca cruza a linha do observador: marca ela
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
      const ul = SECOES[SECOES.length - 1][0];
      document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.sec === ul));
    }
  }, { passive: true });

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
  window.ADMIN = { calcular, gerarDemo, estado: st };
  iniciar();
})();
