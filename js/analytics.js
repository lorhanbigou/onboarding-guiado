/* =========================================================================
   ANALYTICS — coleta de eventos do treinamento
   - Cada aparelho tem um id (uuid). Ao cadastrar a loja, esse id vira o
     participante no banco. "Trocar loja" gera um id novo.
   - Os eventos entram numa fila no aparelho e são enviados em lote para o
     Supabase (API REST). Sem internet, ficam guardados e são reenviados.
   - Nada aqui trava o treinamento: qualquer falha é silenciosa.
   ========================================================================= */
(function () {
  const CFG = window.TREINO_ANALYTICS || {};
  const K_ID = 'bigou-treino-id';
  const K_PART = 'bigou-treino-participante';
  const K_FILA = 'bigou-treino-fila';
  const MAX_FILA = 2000, LOTE = 50;

  const ler = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function dispositivo() {
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    return coarse || window.innerWidth < 768 ? 'celular' : 'computador';
  }
  function navegador() {
    const u = navigator.userAgent;
    if (/Edg\//.test(u)) return 'Edge';
    if (/SamsungBrowser/.test(u)) return 'Samsung';
    if (/Firefox\//.test(u)) return 'Firefox';
    if (/Chrome\//.test(u)) return 'Chrome';
    if (/Safari\//.test(u)) return 'Safari';
    return 'Outro';
  }

  const An = {
    ativo: !!(CFG.url && CFG.anonKey),
    _fetch: (...a) => window.fetch(...a),
  };

  let id = ler(K_ID);
  if (!id) { id = uuid(); gravar(K_ID, id); }
  let fila = ler(K_FILA) || [];

  An.id = () => id;
  An.participante = () => ler(K_PART);
  An.fila = () => fila.slice();

  function enfileirar(item) {
    fila.push(item);
    if (fila.length > MAX_FILA) fila = fila.slice(-MAX_FILA);
    gravar(K_FILA, fila);
  }

  /** Cadastro da loja. Se já havia outra loja neste aparelho, começa um participante novo. */
  An.cadastrar = function (loja, cidade, cenario) {
    const atual = ler(K_PART);
    if (atual && (atual.loja !== loja || atual.cidade !== cidade)) { id = uuid(); gravar(K_ID, id); }
    const p = { id, loja, cidade, cenario, criado_em: new Date().toISOString() };
    gravar(K_PART, p);
    enfileirar({
      t: 'treino_participantes',
      row: { id, loja, cidade, cenario, dispositivo: dispositivo(), navegador: navegador(), criado_em: p.criado_em },
    });
    An.registrar('cadastro', { detalhe: { loja, cidade, cenario } });
    An.enviar();
    return p;
  };

  /** Registra um evento: registrar('passo', { modulo, passo, alvo, detalhe }) */
  An.registrar = function (tipo, d) {
    d = d || {};
    enfileirar({
      t: 'treino_eventos',
      row: {
        participante_id: id,
        tipo,
        modulo: d.modulo != null ? d.modulo : null,
        passo: d.passo != null ? d.passo : null,
        alvo: d.alvo || null,
        detalhe: d.detalhe || null,
        criado_em: new Date().toISOString(),
      },
    });
  };

  /* ------------------------------ Envio ------------------------------ */
  let enviando = false;
  An.enviar = async function (saindo) {
    if (!An.ativo || enviando || !fila.length || (navigator.onLine === false)) return;
    enviando = true;
    let ok = false;
    try {
      // Participantes antes dos eventos. Participante vai um por vez, com insert simples:
      // "já existe" (409) conta como enviado. (Upsert exigiria permissão de leitura pública.)
      for (const tabela of ['treino_participantes', 'treino_eventos']) {
        const itens = fila.filter((x) => x.t === tabela).slice(0, tabela === 'treino_participantes' ? 1 : LOTE);
        if (!itens.length) continue;
        const res = await An._fetch(`${CFG.url.replace(/\/$/, '')}/rest/v1/${tabela}`, {
          method: 'POST',
          keepalive: !!saindo,
          headers: {
            apikey: CFG.anonKey,
            Authorization: `Bearer ${CFG.anonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(itens.map((x) => x.row)),
        });
        const jaExiste = res && res.status === 409 && tabela === 'treino_participantes';
        if (!res || (!res.ok && !jaExiste)) throw new Error('envio falhou: ' + (res && res.status));
        fila = fila.filter((x) => !itens.includes(x));
        gravar(K_FILA, fila);
      }
      ok = true;
    } catch (e) {
      /* fica na fila; tenta de novo no próximo ciclo */
    } finally {
      enviando = false;
    }
    // Ainda sobrou fila e o envio deu certo: manda o próximo lote logo. Se falhou, espera o próximo ciclo.
    if (ok && !saindo && fila.length) setTimeout(() => An.enviar(), 300);
  };

  setInterval(() => An.enviar(), 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) An.enviar(true); });
  window.addEventListener('pagehide', () => An.enviar(true));
  window.addEventListener('online', () => An.enviar());

  TREINO.Analytics = An;
})();
