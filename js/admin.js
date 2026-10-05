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
  const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const COR = { a: '#2a78d6', b: '#eb6834' };            // validados (dataviz): série 1 e 2
  const SEQ = ['#f1f6fd', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];

  const demo = /[?&]demo=1/.test(location.search) || !(CFG.url && CFG.anonKey && CFG.adminEmail);

  /* ------------------------------ Metadados do treinamento ------------------------------ */
  const MODS = TREINO.buildModules(TREINO.calc(TREINO.cenarios[1]));
  const NMOD = MODS.length;
  const tituloMod = (m) => (MODS[m - 1] ? MODS[m - 1].titulo : 'Módulo ' + m);
  const tituloPasso = (m, p) => { const s = MODS[m - 1] && MODS[m - 1].steps[p - 1]; return s ? s.title : 'Passo ' + p; };

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
    const h = Math.floor(m / 60);
    return `${h} h ${m % 60} min`;
  }
  const dias = (ms) => (ms == null ? '—' : ms < DIA ? 'no mesmo dia' : `${(ms / DIA).toFixed(1).replace('.', ',')} dias`);
  const dataBR = (t) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const dataHoraBR = (t) => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
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
    // hora de uso: picos de manhã e à tarde
    const hora = () => { const r = rnd(); return r < 0.4 ? 9 + Math.floor(rnd() * 3) : r < 0.8 ? 14 + Math.floor(rnd() * 4) : 7 + Math.floor(rnd() * 15); };
    const quando = (base) => { const d = new Date(base); d.setHours(hora(), Math.floor(rnd() * 60), Math.floor(rnd() * 60)); return d.getTime(); };

    const continua = [0.93, 0.92, 0.9, 0.8, 0.88, 0.68, 0.84, 0.9];   // chance de concluir cada módulo
    const gargaloPasso = { 4: 1, 6: 9, 7: 9 };                        // passos onde mais gente para
    const acertoQ = [0.86, 0.78, 0.74, 0.71, 0.62, 0.44, 0.69, 0.8, 0.52];

    const P = [], E = [];
    const ev = (pid, tipo, t, x) => E.push(Object.assign({ participante_id: pid, tipo, modulo: null, passo: null, alvo: null, detalhe: null, criado_em: new Date(t).toISOString() }, x || {}));

    // visitantes que não se cadastraram
    for (let i = 0; i < 70; i++) { const id = uid(); ev(id, 'acesso', quando(agora - rnd() * 60 * DIA), { detalhe: { cenario: 1 } }); }

    for (let i = 0; i < 320; i++) {
      const id = uid();
      let t = quando(agora - Math.pow(rnd(), 0.8) * 75 * DIA);
      if (t > agora) t = agora - 3600e3;
      const cen = 1 + Math.floor(rnd() * 3);
      const cel = rnd() < 0.72;
      P.push({ id, loja: `${pick(tipos)} ${pick(nomes)}`, cidade: cidade(), cenario: cen, dispositivo: cel ? 'celular' : 'computador', navegador: cel ? pick(['Chrome', 'Chrome', 'Safari', 'Samsung']) : pick(['Chrome', 'Edge', 'Safari']), criado_em: new Date(t).toISOString() });
      ev(id, 'acesso', t - 60e3, { detalhe: { cenario: cen } });
      ev(id, 'cadastro', t, { detalhe: { cenario: cen } });
      if (rnd() < 0.18) ev(id, 'voz', t + 5e3, { detalhe: { ligada: true } });
      if (rnd() < 0.35) ev(id, 'dica', t + 8e3, { detalhe: { dica: pick(['Antecipação de valores', 'Boleto', 'Repasse mensal', 'Pagamento online', 'Cupons de desconto', 'Pedidos com tempo expirado', 'Antecipação de valores', 'Boleto']) } });
      if (rnd() < 0.16) continue;                       // cadastrou e não começou
      let concluidos = 0;
      for (let m = 1; m <= NMOD; m++) {
        if (rnd() < 0.08) { t = quando(t + (1 + Math.floor(rnd() * 4)) * DIA); ev(id, 'acesso', t - 30e3, { detalhe: { cenario: cen } }); }
        const ini = (t += 20e3 + rnd() * 60e3);
        ev(id, 'modulo_inicio', t, { modulo: m });
        const steps = MODS[m - 1].steps.length;
        const termina = rnd() < continua[m - 1];
        const paraEm = termina ? steps + 1 : (gargaloPasso[m] && rnd() < 0.55 ? gargaloPasso[m] : 1 + Math.floor(rnd() * steps));
        let ant = 0;
        for (let p = 1; p <= Math.min(paraEm, steps); p++) {
          const ms = Math.round((6 + rnd() * 18 + (gargaloPasso[m] === p - 1 ? 40 * rnd() : 0)) * 1000);
          t += ms;
          ev(id, 'passo', t, { modulo: m, passo: p, alvo: MODS[m - 1].steps[p - 1].target, detalhe: { titulo: tituloPasso(m, p), anterior: ant, ms } });
          ant = p;
          const st = MODS[m - 1].steps[p - 1];
          if (st.mode === 'click' && rnd() < 0.07) ev(id, 'passo_pulado', t + 2e3, { modulo: m, passo: p, alvo: st.target, detalhe: { titulo: st.title } });
          if (st.mode === 'quiz') {
            const q = p - 1;
            let tent = 1;
            while (tent < 4) { const ok = rnd() < acertoQ[q] + (tent - 1) * 0.25; ev(id, 'quiz', t + tent * 4e3, { modulo: m, passo: p, alvo: st.target, detalhe: { pergunta: st.title, acertou: ok, tentativa: tent } }); if (ok) break; tent++; }
          }
        }
        if (!termina) { ev(id, 'modulo_saida', t + 15e3, { modulo: m, passo: ant, detalhe: { motivo: rnd() < 0.6 ? 'fechou' : 'navegou', ms: t - ini } }); break; }
        t += 8e3;
        ev(id, 'modulo_fim', t, { modulo: m, detalhe: { ms: t - ini, ultimo_passo: ant, ultimo_passo_ms: 8000 } });
        concluidos++;
      }
      if (concluidos === NMOD) ev(id, 'treino_concluido', t + 1e3, { detalhe: { cenario: cen } });
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
      lerTudo('treino_participantes', 'id,loja,cidade,cenario,dispositivo,navegador,criado_em', 'criado_em.asc'),
      lerTudo('treino_eventos', 'participante_id,tipo,modulo,passo,alvo,detalhe,criado_em', 'id.asc'),
    ]);
    return { participantes, eventos };
  }

  /* =====================================================================
     CÁLCULO DE TODOS OS INDICADORES
     ===================================================================== */
  function calcular(D, f) {
    const agora = Date.now();
    const desde = f.dias ? agora - f.dias * DIA : -Infinity;
    const semFiltroDim = !f.cidade && !f.cenario;
    const todosIds = new Set(D.participantes.map((p) => p.id));
    const parts = D.participantes.filter((p) => (!f.cidade || p.cidade === f.cidade) && (!f.cenario || +p.cenario === +f.cenario) && +new Date(p.criado_em) >= desde);
    const ids = new Set(parts.map((p) => p.id));
    const cidadeDe = new Map(D.participantes.map((p) => [p.id, p.cidade]));
    const evs = D.eventos.map((e) => Object.assign({ t: +new Date(e.criado_em) }, e));

    // Resumo por participante
    const S = new Map(parts.map((p) => [p.id, { p, ini: new Set(), fim: new Set(), msMod: {}, saidas: [], ultimo: +new Date(p.criado_em), primeiroIni: null, concluiuEm: null, voz: false }]));
    for (const e of evs) {
      const s = S.get(e.participante_id);
      if (!s) continue;
      s.ultimo = Math.max(s.ultimo, e.t);
      if (e.tipo === 'modulo_inicio') { s.ini.add(e.modulo); if (s.primeiroIni == null || e.t < s.primeiroIni) s.primeiroIni = e.t; }
      else if (e.tipo === 'modulo_fim') { if (!s.fim.has(e.modulo)) s.msMod[e.modulo] = (e.detalhe && e.detalhe.ms) || 0; s.fim.add(e.modulo); if (s.fim.size === NMOD && !s.concluiuEm) s.concluiuEm = e.t; }
      else if (e.tipo === 'treino_concluido') { if (!s.concluiuEm) s.concluiuEm = e.t; }
      else if (e.tipo === 'modulo_saida') s.saidas.push(e);
      else if (e.tipo === 'voz' && e.detalhe && e.detalhe.ligada) s.voz = true;
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

    // Acessos no período (inclui quem ainda não se cadastrou, se não houver filtro de cidade/cenário)
    const acessos = evs.filter((e) => e.tipo === 'acesso' && e.t >= desde && (ids.has(e.participante_id) || (semFiltroDim && !todosIds.has(e.participante_id))));
    const visitantesSemCadastro = semFiltroDim ? new Set(acessos.filter((e) => !todosIds.has(e.participante_id)).map((e) => e.participante_id)).size : null;
    const ativos7 = L.filter((s) => s.ultimo >= agora - 7 * DIA).length;

    // Funil por módulo
    const funil = [];
    for (let m = 1; m <= NMOD; m++) {
      const ini = L.filter((s) => s.ini.has(m)).length, fim = L.filter((s) => s.fim.has(m)).length;
      funil.push({ m, ini, fim, taxa: ini ? fim / ini : null });
    }
    // Queda entre etapas: cadastro → concluiu M1 → … → concluiu M8
    const etapas = [{ nome: 'Cadastraram', v: L.length }].concat(funil.map((x) => ({ nome: `Concluíram o Módulo ${x.m}`, m: x.m, v: x.fim })));
    let maiorQueda = null;
    for (let i = 1; i < etapas.length; i++) {
      const a = etapas[i - 1].v, b = etapas[i].v;
      if (a >= 5) { const q = (a - b) / a; if (!maiorQueda || q > maiorQueda.q) maiorQueda = { q, de: etapas[i - 1], para: etapas[i], perdidos: a - b }; }
    }

    // Eventos dos participantes filtrados
    const evP = evs.filter((e) => ids.has(e.participante_id));
    const chave = (m, p) => m + ':' + p;

    // Alcance por passo (pessoas distintas que viram o passo)
    const alcance = new Map();
    evP.filter((e) => e.tipo === 'passo').forEach((e) => { const k = chave(e.modulo, e.passo); if (!alcance.has(k)) alcance.set(k, new Set()); alcance.get(k).add(e.participante_id); });

    // Abandono: última saída de cada pessoa em cada módulo que ela não concluiu
    const aband = new Map();
    L.forEach((s) => {
      const porMod = new Map();
      s.saidas.forEach((x) => { if (!s.fim.has(x.modulo) && x.passo) { const o = porMod.get(x.modulo); if (!o || x.t > o.t) porMod.set(x.modulo, x); } });
      porMod.forEach((x) => { const k = chave(x.modulo, x.passo); aband.set(k, (aband.get(k) || 0) + 1); });
    });
    const abandonos = [...aband.entries()].map(([k, c]) => { const [m, p] = k.split(':').map(Number); const viu = alcance.has(k) ? alcance.get(k).size : c; return { m, p, c, viu, taxa: viu ? c / viu : 0 }; }).sort((a, b) => b.c - a.c || b.taxa - a.taxa);

    // Tempo por passo (mediana)
    const tempos = new Map();
    const addT = (m, p, ms) => { if (!p || !ms || ms > 15 * 60e3) return; const k = chave(m, p); if (!tempos.has(k)) tempos.set(k, []); tempos.get(k).push(ms); };
    evP.forEach((e) => {
      if (e.tipo === 'passo' && e.detalhe && e.detalhe.anterior) addT(e.modulo, e.detalhe.anterior, e.detalhe.ms);
      if (e.tipo === 'modulo_fim' && e.detalhe && e.detalhe.ultimo_passo) addT(e.modulo, e.detalhe.ultimo_passo, e.detalhe.ultimo_passo_ms);
    });
    const lentos = [...tempos.entries()].filter(([, a]) => a.length >= 3).map(([k, a]) => { const [m, p] = k.split(':').map(Number); return { m, p, med: mediana(a), nAmostra: a.length }; }).sort((a, b) => b.med - a.med);

    // Passos pulados
    const pul = new Map();
    evP.filter((e) => e.tipo === 'passo_pulado').forEach((e) => { const k = chave(e.modulo, e.passo); pul.set(k, (pul.get(k) || 0) + 1); });
    const pulados = [...pul.entries()].map(([k, c]) => { const [m, p] = k.split(':').map(Number); const viu = alcance.has(k) ? alcance.get(k).size : c; return { m, p, c, viu, taxa: viu ? c / viu : 0 }; }).sort((a, b) => b.c - a.c);

    // Exercício: acerto na 1ª tentativa
    const qz = new Map();
    evP.filter((e) => e.tipo === 'quiz' && e.detalhe && e.detalhe.tentativa === 1).forEach((e) => { const o = qz.get(e.passo) || { ok: 0, tot: 0 }; o.tot++; if (e.detalhe.acertou) o.ok++; qz.set(e.passo, o); });
    const quizStep = (p) => MODS[NMOD - 1] && MODS[NMOD - 1].steps[p - 1];
    const quiz = [...qz.entries()].map(([p, o]) => ({ p, q: quizStep(p) ? quizStep(p).q.replace(/R\$[\d.,]+/g, 'R$…') : 'Pergunta ' + p, ok: o.ok, tot: o.tot, taxa: o.ok / o.tot })).sort((a, b) => a.taxa - b.taxa);

    // Cidades
    const cid = new Map();
    const C = (c) => { if (!cid.has(c)) cid.set(c, { cidade: c, lojas: 0, acessos: 0, comecaram: 0, concluiram: 0 }); return cid.get(c); };
    L.forEach((s) => { const o = C(s.p.cidade); o.lojas++; if (s.comecou) o.comecaram++; if (s.concluiu) o.concluiram++; });
    acessos.forEach((e) => { const c = cidadeDe.get(e.participante_id); if (c && ids.has(e.participante_id)) C(c).acessos++; });
    const cidades = [...cid.values()].sort((a, b) => b.acessos - a.acessos || b.lojas - a.lojas);
    const semCadastro = f.cidade ? [] : TREINO.cidades.filter((c) => !cid.has(c));

    // Série diária
    const ini0 = isFinite(desde) ? desde : Math.min(...evs.map((e) => e.t), agora);
    const nDias = Math.max(1, Math.ceil((agora - ini0) / DIA));
    const serie = [];
    const d0 = new Date(ini0); d0.setHours(0, 0, 0, 0);
    for (let i = 0; i <= nDias && i < 400; i++) { const d = new Date(d0.getTime() + i * DIA); serie.push({ t: d.getTime(), k: diaKey(d), acessos: 0, conclusoes: 0 }); }
    const idx = new Map(serie.map((x, i) => [x.k, i]));
    acessos.forEach((e) => { const i = idx.get(diaKey(e.t)); if (i != null) serie[i].acessos++; });
    L.forEach((s) => { if (s.concluiuEm && s.concluiuEm >= desde) { const i = idx.get(diaKey(s.concluiuEm)); if (i != null) serie[i].conclusoes++; } });

    // Mapa de calor (dia da semana × hora) dos acessos
    const calor = Array.from({ length: 7 }, () => Array(24).fill(0));
    acessos.forEach((e) => { const d = new Date(e.t); calor[d.getDay()][d.getHours()]++; });

    // Perfil
    const conta = (arr) => { const m = new Map(); arr.forEach((x) => m.set(x, (m.get(x) || 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
    const perfil = {
      dispositivo: conta(parts.map((p) => p.dispositivo || 'desconhecido')),
      navegador: conta(parts.map((p) => p.navegador || 'Outro')),
      cenario: conta(parts.map((p) => 'Cenário ' + p.cenario)),
      voz: L.filter((s) => s.voz).length,
      dicas: conta(evs.filter((e) => e.tipo === 'dica' && e.t >= desde && (ids.has(e.participante_id) || (semFiltroDim && !todosIds.has(e.participante_id)))).map((e) => (e.detalhe && e.detalhe.dica) || '?')),
    };

    return {
      kpi: { cadastradas: L.length, comecaram, concluiram, andamento: comecaram - concluiram, naoComecaram: L.length - comecaram, tempoAtivo: mediana(tempoAtivo), tempoCal: mediana(tempoCal), acessos: acessos.length, ativos7, visitantesSemCadastro },
      funil, etapas, maiorQueda, abandonos, lentos, pulados, quiz, cidades, semCadastro, serie, calor, perfil, lojas: L,
    };
  }

  /* =====================================================================
     GRÁFICOS (SVG à mão)
     ===================================================================== */
  const tipAttr = (html) => `data-tip="${esc(html)}" tabindex="0"`;

  // Barras horizontais de uma série (ex.: cidades, acerto do quiz)
  function barras(rows, { valor, rotulo, fmt, max, cor = COR.a, alerta }) {
    const mx = max || Math.max(1, ...rows.map(valor));
    return `<div class="hb">${rows.map((r) => {
      const v = valor(r), w = Math.max(0.6, (v / mx) * 100), al = alerta && alerta(r);
      return `<div class="hb-row" ${tipAttr(`<b>${esc(rotulo(r))}</b><br>${fmt(r)}`)}>
        <div class="hb-l">${al ? '<span class="st-crit" aria-label="Atenção">!</span>' : ''}${esc(rotulo(r))}</div>
        <div class="hb-track"><i style="width:${w}%;background:${cor}"></i></div>
        <div class="hb-v">${fmt(r)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  // Funil: duas barras por módulo (iniciaram × concluíram), com rótulo direto
  function graficoFunil(R) {
    const mx = Math.max(1, ...R.funil.map((x) => x.ini));
    const pior = R.funil.filter((x) => x.ini >= 5).sort((a, b) => a.taxa - b.taxa)[0];
    return `
      <div class="legend"><span><i style="background:${COR.a}"></i>Iniciaram</span><span><i style="background:${COR.b}"></i>Concluíram</span></div>
      <div class="fn">${R.funil.map((x) => `
        <div class="fn-row ${pior && pior.m === x.m ? 'is-pior' : ''}" ${tipAttr(`<b>Módulo ${x.m} · ${esc(tituloMod(x.m))}</b><br>Iniciaram: ${n(x.ini)}<br>Concluíram: ${n(x.fim)}<br>Conclusão: ${pct(x.fim, x.ini)}`)}>
          <div class="fn-l"><b>M${x.m}</b><span>${esc(tituloMod(x.m))}</span></div>
          <div class="fn-bars">
            <div class="fn-bar"><i style="width:${(x.ini / mx) * 100}%;background:${COR.a}"></i><em>${n(x.ini)}</em></div>
            <div class="fn-bar"><i style="width:${(x.fim / mx) * 100}%;background:${COR.b}"></i><em>${n(x.fim)}</em></div>
          </div>
          <div class="fn-t"><b>${pct(x.fim, x.ini)}</b><small>concluem</small></div>
        </div>`).join('')}
      </div>`;
  }

  // Linha diária: acessos e conclusões (mesma unidade, um eixo)
  function graficoLinha(R, largura) {
    const S = R.serie, W = Math.max(300, largura), H = 220, pl = 36, pr = 12, pt = 12, pb = 26;
    const mx = Math.max(1, ...S.map((x) => Math.max(x.acessos, x.conclusoes)));
    const top = Math.ceil(mx / 4) * 4 || 4;
    const X = (i) => pl + (S.length < 2 ? 0 : (i * (W - pl - pr)) / (S.length - 1));
    const Y = (v) => pt + (H - pt - pb) * (1 - v / top);
    const path = (k) => S.map((x, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(x[k]).toFixed(1)}`).join('');
    const grid = [0, 0.25, 0.5, 0.75, 1].map((g) => `<line x1="${pl}" x2="${W - pr}" y1="${Y(top * g)}" y2="${Y(top * g)}" class="grid"/><text x="${pl - 6}" y="${Y(top * g) + 4}" class="ax" text-anchor="end">${n(top * g)}</text>`).join('');
    const passo = Math.max(1, Math.ceil(S.length / 7));
    const xl = S.map((x, i) => (i % passo === 0 || i === S.length - 1 ? `<text x="${X(i)}" y="${H - 6}" class="ax" text-anchor="${i === 0 ? 'start' : i === S.length - 1 ? 'end' : 'middle'}">${dataBR(x.t)}</text>` : '')).join('');
    return `
      <div class="legend"><span><i style="background:${COR.a}"></i>Acessos</span><span><i style="background:${COR.b}"></i>Treinamentos concluídos</span></div>
      <div class="lc" data-linha='${esc(JSON.stringify(S.map((x) => [x.t, x.acessos, x.conclusoes])))}' data-geo='${JSON.stringify({ W, H, pl, pr, pt, pb, top })}'>
        <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Acessos e conclusões por dia">
          ${grid}${xl}
          <path d="${path('acessos')}" fill="none" stroke="${COR.a}" stroke-width="2" stroke-linejoin="round"/>
          <path d="${path('conclusoes')}" fill="none" stroke="${COR.b}" stroke-width="2" stroke-linejoin="round"/>
          <line class="lc-x" x1="0" x2="0" y1="${pt}" y2="${H - pb}" visibility="hidden"/>
          <circle class="lc-a" r="4" fill="${COR.a}" stroke="#fff" stroke-width="2" visibility="hidden"/>
          <circle class="lc-b" r="4" fill="${COR.b}" stroke="#fff" stroke-width="2" visibility="hidden"/>
          <rect class="lc-hit" x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent"/>
        </svg>
      </div>`;
  }

  // Mapa de calor: sequencial azul, do claro (pouco) ao escuro (muito)
  function graficoCalor(R) {
    const mx = Math.max(1, ...R.calor.flat());
    const cor = (v) => (v ? SEQ[Math.min(SEQ.length - 1, 1 + Math.floor((v / mx) * (SEQ.length - 2)))] : SEQ[0]);
    const ordem = [1, 2, 3, 4, 5, 6, 0];
    return `
      <div class="hm" role="table" aria-label="Acessos por dia da semana e hora">
        <div class="hm-row hm-head"><span></span>${Array.from({ length: 24 }, (_, h) => `<span>${h % 3 === 0 ? h + 'h' : ''}</span>`).join('')}</div>
        ${ordem.map((d) => `<div class="hm-row"><span class="hm-d">${SEMANA[d]}</span>${R.calor[d].map((v, h) => `<i style="background:${cor(v)}" ${tipAttr(`<b>${SEMANA[d]}, ${h}h–${h + 1}h</b><br>${n(v)} acesso${v === 1 ? '' : 's'}`)}></i>`).join('')}</div>`).join('')}
        <div class="hm-scale"><small>Menos</small>${SEQ.slice(1).map((c) => `<i style="background:${c}"></i>`).join('')}<small>Mais</small></div>
      </div>`;
  }

  /* =====================================================================
     TELAS
     ===================================================================== */
  const st = { dados: null, filtros: { dias: 30, cidade: '', cenario: '' }, busca: '', ordem: { k: 'ultimo', dir: -1 }, R: null };

  function telaLogin(msg) {
    root.innerHTML = `
      <main class="lg">
        <form class="lg-card" id="lg-form">
          <img src="assets/bigou-logo.png" alt="Bigou" width="48" height="48">
          <h1>Painel do Treinamento</h1>
          <p>Acesso restrito à equipe.</p>
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

  function telaCarregando() { root.innerHTML = `<main class="ld"><img src="assets/bigou-logo.png" alt="" width="48" height="48"><p>Carregando dados…</p></main>`; }

  async function iniciar() {
    if (!demo && !sessao.get()) return telaLogin();
    telaCarregando();
    try { st.dados = await carregar(); render(); }
    catch (err) { if (err.auth) { sessao.sair(); telaLogin(err.message); } else root.innerHTML = `<main class="ld"><p class="lg-err">${esc(err.message)}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></main>`; }
  }

  function kpi(rot, val, sub, cls) { return `<div class="kpi ${cls || ''}"><span>${rot}</span><b>${val}</b>${sub ? `<small>${sub}</small>` : ''}</div>`; }
  const nomePasso = (m, p) => `<b>M${m} · passo ${p}</b><span>${esc(tituloPasso(m, p))}</span>`;

  function render() {
    const f = st.filtros, R = (st.R = calcular(st.dados, f)), K = R.kpi;
    const cidadesOpc = [...new Set(st.dados.participantes.map((p) => p.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const melhorCid = R.cidades[0];
    const piorConcl = R.cidades.filter((c) => c.comecaram >= 5).sort((a, b) => a.concluiram / a.comecaram - b.concluiram / b.comecaram)[0];
    const piorQuiz = R.quiz[0], maisAband = R.abandonos[0];

    const destaques = [
      R.maiorQueda && `<b>Maior queda:</b> de "${esc(R.maiorQueda.de.nome)}" para "${esc(R.maiorQueda.para.nome)}" (−${Math.round(R.maiorQueda.q * 100)}%, ${n(R.maiorQueda.perdidos)} lojas).`,
      maisAband && `<b>Passo com mais abandono:</b> Módulo ${maisAband.m}, "${esc(tituloPasso(maisAband.m, maisAband.p))}" (${n(maisAband.c)} lojas pararam ali).`,
      piorQuiz && piorQuiz.tot >= 3 && `<b>Pergunta com menos acerto:</b> "${esc(piorQuiz.q)}" (${pct(piorQuiz.ok, piorQuiz.tot)} na 1ª tentativa).`,
      melhorCid && `<b>Cidade com mais acessos:</b> ${esc(melhorCid.cidade)} (${n(melhorCid.acessos)} acessos, ${n(melhorCid.lojas)} lojas).`,
      piorConcl && `<b>Menor conclusão:</b> ${esc(piorConcl.cidade)}, ${pct(piorConcl.concluiram, piorConcl.comecaram)} de quem começou terminou.`,
    ].filter(Boolean);

    root.innerHTML = `
      <header class="hd">
        <div class="hd-l"><img src="assets/bigou-logo.png" alt="Bigou" width="32" height="32"><div><b>Painel do Treinamento</b><small><span class="hd-sub">Treinamento Financeiro</span>${demo ? '<span class="demo">Dados de demonstração</span>' : ''}</small></div></div>
        <div class="hd-r">
          <button class="btn" data-a="atualizar">Atualizar</button>
          ${demo ? '' : '<button class="btn" data-a="sair">Sair</button>'}
        </div>
      </header>

      <div class="flt" role="group" aria-label="Filtros">
        <label><span>Período</span><select data-f="dias">
          ${[[7, 'Últimos 7 dias'], [30, 'Últimos 30 dias'], [90, 'Últimos 90 dias'], [0, 'Todo o período']].map(([v, t]) => `<option value="${v}" ${+f.dias === v ? 'selected' : ''}>${t}</option>`).join('')}
        </select></label>
        <label><span>Cidade</span><select data-f="cidade"><option value="">Todas as cidades</option>${cidadesOpc.map((c) => `<option ${f.cidade === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label><span>Cenário</span><select data-f="cenario"><option value="">Todos</option>${[1, 2, 3].map((c) => `<option value="${c}" ${+f.cenario === c ? 'selected' : ''}>Cenário ${c}</option>`).join('')}</select></label>
      </div>

      <main class="pg">
        <section class="kpis" aria-label="Visão geral">
          ${kpi('Lojas cadastradas', n(K.cadastradas), f.dias ? 'no período' : 'no total')}
          ${kpi('Começaram', n(K.comecaram), `${pct(K.comecaram, K.cadastradas)} das cadastradas`)}
          ${kpi('Concluíram os 8 módulos', n(K.concluiram), `${pct(K.concluiram, K.comecaram)} de quem começou`, 'hl')}
          ${kpi('Em andamento', n(K.andamento), 'começaram e não terminaram')}
          ${kpi('Cadastraram e não começaram', n(K.naoComecaram), pct(K.naoComecaram, K.cadastradas) + ' das cadastradas')}
          ${kpi('Tempo para concluir', dur(K.tempoAtivo), `tempo de tela (mediana) · ${dias(K.tempoCal)}`)}
          ${kpi('Acessos', n(K.acessos), K.visitantesSemCadastro != null ? `${n(K.visitantesSemCadastro)} visitantes sem cadastro` : 'das lojas filtradas')}
          ${kpi('Ativas nos últimos 7 dias', n(K.ativos7), 'lojas com alguma atividade')}
        </section>

        ${destaques.length ? `<section class="card ins"><h2>Destaques automáticos</h2><ul>${destaques.map((d) => `<li>${d}</li>`).join('')}</ul></section>` : ''}

        <section class="card">
          <div class="card-h"><h2>Funil do treinamento</h2><p>Quantas lojas iniciaram e concluíram cada módulo. A linha destacada tem a menor taxa de conclusão.</p></div>
          ${graficoFunil(R)}
          <div class="drop">${R.etapas.slice(1).map((e, i) => { const a = R.etapas[i].v; const q = a ? (a - e.v) / a : 0; const pior = R.maiorQueda && R.maiorQueda.para === e; return `<div class="drop-i ${pior ? 'is-pior' : ''}" ${tipAttr(`<b>${esc(R.etapas[i].nome)} → ${esc(e.nome)}</b><br>${n(a)} → ${n(e.v)} (−${Math.round(q * 100)}%)`)}><small>${i === 0 ? 'Cad.→M1' : `M${i}→M${i + 1}`}</small><b>${a ? '−' + Math.round(q * 100) + '%' : '—'}</b></div>`; }).join('')}</div>
          <p class="note">Queda entre etapas: de quem cadastrou para quem concluiu o Módulo 1, e de um módulo concluído para o próximo.${R.maiorQueda ? ' Maior queda destacada.' : ''}</p>
        </section>

        <div class="cols">
          <section class="card">
            <div class="card-h"><h2>Onde as lojas param</h2><p>Último passo visto por quem saiu do módulo sem terminar.</p></div>
            ${R.abandonos.length ? `<table class="tb"><thead><tr><th>Passo</th><th class="num">Pararam</th><th class="num">% de quem viu</th></tr></thead><tbody>${R.abandonos.slice(0, 8).map((x) => `<tr><td class="ps">${nomePasso(x.m, x.p)}</td><td class="num">${n(x.c)}</td><td class="num">${pct(x.c, x.viu)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Ainda sem abandonos registrados.</p>'}
          </section>
          <section class="card">
            <div class="card-h"><h2>Passos mais demorados</h2><p>Tempo mediano em cada passo (mínimo de 3 registros).</p></div>
            ${R.lentos.length ? `<table class="tb"><thead><tr><th>Passo</th><th class="num">Mediana</th><th class="num">Registros</th></tr></thead><tbody>${R.lentos.slice(0, 8).map((x) => `<tr><td class="ps">${nomePasso(x.m, x.p)}</td><td class="num">${dur(x.med)}</td><td class="num">${n(x.nAmostra)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Sem dados suficientes.</p>'}
          </section>
        </div>

        <div class="cols">
          <section class="card">
            <div class="card-h"><h2>Exercício: acerto na 1ª tentativa</h2><p>Do pior para o melhor. Abaixo de 60% (marcado com !) indica assunto pouco entendido.</p></div>
            ${R.quiz.length ? barras(R.quiz, { valor: (x) => x.taxa * 100, max: 100, rotulo: (x) => `P${x.p} · ${x.q}`, fmt: (x) => `${pct(x.ok, x.tot)} <small>(${n(x.tot)})</small>`, alerta: (x) => x.taxa < 0.6 }) : '<p class="empty">Ninguém respondeu o exercício ainda.</p>'}
          </section>
          <section class="card">
            <div class="card-h"><h2>Etapas de clique puladas</h2><p>Quando a loja usa "Pular esta etapa" em vez de clicar na tela.</p></div>
            ${R.pulados.length ? `<table class="tb"><thead><tr><th>Passo</th><th class="num">Pularam</th><th class="num">% de quem viu</th></tr></thead><tbody>${R.pulados.slice(0, 8).map((x) => `<tr><td class="ps">${nomePasso(x.m, x.p)}</td><td class="num">${n(x.c)}</td><td class="num">${pct(x.c, x.viu)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Nenhuma etapa pulada.</p>'}
          </section>
        </div>

        <section class="card">
          <div class="card-h"><h2>Acessos e conclusões por dia</h2><p>Passe o dedo ou o mouse sobre o gráfico para ver cada dia.</p></div>
          <div id="linha"></div>
        </section>

        <div class="cols">
          <section class="card">
            <div class="card-h"><h2>Cidades com mais acessos</h2><p>Top 10 no período.</p></div>
            ${R.cidades.length ? barras(R.cidades.slice(0, 10), { valor: (x) => x.acessos, rotulo: (x) => x.cidade, fmt: (x) => n(x.acessos) }) : '<p class="empty">Sem acessos no período.</p>'}
          </section>
          <section class="card">
            <div class="card-h"><h2>Quando acessam</h2><p>Acessos por dia da semana e hora.</p></div>
            ${graficoCalor(R)}
          </section>
        </div>

        <section class="card">
          <div class="card-h"><h2>Cidades</h2><p>Ranking completo. Toque no cabeçalho para ordenar.</p></div>
          <div class="tb-wrap"><table class="tb" id="tb-cid"><thead><tr><th>Cidade</th><th class="num">Lojas</th><th class="num">Acessos</th><th class="num">Começaram</th><th class="num">Concluíram</th><th class="num">Conclusão</th></tr></thead>
          <tbody>${R.cidades.map((c) => `<tr><td>${esc(c.cidade)}</td><td class="num">${n(c.lojas)}</td><td class="num">${n(c.acessos)}</td><td class="num">${n(c.comecaram)}</td><td class="num">${n(c.concluiram)}</td><td class="num">${pct(c.concluiram, c.comecaram)}</td></tr>`).join('')}</tbody></table></div>
          ${R.semCadastro.length ? `<details class="sem"><summary>${n(R.semCadastro.length)} cidades ainda sem nenhuma loja cadastrada</summary><p>${R.semCadastro.map(esc).join(' · ')}</p></details>` : ''}
        </section>

        <section class="card">
          <div class="card-h"><h2>Perfil de uso</h2></div>
          <div class="pf">
            ${perfilBloco('Aparelho', R.perfil.dispositivo, K.cadastradas)}
            ${perfilBloco('Navegador', R.perfil.navegador, K.cadastradas)}
            ${perfilBloco('Cenário', R.perfil.cenario, K.cadastradas)}
            <div class="pf-b"><h3>Narração por voz</h3><p class="pf-big">${pct(R.perfil.voz, K.cadastradas)}</p><small>${n(R.perfil.voz)} lojas ligaram a narração</small></div>
            ${perfilBloco('Dicas mais abertas', R.perfil.dicas, Math.max(1, ...R.perfil.dicas.map((x) => x[1])), true)}
          </div>
        </section>

        <section class="card">
          <div class="card-h row"><div><h2>Lojas</h2><p>${n(R.lojas.length)} lojas no filtro.</p></div><div class="lj-act"><input type="search" id="lj-busca" placeholder="Buscar loja ou cidade" value="${esc(st.busca)}"><button class="btn" data-a="csv">Exportar CSV</button></div></div>
          <div class="tb-wrap" id="lj"></div>
        </section>
      </main>`;

    desenharLinha();
    desenharLojas();
  }

  function perfilBloco(titulo, lista, total, absoluto) {
    if (!lista.length) return `<div class="pf-b"><h3>${titulo}</h3><p class="empty">Sem dados.</p></div>`;
    const mx = Math.max(...lista.map((x) => x[1]));
    return `<div class="pf-b"><h3>${titulo}</h3>${lista.slice(0, 6).map(([k, v]) => `<div class="pf-r" ${tipAttr(`<b>${esc(k)}</b><br>${n(v)}${absoluto ? '' : ' · ' + pct(v, total)}`)}><span>${esc(k)}</span><div class="hb-track"><i style="width:${(v / mx) * 100}%;background:${COR.a}"></i></div><b>${absoluto ? n(v) : pct(v, total)}</b></div>`).join('')}</div>`;
  }

  function desenharLinha() {
    const el = document.getElementById('linha');
    if (!el) return;
    el.innerHTML = graficoLinha(st.R, el.clientWidth || 600);
  }

  const STATUS = { concluiu: ['Concluiu', 'ok'], andamento: ['Em andamento', 'warn'], nao: ['Não começou', 'off'] };
  function linhasLojas() {
    const b = st.busca.trim().toLowerCase();
    const rows = st.R.lojas.filter((s) => !b || s.p.loja.toLowerCase().includes(b) || s.p.cidade.toLowerCase().includes(b));
    const k = st.ordem.k, d = st.ordem.dir;
    const val = (s) => (k === 'loja' ? s.p.loja : k === 'cidade' ? s.p.cidade : k === 'cenario' ? s.p.cenario : k === 'prog' ? s.fim.size : k === 'status' ? s.status : s.ultimo);
    return rows.sort((a, c) => { const x = val(a), y = val(c); return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * d; });
  }
  const parouTxt = (s) => (!s.parou ? '—' : s.parou.proximo ? `Não abriu o Módulo ${s.parou.m}` : s.parou.p ? `M${s.parou.m} · ${tituloPasso(s.parou.m, s.parou.p)}` : `Módulo ${s.parou.m}`);

  function desenharLojas() {
    const el = document.getElementById('lj');
    if (!el) return;
    const rows = linhasLojas().slice(0, 300);
    const th = (k, t, num) => `<th class="${num ? 'num ' : ''}sort" data-k="${k}" aria-sort="${st.ordem.k === k ? (st.ordem.dir > 0 ? 'ascending' : 'descending') : 'none'}">${t}</th>`;
    el.innerHTML = `<table class="tb"><thead><tr>${th('loja', 'Loja')}${th('cidade', 'Cidade')}${th('cenario', 'Cen.', 1)}${th('prog', 'Progresso', 1)}${th('status', 'Status')}${th('ultimo', 'Último acesso')}<th>Parou em</th></tr></thead>
      <tbody>${rows.map((s) => `<tr><td>${esc(s.p.loja)}</td><td>${esc(s.p.cidade)}</td><td class="num">${s.p.cenario}</td>
        <td class="num"><span class="pg-mini"><i style="width:${(s.fim.size / NMOD) * 100}%"></i></span>${s.fim.size}/${NMOD}</td>
        <td><span class="badge ${STATUS[s.status][1]}">${STATUS[s.status][0]}</span></td><td>${dataHoraBR(s.ultimo)}</td><td class="pr">${esc(parouTxt(s))}</td></tr>`).join('')}</tbody></table>
      ${st.R.lojas.length > 300 ? '<p class="note">Mostrando 300 lojas. Use a busca ou exporte o CSV para ver todas.</p>' : ''}`;
  }

  function exportarCSV() {
    const cab = ['Loja', 'Cidade', 'Cenário', 'Módulos concluídos', 'Status', 'Último acesso', 'Parou em', 'Cadastro', 'Aparelho'];
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const linhas = linhasLojas().map((s) => [s.p.loja, s.p.cidade, s.p.cenario, s.fim.size, STATUS[s.status][0], dataHoraBR(s.ultimo), parouTxt(s), dataHoraBR(s.p.criado_em), s.p.dispositivo]);
    const csv = '﻿' + [cab].concat(linhas).map((l) => l.map(q).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `treinamento-lojas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ------------------------------ Interações ------------------------------ */
  root.addEventListener('change', (e) => {
    const s = e.target.closest('[data-f]');
    if (!s) return;
    st.filtros[s.dataset.f] = s.dataset.f === 'dias' ? +s.value : s.value;
    render();
  });
  root.addEventListener('input', (e) => { if (e.target.id === 'lj-busca') { st.busca = e.target.value; desenharLojas(); } });
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]');
    if (a) {
      if (a.dataset.a === 'atualizar') iniciar();
      else if (a.dataset.a === 'sair') { sessao.sair(); telaLogin(); }
      else if (a.dataset.a === 'csv') exportarCSV();
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
