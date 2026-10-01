/* =========================================================================
   NARRAÇÃO (opcional) — voz em português do Brasil
   Usa a voz do próprio aparelho (Web Speech API): grátis e sem internet.

   Regras de fluidez:
   - cada balão é falado UMA vez e a fala para no fim do bloco;
   - só uma frase fica na fila do navegador por vez (a próxima é agendada
     no fim da anterior), o que evita falas repetidas ou "ressuscitadas";
   - toda fala nova invalida a anterior (token de sessão);
   - só o botão "Ouvir de novo" repete um balão.
   ========================================================================= */
(function () {
  const KEY = 'bigou-treino-voz';
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  // Vozes "divertidas" do macOS/iOS: soam robóticas, nunca usar
  const ROBOTICAS = /eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox/i;

  let synth = window.speechSynthesis;
  let Utt = window.SpeechSynthesisUtterance;

  const Voz = {
    voz: null,
    ligada: false,
    disponivel: !!(synth && Utt),
    estado: 'parado',
    ritmo: 0.95,
    ouvintes: [],
    ouvintesEstado: [],
  };

  try { Voz.ligada = localStorage.getItem(KEY) === '1'; } catch (e) { /* sem armazenamento */ }

  /* ------------------------------ Escolha da voz ------------------------------ */
  function escolherVoz() {
    if (!Voz.disponivel) return;
    const todas = synth.getVoices().filter((v) => !ROBOTICAS.test(v.name));
    const br = todas.filter((v) => /^pt[-_]BR/i.test(v.lang));
    const pt = br.length ? br : todas.filter((v) => /^pt/i.test(v.lang));
    const pref = [
      /natural|online/i,               // vozes neurais do Edge/Windows (Francisca, Thalita…)
      /premium|aprimorad|enhanced/i,   // vozes de alta qualidade do Mac/iPhone
      /google/i,                       // Chrome: "Google português do Brasil"
      /luciana/i,
      /francisca|thalita|antonio|daniel/i,
    ];
    let melhor = null;
    for (const re of pref) { melhor = pt.find((v) => re.test(v.name)); if (melhor) break; }
    Voz.voz = melhor || pt[0] || null;
    Voz.ouvintes.forEach((f) => f());
  }
  if (Voz.disponivel) {
    escolherVoz();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', escolherVoz);
  }

  Voz.temVozPt = () => Voz.disponivel && !!Voz.voz;
  Voz.aoMudar = (f) => Voz.ouvintes.push(f);
  Voz.aoEstado = (f) => Voz.ouvintesEstado.push(f);
  function setEstado(e) {
    if (Voz.estado === e) return;
    Voz.estado = e;
    Voz.ouvintesEstado.forEach((f) => f(e));
  }

  /* ------------------------------ Pronúncia ------------------------------ */
  function reais(txt) {
    const [int, cent] = txt.replace(/\./g, '').split(',');
    const r = parseInt(int, 10) || 0, c = parseInt(cent || '0', 10);
    if (!r && !c) return 'zero reais';
    const pr = r ? `${r} ${r === 1 ? 'real' : 'reais'}` : '';
    const pc = c ? `${c} ${c === 1 ? 'centavo' : 'centavos'}` : '';
    return [pr, pc].filter(Boolean).join(' e ');
  }
  const data = (d, m) => `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]}`;

  Voz.falavel = function (t) {
    return String(t)
      // "de 01/09/2026 até 27/09/2026" → "de 1 a 27 de setembro"
      .replace(/\b(\d{2})\/(\d{2})\/\d{4}\s+(?:até|a|-)\s+(\d{2})\/(\d{2})\/\d{4}\b/g, (m, d1, m1, d2, m2) =>
        m1 === m2 ? `${parseInt(d1, 10)} a ${data(d2, m2)}` : `${data(d1, m1)} a ${data(d2, m2)}`)
      .replace(/\b(\d{2})\/(\d{2})\/\d{4}\b/g, (m, d, mm) => data(d, mm))
      // valores: o sinal da tela não é falado
      .replace(/(?:[+\-−]\s?)?R\$\s?([\d.]+,\d{2})/g, (m, v) => reais(v))
      .replace(/(\d),(\d+)\s?%/g, '$1 vírgula $2 por cento')
      .replace(/(\d)\s?%/g, '$1 por cento')
      .replace(/ⓘ/g, 'ícone de informação')
      .replace(/\bonline\b/gi, 'on-line')
      // palavras em MAIÚSCULAS seriam soletradas
      .replace(/\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}\b/g, (w) => w.toLowerCase())
      .replace(/\s*\(([^)]*)\)/g, ', $1,')
      .replace(/\s×\s/g, ' vezes ')
      .replace(/\s[−-]\s/g, ' menos ')
      .replace(/\s=\s/g, ' igual a ')
      .replace(/\s\+\s/g, ' mais ')
      .replace(/[✓✖●•→←"“”]/g, ' ')
      .replace(/,\s*([.,:;!?])/g, '$1')
      .replace(/\s+([.,:;!?])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[a-zà-ú]/, (c) => c.toUpperCase());
  };

  /* ------------------------------ Roteiro falado ------------------------------ */
  const semHtml = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' ').trim(); };
  const ponto = (s) => (s && !/[.!?:]$/.test(s) ? s + '.' : s);
  const minusc = (s) => (s && !/^[A-Z]{2}/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim();
  const F = (c) => TREINO.fmt(c);

  // Artigo para soar natural: "menos as deduções", "o repasse fica em…"
  const FEM = ['taxa', 'comissao', 'base', 'mensalidade', 'deducao', 'venda', 'devolucao', 'maquininha'];
  const MASC = ['repasse', 'resultado', 'total', 'valor', 'recebido', 'reembolso', 'pagamento', 'dinheiro', 'produto', 'cupom', 'debito'];
  function comArtigo(l) {
    const w = norm(l.split(/\s+/)[0] || '');
    const plural = /s$/.test(w);
    const sing = w.replace(/oes$/, 'ao').replace(/s$/, '');
    if (FEM.includes(sing)) return (plural ? 'as ' : 'a ') + minusc(l);
    if (MASC.includes(sing)) return (plural ? 'os ' : 'o ') + minusc(l);
    return minusc(l);
  }

  // Conta do balão → frase corrida
  function contaFalada(rows) {
    const val = (r) => (r.v != null ? F(r.v) : r.txt || '');
    const total = rows.find((r) => r.total);
    if (rows.length > 5 && total) return `Somando tudo, ${comArtigo(total.l)} fica em ${val(total)}.`;
    const semOp = rows.every((r) => !r.op);
    if (semOp) return rows.map((r) => `${r.l}: ${val(r)}`).join('; ') + '.';
    let s = '';
    rows.forEach((r, i) => {
      const v = val(r);
      if (r.op === '=') s += `${i ? '. ' : ''}${r.total ? 'Assim, ' : ''}${comArtigo(r.l)} fica em ${v}`;
      else if (r.op === '×') s += `, vezes ${r.txt || v}`;
      else if (r.op === '+') s += `, mais ${comArtigo(r.l)}, ${v}`;
      else if (r.op === '−' || r.op === '-') s += `, menos ${comArtigo(r.l)}, ${v}`;
      else s += `${i ? '. ' : ''}${r.l}, ${v}`;
    });
    // Letra maiúscula depois de ponto
    return ponto(s.replace(/^\.\s/, '').replace(/\.\s([a-zà-ú])/g, (m, c) => '. ' + c.toUpperCase()));
  }

  function listaFalada(itens) {
    if (itens.length === 1) return itens[0];
    return itens.slice(0, -1).join(', ') + ' ou ' + itens[itens.length - 1];
  }

  /** Monta as frases de um passo do tour (objeto do passo, não o HTML) */
  Voz.roteiro = function (p) {
    if (!p) return [];
    if (p.fala) return [].concat(typeof p.fala === 'function' ? p.fala() : p.fala);
    const partes = [];
    const add = (s) => { s = ponto(String(s || '').trim()); if (s) partes.push(s); };

    const titulo = p.title ? semHtml(p.title) : '';
    const bodyHtml = typeof p.body === 'function' ? p.body() : p.body || '';
    const frases = bodyHtml ? bodyHtml.split(/<br\s*\/?>/i).map(semHtml).filter(Boolean) : [];

    // Título sem redundância: pula se o texto já começa com ele; vira introdução se o texto começa com um valor
    if (titulo && !/^pergunta \d/i.test(titulo)) {
      const t = norm(titulo), f0 = frases[0] ? norm(frases[0]) : '';
      if (frases[0] && /^R\$/.test(frases[0])) frases[0] = `${titulo}: ${frases[0]}`;
      else if (!f0.startsWith(t)) add(titulo);
    }
    frases.forEach(add);
    if (p.calc) add(contaFalada(p.calc));
    if (p.foot) add(semHtml(p.foot));
    if (p.mode === 'click' && p.hint && !/clique/i.test(bodyHtml)) add(p.hint);
    if (p.mode === 'quiz') {
      add(semHtml(p.q));
      const ops = p.options.map((o) => semHtml(o.t));
      const curtas = ops.every((o) => o.split(' ').length <= 6);
      if (curtas) add(`${listaFalada(ops)}?`);
      else ops.forEach((o, i) => add(`${i && i === ops.length - 1 ? 'Ou opção' : 'Opção'} ${i + 1}: ${o}`));
    }
    return partes;
  };

  /* ------------------------------ Controlador de fala ------------------------------ */
  let sessao = 0, fila = [], timer = 0, vigia = 0, ultimaChave = null;

  Voz.parar = function () {
    sessao++;
    fila = [];
    clearTimeout(timer);
    clearTimeout(vigia);
    if (Voz.disponivel && (synth.speaking || synth.pending)) synth.cancel();
    setEstado('parado');
  };

  function proxima(minha) {
    if (minha !== sessao) return;
    clearTimeout(vigia);
    const frase = fila.shift();
    if (!frase) { setEstado('parado'); return; }       // fim do bloco: para aqui
    const u = new Utt(frase);
    u.voice = Voz.voz;
    u.lang = Voz.voz.lang;
    u.rate = Voz.ritmo;
    u.pitch = 1;
    let feito = false;
    const fim = () => {
      if (feito || minha !== sessao) return;
      feito = true;
      timer = setTimeout(() => proxima(minha), 90);  // pausa curta entre frases
    };
    u.onend = fim;
    u.onerror = () => { if (minha === sessao) { fila = []; setEstado('parado'); } };
    // Vigia: alguns navegadores não disparam "onend"; segue só quando a voz realmente parou
    const checar = () => {
      if (minha !== sessao || feito) return;
      if (synth.speaking || synth.pending) vigia = setTimeout(checar, 700);
      else fim();
    };
    vigia = setTimeout(checar, 1200 + frase.length * 85);
    setEstado('falando');
    synth.speak(u);
  }

  /** Fala as frases uma vez. Interrompe qualquer fala anterior. */
  Voz.falar = function (partes) {
    if (!Voz.ligada || !Voz.temVozPt()) return;
    Voz.parar();
    const minha = sessao;
    fila = [].concat(partes).map(Voz.falavel).filter(Boolean);
    if (!fila.length) return;
    timer = setTimeout(() => proxima(minha), 140);    // espera o cancelamento terminar
  };

  /** Fala um passo do tour uma única vez (a mesma chave não repete, a não ser com forcar) */
  Voz.falarPasso = function (chave, partes, opcoes) {
    if (!(opcoes && opcoes.forcar) && chave === ultimaChave) return;
    ultimaChave = chave;
    Voz.falar(partes);
  };
  Voz.esquecerPasso = () => { ultimaChave = null; };

  Voz.ligar = function (on) {
    Voz.ligada = !!on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* sem armazenamento */ }
    if (!on) Voz.parar();
    Voz.ouvintes.forEach((f) => f());
  };

  // Para testes: troca o motor de fala por um simulado
  Voz._usarMotor = function (s, U) { synth = s; Utt = U; Voz.disponivel = true; escolherVoz(); };

  document.addEventListener('visibilitychange', () => { if (document.hidden) Voz.parar(); });
  window.addEventListener('pagehide', () => Voz.parar());
  TREINO.Voz = Voz;
})();
