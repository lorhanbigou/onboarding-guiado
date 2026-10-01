/* =========================================================================
   TELA CLONADA — Relatório + Financeiro + modais
   A tela é totalmente clicável. O estado (página, modais abertos e se a
   fatura já foi antecipada) pode ser definido pelo tour ou pelo parceiro.
   ========================================================================= */
(function () {
  const F = TREINO.fmt;
  const pl = TREINO.pl;

  const I = {
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    caret: '<path d="M7 10l5 5 5-5z" fill="currentColor" stroke="none"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    funnel: '<path d="M4 5h16l-6 7.5V18l-4 2v-7.5z" fill="currentColor" stroke="none"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    cart: '<path d="M3 4h2.2l2.3 10.5h10.8L20.5 7H6.3"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    report: '<path d="M6 2.5h8.5L19 7v14.5H6z" fill="currentColor" stroke="none"/><path d="M9 11h7M9 14.5h7M9 18h4" stroke="#fff"/>',
    mega: '<path d="M3 10v4h3l8 4.5V5.5L6 10z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M6 14l1.5 5h2.5l-1-4.5"/>',
    piggy: '<path d="M5 11.5C5 8 8.2 6 12 6c1.6 0 3 .3 4.2 1L19 6v3.2c.8.8 1.3 1.7 1.5 2.8H22v3h-1.8c-.5 1-1.2 1.8-2.2 2.4V20h-3v-1.9c-1 .2-2 .2-3 0V20H9v-2.3C6.6 16.6 5 14.3 5 11.5z"/><circle cx="16" cy="10.5" r=".6" fill="currentColor"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><path d="M15 9.3c-.5-.9-1.6-1.4-3-1.4-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.4M12 6v12"/>',
    book: '<path d="M12 6.5C10.5 5.3 8.5 5 4 5v13c4.5 0 6.5.3 8 1.5 1.5-1.2 3.5-1.5 8-1.5V5c-4.5 0-6.5.3-8 1.5zM12 6.5v13"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.7"/><path d="M12 17h.01"/>',
    share: '<path d="M14 5l7 7-7 7v-4.2C8.5 14.8 5.3 16.5 3 20c.8-5.4 4-9.6 11-10.5z" fill="currentColor" stroke="none"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5" fill="currentColor" stroke="none"/><path d="M10 2.5h4M12 6V2.5M12 10v3.5l2 1.5" stroke="#fff"/><path d="M10 2.5h4" stroke="currentColor"/>',
    boleto: '<rect x="4" y="3" width="16" height="18" rx="1.5" fill="currentColor" stroke="none"/><path d="M8 8h8M8 12h8M8 16h8" stroke="#fff"/>',
    swap: '<path d="M4 9h14l-3.5-3.5M20 15H6l3.5 3.5"/>',
    chevr: '<path d="M9.5 6l6 6-6 6"/>',
    chevd: '<path d="M6 9.5l6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
    tag: '<path d="M3 12.5V4h8.5L21 13.5 12.5 22z" fill="currentColor" stroke="none"/><circle cx="7.5" cy="8" r="1.6" fill="#fff" stroke="none"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
  TREINO.ic = ic;

  // Valor em reais com suporte à animação de contagem
  const M = (c, pre = '') => `<span class="money" data-money="${c}" data-pre="${pre}">${pre}${F(c)}</span>`;
  TREINO.M = M;

  const info = (act, tour, label) =>
    `<button type="button" class="bx-info" data-act="${act}" ${tour ? `data-tour="${tour}"` : ''} aria-label="${label || 'Ver detalhes'}">i</button>`;
  // ⓘ que existe na tela real, mas cujo conteúdo não faz parte do treinamento
  const infoInert = (grey = true) => `<span class="bx-info ${grey ? 'grey' : ''}" aria-hidden="true">i</span>`;

  const PAY_TITLE = {
    online: 'Total pago com pagamento online',
    dinheiro: 'Total pago em dinheiro',
    maquininha: 'Total pago com maquininha de cartão',
  };
  const NAO = 'Esta área não faz parte do treinamento.';

  const Clone = { el: null, d: null, st: null, prev: [] };
  const mobile = () => window.innerWidth < 900;

  Clone.reset = function () {
    this.st = { page: 'relatorio', modals: [], antecipada: false, sidebar: window.innerWidth >= 1200 };
    this.prev = [];
  };

  Clone.mount = function (el, d) {
    this.el = el;
    this.d = d;
    if (!this.st) this.reset();
    if (this.st.antecipada) this.d = TREINO.calc(d.sc, { antecipada: true });
    if (!el.__bound) {
      el.addEventListener('click', (e) => this.onClick(e));
      el.__bound = true;
    }
    this.render();
  };

  /** Aplica um estado. Retorna true se algo mudou na tela. */
  Clone.set = function (patch) {
    const next = Object.assign({}, this.st, patch);
    if (patch.modals) next.modals = patch.modals.slice();
    if (patch.sidebar === undefined && 'page' in patch && mobile()) next.sidebar = false;
    if (JSON.stringify(next) === JSON.stringify(this.st)) return false;
    if (!!next.antecipada !== !!this.st.antecipada) this.d = TREINO.calc(this.d.sc, { antecipada: !!next.antecipada });
    this.st = next;
    this.render();
    return true;
  };

  Clone.onClick = function (e) {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    const s = this.st;
    if (act === 'toggle-sidebar') this.set({ sidebar: !s.sidebar });
    else if (act.startsWith('nav:')) this.set({ page: act.slice(4), modals: [], sidebar: mobile() ? false : s.sidebar });
    else if (act.startsWith('open:')) this.set({ modals: s.modals.concat(act.slice(5)) });
    else if (act === 'close') this.set({ modals: s.modals.slice(0, -1) });
    else if (act === 'toast') TREINO.toast(a.dataset.msg || NAO);
    else if (act === 'antecipar-confirm') {
      TREINO.toast('Antecipação solicitada. No treinamento, nenhum valor é enviado de verdade.');
      this.set({ modals: s.modals.slice(0, -1), antecipada: true });
    }
  };

  Clone.render = function () {
    const s = this.st, d = this.d;
    const html = `
      <div class="bx ${s.sidebar ? 'sb-open' : ''}">
        ${header()}
        <div class="bx-body">
          ${sidebar(s)}
          <div class="bx-scrim" data-act="toggle-sidebar"></div>
          <main class="bx-main">${s.page === 'financeiro' ? financeiro(d) : relatorio(d)}</main>
        </div>
        ${s.modals.map((m, i) => modal(m, d, i, !this.prev.includes(m))).join('')}
      </div>`;
    this.el.innerHTML = html;
    this.prev = s.modals.slice();
  };

  /* ------------------------------------------------------------------ */
  function header() {
    return `
    <header class="bx-header">
      <button type="button" class="bx-burger" data-act="toggle-sidebar" data-tour="burger" aria-label="Abrir menu">${ic('menu')}</button>
      <div class="bx-store" data-tour="store">
        <span class="bx-dot"></span>
        <div><b>LOJA DE TREINAMENTO</b><small>RIO POMBA - MG</small></div>
        ${ic('caret', 'caret')}
      </div>
      <div class="grow"></div>
      <button type="button" class="bx-open" data-act="toast" data-msg="No treinamento, a loja fica sempre fechada.">ABRIR LOJA</button>
      <div class="bx-user"><span>Olá, Parceiro</span>${ic('caret', 'caret')}</div>
    </header>`;
  }

  function sidebar(s) {
    const items = [
      ['home', 'Início'], ['cart', 'Pedidos'], ['report', 'Relatório', 'relatorio'], ['mega', 'Marketing', null, 3],
      ['piggy', 'Financeiro', 'financeiro'], ['star', 'Avaliações'], ['clock', 'Horário de Funcionamento'],
      ['pin', 'Taxa de Entrega'], ['dollar', 'Formas de Pagamento'], ['book', 'Cardápio'], ['bell', 'Notificações'],
      ['gear', 'Configurações'], ['help', 'Perguntas Frequentes'], ['share', 'Compartilhar'],
    ];
    return `
    <aside class="bx-side" aria-label="Menu">
      <div class="sd-cards">
        <div class="sd-card"><span>CONEXÃO</span><i class="sd-on"></i></div>
        <div class="sd-card"><span>TEMPO DE ENTREGA<small>(1 HORA, 25 MINUTOS)</small></span>${ic('timer')}</div>
        <div class="sd-card"><span>TEMPO DE RETIRADA<small>(1 HORA)</small></span>${ic('timer')}</div>
      </div>
      <nav class="sd-nav">
        ${items
          .map(([icon, label, page, badge]) => {
            const active = page && s.page === page ? 'active' : '';
            const slug = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '-');
            const act = page ? `data-act="nav:${page}" data-tour="nav-${page}"` : `data-act="toast" data-msg="${NAO}" data-tour="nav-${slug}"`;
            return `<button type="button" class="sd-item ${active}" ${act}>${ic(icon)}<span>${label}</span>${badge ? `<em>${badge}</em>` : ''}</button>`;
          })
          .join('')}
      </nav>
    </aside>`;
  }

  /* ------------------------------ RELATÓRIO ------------------------------ */
  function relatorio(d) {
    return `
    <div class="rp">
      <div class="rp-top">
        <div class="rp-search">${ic('search')}<span>Buscar pedidos por código ou nome do cliente</span></div>
        <button type="button" class="bx-btn rp-filter" data-act="toast" data-msg="No treinamento, o filtro fica fixo em Mês Atual.">${ic('funnel')} Filtros</button>
      </div>

      <section class="rp-totals" data-tour="rp-totals">
        <div class="rp-t" data-tour="rp-bruto">
          <div class="rp-l"><b>Total Bruto</b>${info('open:totalBruto', 'rp-bruto-info', 'Ver detalhes do Total Bruto')}</div>
          <div class="rp-v strong">${M(d.totalBruto)}</div>
        </div>
        <div class="rp-op">=</div>
        <div class="rp-t" data-tour="rp-liquido">
          <div class="rp-l">Total Líquido ${infoInert()}</div>
          <div class="rp-v">${M(d.totalLiquido)}</div>
          <small>(${pl(d.n, 'pedido', 'pedidos')})</small>
        </div>
        <div class="rp-op">+</div>
        <div class="rp-t" data-tour="rp-incentivos">
          <div class="rp-l">Incentivos do Bigou ${infoInert()}</div>
          <div class="rp-v">${M(d.incentivos)}</div>
          <small>(${pl(d.nIncentivos, 'cupom do Bigou', 'cupons do Bigou')})</small>
        </div>
        <div class="rp-chev">${ic('chevd')}</div>
      </section>

      <div class="rp-bar">
        <div class="rp-chip">Filtro aplicado: Mês Atual <span aria-hidden="true">✖</span></div>
        <button type="button" class="rp-export" data-act="toast" data-msg="${NAO}">Exportar</button>
      </div>

      <div class="rp-table" data-tour="rp-table">
        <div class="rp-scroll">
          <table>
            <thead><tr>
              <th>Pedido ↑</th><th>Entrega/Retirada</th><th>Valor Líquido</th><th>Valor Bruto</th>
              <th>Data</th><th>Status</th><th>Origem</th><th>Integração</th>
            </tr></thead>
            <tbody>${d.orders.map(row).join('')}</tbody>
          </table>
        </div>
        <div class="rp-foot">
          <span>Linhas por página:</span><b>25 ▾</b><span>1-${d.n} de ${d.n}</span><span class="rp-pg">‹</span><span class="rp-pg">›</span>
        </div>
      </div>
    </div>`;
  }

  function row(o) {
    return `
    <tr data-tour="row-${o.cod}" data-pay="${o.pag}">
      <td class="rp-ped"><b>Código: ${o.cod}</b><span>${o.cliente}</span><span>Loja de Treinamento</span><small>Rio Pomba - MG</small></td>
      <td>Entrega</td>
      <td class="nowrap">${o.cupom ? ic('tag', 'tag') : ''}${F(o.liquido)}</td>
      <td class="nowrap"><b>${F(o.bruto)}</b></td>
      <td class="nowrap">${o.data}</td>
      <td><span class="st st-ok">ENTREGA NOTIFICADA</span></td>
      <td><span class="st st-org">Bigou Delivery</span></td>
      <td>${ic('ban', 'ban')}</td>
    </tr>`;
  }

  /* ------------------------------ FINANCEIRO ------------------------------ */
  function badge(status) {
    return `<span class="badge ${status === 'VIGENTE' ? 'b-vig' : 'b-ant'}">${status}</span>`;
  }

  function financeiro(d) {
    const f = d.f, r = d.r;
    return `
    <div class="fn">
      <div class="fn-actions" data-tour="fin-botoes">
        <button type="button" class="fn-pill" data-act="open:boletos" data-tour="btn-boletos">${ic('boleto', 'g')} Boletos</button>
        <button type="button" class="fn-pill" data-act="open:repasses" data-tour="btn-repasses">${ic('swap', 'g')} Repasses</button>
      </div>
      <section class="fn-card">
        <div class="fn-head">
          <h2>Faturamento do Mês</h2>
          <button type="button" class="bx-btn sm" data-act="toast" data-msg="No treinamento, a fatura mostra sempre o mês atual.">${ic('funnel')} ${TREINO.config.mes}</button>
        </div>
        <div class="fn-res" data-tour="fin-res">
          <div class="fn-main" data-tour="fin-resultado"><span>Resultado</span><strong>${M(r.resultado)}</strong></div>
          <div class="fn-boxes" data-tour="fin-boxes">
            <div class="fn-box g" data-tour="fin-recebido"><b>${M(r.recebidoLoja)}</b><span>Recebido pela Loja</span></div>
            <div class="fn-box g" data-tour="fin-repasses"><b>${M(r.repassesRecebidos)}</b><span>Repasses recebidos</span></div>
            <div class="fn-box" data-tour="fin-disponivel"><b>${M(r.repasseDisponivel)}</b><span>Repasse disponível ${r.repasseDisponivel ? infoInert() : ''}</span></div>
          </div>
        </div>
        <hr>
        <div data-tour="fin-faturas">
          <h3 class="fn-sub">Faturas do Período</h3>
          <div class="fn-list">
            <button type="button" class="fn-fat" data-act="open:fatura" data-tour="fatura-item">
              <span>${f.inicio} - ${f.fim}</span>${badge(f.status)}${ic('chevr', 'chev')}
            </button>
          </div>
        </div>
      </section>
    </div>`;
  }

  /* ------------------------------ MODAIS ------------------------------ */
  function modal(id, d, i, enter) {
    const body = (MODALS[id] || (() => ''))(d);
    return `
    <div class="md ${enter ? 'md-enter' : ''}" style="z-index:${60 + i}" data-modal="${id}">
      <div class="md-bg" data-act="close"></div>
      <div class="md-card md-${id}" role="dialog" aria-modal="true">${body}</div>
    </div>`;
  }

  const head = (title, extra = '') => `
    <div class="md-head"><div>${title}${extra}</div><button type="button" class="md-x" data-act="close" aria-label="Fechar">${ic('x')}</button></div>`;

  const MODALS = {
    totalBruto(d) {
      const b = (k) => {
        const p = d.pay[k];
        return `
        <div class="tb-b" data-tour="tb-${k}">
          <div class="tb-t">${PAY_TITLE[k]}</div>
          <div class="tb-r"><span>${pl(p.n, 'pedido', 'pedidos')}</span><b class="pos">${M(p.itens, '+')}</b></div>
          <div class="tb-r"><span>${pl(p.nTaxas, 'taxa de serviço', 'taxas de serviço')}</span><b class="pos">+${F(p.taxas)}</b></div>
        </div>`;
      };
      return `${head('<h3>Total Bruto</h3>')}
      <div class="md-content">
        <div class="tb-list" data-tour="tb-list">${b('online')}${b('dinheiro')}${b('maquininha')}</div>
        <div class="tb-tot" data-tour="tb-total">
          <div class="tb-r"><span>Total de ${pl(d.n, 'pedido', 'pedidos')}</span><b class="pos">+${F(d.all.itens)}</b></div>
          <div class="tb-r" data-tour="tb-taxas"><span>Total de ${pl(d.all.nTaxas, 'taxa de serviço', 'taxas de serviço')}</span><b class="pos">+${F(d.all.taxas)}</b></div>
          <div class="tb-r big"><b>Total Bruto</b><b>${M(d.totalBruto)}</b></div>
        </div>
      </div>`;
    },

    fatura(d) {
      const f = d.f;
      const line = (tour, label, v, sign) =>
        `<div class="fa-l" data-tour="${tour}"><div class="fa-lt">${label}</div><b class="fa-lv ${sign === '+' ? 'pos' : ''}">${M(v, sign === '+' ? '+ ' : '- ')}</b></div>`;
      return `
      <div class="md-head fa-head">
        <div data-tour="fa-titulo"><h3 class="fa-title">Fatura - ${TREINO.config.mesExtenso}</h3><small>${f.inicio} - ${f.fim}</small></div>
        <div class="fa-hr"><span data-tour="fa-status">${badge(f.status)}</span><button type="button" class="md-x" data-act="close" aria-label="Fechar">${ic('x')}</button></div>
      </div>
      <div class="md-content">
        <h4 class="fa-sec">Cálculo do Repasse ou Boleto</h4>
        <div class="fa-box" data-tour="fl-box">
          <div class="fa-group" data-tour="fl-entradas">
          ${line('fl-liquido-online', `Valor líquido de <b>${pl(f.nOnline, 'venda confirmada', 'vendas confirmadas')} com pagamento online</b>`, f.liquidoOnline, '+')}
          ${line('fl-incentivos', `Reembolso dos incentivos usados em <b>${pl(f.nReembolso, 'venda', 'vendas')}</b> ${infoInert(false)}`, f.reembolso, '+')}
          ${line('fl-taxas-online', `Valor das <b>taxas de serviço</b> advindas de <b>${pl(f.nTaxasOnline, 'venda confirmada', 'vendas confirmadas')} com pagamento online</b><small>(valor pago pelo cliente e repassado para a plataforma)</small>`, f.taxasOnline, '+')}
          </div>
          <div class="fa-debits" data-tour="fl-cobrancas">
            ${f.debitoRemanescente ? line('fl-debitos', 'Débitos remanescentes', f.debitoRemanescente, '-') : ''}
            ${line('fl-comissao', `Comissão ${info('open:comissao', 'fl-comissao-info', 'Ver cálculo da comissão')}`, f.comissao, '-')}
            ${line('fl-taxa-online', `Taxa do pagamento online ${info('open:taxaOnline', 'fl-taxa-online-info', 'Ver cálculo da taxa do pagamento online')}`, f.taxaOnline, '-')}
            ${line('fl-transferencia', 'Taxa de transferência', f.transferencia, '-')}
            ${line('fl-antecipacao', 'Taxa de antecipação', f.taxaAntecipacao, '-')}
            ${line('fl-taxa-servico', `Taxa de serviço ${info('open:taxaServico', 'fl-taxa-servico-info', 'Ver cálculo da taxa de serviço')}`, f.taxaServico, '-')}
            ${f.mensalidade ? line('fl-mensalidade', 'Mensalidade', f.mensalidade, '-') : ''}
          </div>
        </div>
        <div class="fa-total" data-tour="fl-total"><b>${f.tipo}</b><b class="${f.total >= 0 ? 'pos' : 'neg'}">${M(Math.abs(f.total))}</b></div>
        ${
          f.status === 'VIGENTE'
            ? `<div class="fa-ant"><button type="button" class="fa-ant-link" data-act="open:antecipacao" data-tour="btn-antecipar">Solicitar antecipação ${ic('arrow')}</button></div>`
            : ''
        }
      </div>`;
    },

    comissao(d) {
      const f = d.f, a = d.all;
      return `${head('<h3>Cálculo da Comissão</h3>')}
      <div class="md-content">
        <div class="cm-sec">Cálculo do total bruto</div>
        <div class="cm-grey" data-tour="cm-vendas">
          <div><span><b>${pl(a.n, 'venda', 'vendas')}</b> confirmadas</span><small>(incluindo: ${a.nCupons} cupons + 0 subsídios + ${a.nTaxas} taxas de serviço)</small></div>
          <b class="pos">${M(a.bruto, '+ ')}</b>
        </div>
        <div class="cm-card" data-tour="cm-bruto"><div><b>Total bruto de ${pl(a.n, 'venda', 'vendas')}</b><small>(${a.n} confirmadas)</small></div><b>${F(a.bruto)}</b></div>
        <div class="cm-card" data-tour="cm-taxa"><b>Taxa de serviço de ${a.nTaxas} vendas confirmadas</b><b>- ${F(a.taxas)}</b></div>
        <div class="cm-card" data-tour="cm-base"><b>Base de cálculo da comissão</b><b>${M(f.baseComissao)}</b></div>
        <div class="cm-card" data-tour="cm-comissao"><b>Comissão</b><b>${M(f.comissao)}</b></div>
      </div>`;
    },

    taxaOnline(d) {
      const f = d.f, on = d.pay.online;
      return `${head('<h3>Taxa de Pagamento Online</h3>')}
      <div class="md-content">
        <div class="cm-sec">Cálculo do total bruto com pagamento online</div>
        <div class="cm-grey" data-tour="to-vendas">
          <div><span><b>${pl(on.n, 'venda', 'vendas')}</b> com pagamento online confirmadas</span><small>(incluindo: ${on.nCupons} cupons + 0 subsídios + ${on.nTaxas} taxas de serviço)</small></div>
          <b class="pos">${M(on.bruto, '+ ')}</b>
        </div>
        <div class="cm-card" data-tour="to-bruto"><b>Total bruto de ${pl(on.n, 'venda', 'vendas')} com pagamento online</b><b>${M(on.bruto)}</b></div>
        <div class="cm-card" data-tour="to-taxa"><b>Taxa de serviço de ${on.nTaxas} vendas confirmadas</b><b>- ${F(on.taxas)}</b></div>
        <div class="cm-group" data-tour="to-calc">
          <div class="cm-card" data-tour="to-base"><b>Base de cálculo da taxa de pagamento online</b><b>${M(f.baseOnline)}</b></div>
          <div class="cm-card" data-tour="to-final"><b>Taxa de pagamento online</b><b>${M(f.taxaOnline)}</b></div>
        </div>
      </div>`;
    },

    taxaServico(d) {
      const f = d.f, p = d.pay;
      const r = (k, label) => `<div class="ts-r"><span><b>${pl(p[k].nTaxas, 'venda', 'vendas')}</b> ${label}</span><b>-${F(p[k].taxas)}</b></div>`;
      return `${head('<h3>Taxa de Serviço</h3>', `<span class="ts-link">O que é Taxa de Serviço?</span>`)}
      <div class="md-content">
        <div class="cm-sec">Cálculo do total de taxas de serviço</div>
        <div class="cm-grey col" data-tour="ts-rows">
          <div data-tour="ts-online">${r('online', 'confirmadas com pagamento online')}</div>
          <div data-tour="ts-offline">${r('dinheiro', 'confirmadas em dinheiro')}${r('maquininha', 'confirmadas com maquininha de cartão')}</div>
        </div>
        <div class="cm-card" data-tour="ts-soma"><b>Total das taxas de ${d.all.nTaxas} vendas confirmadas</b><b>-${F(d.all.taxas)}</b></div>
        <div class="cm-card" data-tour="ts-devolvido"><div><b>Valor da taxa de maquininha de cartão devolvido</b><small>(${Math.round(TREINO.config.taxas.devolucaoMaquininha * 100)}% de ${F(p.maquininha.taxas)} referentes a ${pl(p.maquininha.nTaxas, 'venda realizada', 'vendas realizadas')} com maquininha de cartão)</small></div><b class="pos">+${F(f.devolucao)}</b></div>
        <div class="cm-card" data-tour="ts-total"><b>Valor repassado para a plataforma</b><b>${M(f.taxaServico)}</b></div>
      </div>`;
    },


    antecipacao(d) {
      const f = d.f;
      return `${head('<h3>Antecipação</h3>')}
      <div class="md-content">
        <div class="an-box" data-tour="ant-box"><b>Valor a receber: ${F(f.total)}</b><span>Período de apuração: ${f.inicio} - ${f.fim}.</span></div>
        <ul class="an-list">
          <li data-tour="ant-data">A transferência do valor antecipado ocorrerá no dia <u>${d.sc.antecipacaoData} (próximo dia útil)</u>, e será enviada para a chave PIX 000.000.000-00.</li>
          <li>Feriados municipais da cidade de Rio Pomba (sede da empresa) não são considerados como dia útil.</li>
          <li>Para evitar atrasos no recebimento, certifique-se que os dados bancários estão corretos e em nome da pessoa física ou jurídica titular do contrato.</li>
          <li data-tour="ant-aviso">Ao clicar em CONFIRMAR, o sistema efetivará a contabilidade de todos os pedidos confirmados e compreendidos no período de apuração. Sendo assim, não será possível solicitar o cancelamento destes pedidos.</li>
        </ul>
        <div class="an-actions">
          <button type="button" class="bx-btn" data-act="antecipar-confirm" data-tour="btn-confirmar">CONFIRMAR</button>
          <button type="button" class="an-close" data-act="close">FECHAR</button>
        </div>
      </div>`;
    },

    boletos() {
      return `${head('<h3>Boletos</h3>')}
      <div class="md-content"><p class="md-empty" data-tour="bol-empty">Você não possui boletos pendentes</p></div>`;
    },

    repasses() {
      return `${head('<h3>Repasses</h3>')}
      <div class="md-content"><p class="md-empty" data-tour="rep-list">Você não possui nenhum repasse</p></div>`;
    },
  };


  TREINO.Clone = Clone;
})();
