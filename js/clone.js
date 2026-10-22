/* =========================================================================
   TELA CLONADA — Pedidos + Relatório + Financeiro + modais
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
    android: '<path d="M6 10.5a6 6 0 0 1 12 0v.5H6z" fill="currentColor" stroke="none"/><rect x="6" y="12" width="12" height="7.5" rx="1.5" fill="currentColor" stroke="none"/><path d="M8.5 5.5L7 3.5M15.5 5.5L17 3.5"/>',
    refresh: '<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M19 4.5V9h-4.5"/>',
    pessoa: '<circle cx="12" cy="9.5" r="4" fill="currentColor" stroke="none"/><path d="M4.5 21c.8-4 3.8-6.5 7.5-6.5s6.7 2.5 7.5 6.5z" fill="currentColor" stroke="none"/>',
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
  TREINO.ic = ic;

  // Valor em reais com suporte à animação de contagem
  const M = (c, pre = '') => `<span class="money" data-money="${c}" data-pre="${pre}">${pre}${F(c)}</span>`;
  TREINO.M = M;

  const info = (act, tour, label) =>
    `<button type="button" class="bx-info" data-act="${act}" ${tour ? `data-tour="${tour}"` : ''} aria-label="${label || L('Ver detalhes', 'Ver detalles')}">i</button>`;
  // ⓘ que existe na tela real, mas cujo conteúdo não faz parte do treinamento
  const infoInert = (grey = true) => `<span class="bx-info ${grey ? 'grey' : ''}" aria-hidden="true">i</span>`;

  const PAY_TITLE = {
    online: L('Total pago com pagamento online', 'Total pagado con pago online'),
    dinheiro: L('Total pago em dinheiro', 'Total pagado en efectivo'),
    maquininha: L('Total pago com maquininha de cartão', 'Total pagado con POS'),
  };
  const NAO = L('Esta área não faz parte do treinamento.', 'Esta área no forma parte de la capacitación.');

  const Clone = { el: null, d: null, st: null, prev: [] };
  const mobile = () => window.innerWidth < 900;

  Clone.reset = function () {
    // repassado: a transferência da fatura antecipada já caiu (mostra o comprovante)
    this.st = { page: 'relatorio', modals: [], antecipada: false, repassado: false, sidebar: window.innerWidth >= 1200 };
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
      TREINO.toast(L('Antecipação solicitada. No treinamento, nenhum valor é enviado de verdade.', 'Anticipo solicitado. En la capacitación, no se envía ningún valor de verdad.'));
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
          <main class="bx-main pg-${s.page}">${s.page === 'financeiro' ? financeiro(d) : s.page === 'pedidos' ? pedidos(d) : relatorio(d)}</main>
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
      <button type="button" class="bx-burger" data-act="toggle-sidebar" data-tour="burger" aria-label="${L('Abrir menu', 'Abrir menú')}">${ic('menu')}</button>
      <div class="bx-store" data-tour="store">
        <span class="bx-dot"></span>
        <div><b>${L('LOJA DE TREINAMENTO', 'TIENDA DE CAPACITACIÓN')}</b><small>RIO POMBA - MG</small></div>
        ${ic('caret', 'caret')}
      </div>
      <div class="grow"></div>
      <button type="button" class="bx-open" data-act="toast" data-msg="${L('No treinamento, a loja fica sempre fechada.', 'En la capacitación, la tienda siempre está cerrada.')}">${L('ABRIR LOJA', 'ABRIR TIENDA')}</button>
      <div class="bx-user"><span>${L('Olá, Parceiro', 'Hola, Socio')}</span>${ic('caret', 'caret')}</div>
    </header>`;
  }

  // Nomes do menu em espanhol (o data-tour continua vindo do nome em português)
  const MENU_ES = {
    'Início': 'Inicio', 'Pedidos': 'Pedidos', 'Relatório': 'Informe', 'Marketing': 'Marketing', 'Financeiro': 'Finanzas',
    'Avaliações': 'Reseñas', 'Horário de Funcionamento': 'Horario de Atención', 'Taxa de Entrega': 'Tarifa de Envío',
    'Formas de Pagamento': 'Formas de Pago', 'Cardápio': 'Menú', 'Notificações': 'Notificaciones', 'Configurações': 'Configuración',
    'Perguntas Frequentes': 'Preguntas Frecuentes', 'Compartilhar': 'Compartir', 'Baixar App Android': 'Descargar App Android',
  };

  function sidebar(s) {
    const items = [
      ['home', 'Início'], ['cart', 'Pedidos', 'pedidos'], ['report', 'Relatório', 'relatorio'], ['mega', 'Marketing', null, 2],
      ['piggy', 'Financeiro', 'financeiro'], ['star', 'Avaliações'], ['clock', 'Horário de Funcionamento'],
      ['pin', 'Taxa de Entrega'], ['dollar', 'Formas de Pagamento'], ['book', 'Cardápio'], ['bell', 'Notificações'],
      ['gear', 'Configurações'], ['help', 'Perguntas Frequentes'], ['share', 'Compartilhar'], ['android', 'Baixar App Android'],
    ];
    return `
    <aside class="bx-side" aria-label="${L('Menu', 'Menú')}">
      <div class="sd-cards">
        <div class="sd-card"><span>${L('CONEXÃO', 'CONEXIÓN')}</span><i class="sd-on"></i></div>
        <div class="sd-card"><span>${L('TEMPO DE ENTREGA', 'TIEMPO DE ENTREGA')}<small>(1 HORA, 25 MINUTOS)</small></span>${ic('timer')}</div>
        <div class="sd-card"><span>${L('TEMPO DE RETIRADA', 'TIEMPO DE RETIRO')}<small>(1 HORA)</small></span>${ic('timer')}</div>
      </div>
      <nav class="sd-nav">
        ${items
          .map(([icon, label, page, badge]) => {
            const active = page && s.page === page ? 'active' : '';
            const slug = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '-');
            const act = page ? `data-act="nav:${page}" data-tour="nav-${page}"` : `data-act="toast" data-msg="${NAO}" data-tour="nav-${slug}"`;
            return `<button type="button" class="sd-item ${active}" ${act}>${ic(icon)}<span>${L(label, MENU_ES[label])}</span>${badge ? `<em>${badge}</em>` : ''}</button>`;
          })
          .join('')}
      </nav>
    </aside>`;
  }

  /* ------------------------------ PEDIDOS ------------------------------ */
  function pedidos(d) {
    const lista = d.sc.pedidosHoje || [];
    const aguardando = lista.filter((p) => p.status === 'confirmacao').length;
    const ST = { confirmacao: L('AGUARDANDO CONFIRMAÇÃO', 'ESPERANDO CONFIRMACIÓN'), entrega: L('AGUARDANDO ENTREGA', 'EN CAMINO') };
    const MSG = {
      confirmacao: L('No sistema, você abre o pedido para aceitar ou recusar. No treinamento, os pedidos não podem ser abertos.', 'En el sistema, abres el pedido para aceptarlo o rechazarlo. En la capacitación, los pedidos no se pueden abrir.'),
      entrega: L('No treinamento, os pedidos não podem ser abertos.', 'En la capacitación, los pedidos no se pueden abrir.'),
    };
    return `
    <div class="pd">
      <div class="pd-head" data-tour="pd-head">
        <h2>${aguardando ? pl(aguardando, L('pedido aguardando confirmação', 'pedido esperando confirmación'), L('pedidos aguardando confirmação', 'pedidos esperando confirmación')) : L('Nenhum pedido aguardando confirmação', 'Ningún pedido esperando confirmación')}</h2>
        <button type="button" class="pd-refresh" data-act="toast" data-msg="${L('A lista de pedidos se atualiza sozinha.', 'La lista de pedidos se actualiza sola.')}" aria-label="${L('Atualizar', 'Actualizar')}">${ic('refresh')}</button>
      </div>
      <div class="pd-list" data-tour="pd-list">
        ${lista.map((p) => `
        <button type="button" class="pd-row ${p.status === 'confirmacao' ? 'pd-wait' : ''}" data-act="toast" data-msg="${MSG[p.status]}" data-tour="pd-${p.status === 'confirmacao' ? 'aguardando' : p.cod}">
          <span class="pd-av">${ic('pessoa')}</span>
          <span class="pd-info"><b>${p.cliente}</b><span>${TREINO.config.loja.nome}</span><small>Rio Pomba - MG</small><em>Bigou Delivery</em></span>
          <span class="pd-right">
            <span class="pd-boxes">
              <span class="pd-box"><b>PEDIDO: ${p.cod}</b><span>${F(Math.round(p.valor * 100))}</span></span>
              <span class="pd-box"><b>HORA</b><span>${p.hora}</span></span>
            </span>
            <span class="pd-st ${p.status}" data-tour="pd-st-${p.status}">${ST[p.status]}</span>
          </span>
          ${ic('chevr', 'pd-chev')}
        </button>`).join('')}
      </div>
    </div>`;
  }

  /* ------------------------------ RELATÓRIO ------------------------------ */
  function relatorio(d) {
    return `
    <div class="rp">
      <div class="rp-top">
        <div class="rp-search">${ic('search')}<span>${L('Buscar pedidos por código ou nome do cliente', 'Buscar pedidos por código o nombre del cliente')}</span></div>
        <button type="button" class="bx-btn rp-filter" data-act="toast" data-msg="${L('No treinamento, o filtro fica fixo em Mês Atual.', 'En la capacitación, el filtro queda fijo en Mes Actual.')}">${ic('funnel')} Filtros</button>
      </div>

      <section class="rp-totals" data-tour="rp-totals">
        <div class="rp-t" data-tour="rp-bruto">
          <div class="rp-l"><b>Total Bruto</b>${info('open:totalBruto', 'rp-bruto-info', L('Ver detalhes do Total Bruto', 'Ver detalles del Total Bruto'))}</div>
          <div class="rp-v strong">${M(d.totalBruto)}</div>
        </div>
        <div class="rp-op">=</div>
        <div class="rp-t" data-tour="rp-liquido">
          <div class="rp-l">${L('Total Líquido', 'Total Neto')} ${infoInert()}</div>
          <div class="rp-v">${M(d.totalLiquido)}</div>
          <small>(${pl(d.n, 'pedido', 'pedidos')})</small>
        </div>
        <div class="rp-op">+</div>
        <div class="rp-t" data-tour="rp-incentivos">
          <div class="rp-l">${L('Incentivos do Bigou', 'Incentivos de Bigou')} ${infoInert()}</div>
          <div class="rp-v">${M(d.incentivos)}</div>
          <small>(${pl(d.nIncentivos, L('cupom do Bigou', 'cupón de Bigou'), L('cupons do Bigou', 'cupones de Bigou'))})</small>
        </div>
        <div class="rp-chev">${ic('chevd')}</div>
      </section>

      <div class="rp-bar">
        <div class="rp-chip">${L('Filtro aplicado: Mês Atual', 'Filtro aplicado: Mes Actual')} <span aria-hidden="true">✖</span></div>
        <button type="button" class="rp-export" data-act="toast" data-msg="${NAO}">Exportar</button>
      </div>

      <div class="rp-table" data-tour="rp-table">
        <div class="rp-scroll">
          <table>
            <thead><tr>
              <th>Pedido ↑</th><th>${L('Entrega/Retirada', 'Entrega/Retiro')}</th><th>${L('Valor Líquido', 'Valor Neto')}</th><th>Valor Bruto</th>
              <th>${L('Data', 'Fecha')}</th><th>${L('Status', 'Estado')}</th><th>${L('Origem', 'Origen')}</th><th>${L('Integração', 'Integración')}</th>
            </tr></thead>
            <tbody>${d.orders.map(row).join('')}</tbody>
          </table>
        </div>
        <div class="rp-foot">
          <span>${L('Linhas por página:', 'Filas por página:')}</span><b>25 ▾</b><span>1-${d.n} de ${d.n}</span><span class="rp-pg">‹</span><span class="rp-pg">›</span>
        </div>
      </div>
    </div>`;
  }

  function row(o) {
    return `
    <tr data-tour="row-${o.cod}" data-pay="${o.pag}">
      <td class="rp-ped"><b>Código: ${o.cod}</b><span>${o.cliente}</span><span>${TREINO.config.loja.nome}</span><small>Rio Pomba - MG</small></td>
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
    const ES = { ANTECIPADA: 'ANTICIPADA' };
    return `<span class="badge ${status === 'VIGENTE' ? 'b-vig' : 'b-ant'}">${L(status, ES[status])}</span>`;
  }

  function financeiro(d) {
    const f = d.f, r = d.r;
    return `
    <div class="fn">
      <div class="fn-actions" data-tour="fin-botoes">
        <button type="button" class="fn-pill" data-act="open:boletos" data-tour="btn-boletos">${ic('boleto', 'g')} Boletos</button>
        <button type="button" class="fn-pill" data-act="open:repasses" data-tour="btn-repasses">${ic('swap', 'g')} ${L('Repasses', 'Transferencias')}</button>
      </div>
      <section class="fn-card">
        <div class="fn-head">
          <h2>${L('Faturamento do Mês', 'Facturación del Mes')}</h2>
          <button type="button" class="bx-btn sm" data-act="toast" data-msg="${L('No treinamento, a fatura mostra sempre o mês atual.', 'En la capacitación, la factura siempre muestra el mes actual.')}">${ic('funnel')} ${TREINO.config.mes}</button>
        </div>
        <div class="fn-res" data-tour="fin-res">
          <div class="fn-main" data-tour="fin-resultado"><span>Resultado</span><strong>${M(r.resultado)}</strong></div>
          <div class="fn-boxes" data-tour="fin-boxes">
            <div class="fn-box g" data-tour="fin-recebido"><b>${M(r.recebidoLoja)}</b><span>${L('Recebido pela Loja', 'Recibido por la Tienda')}</span></div>
            <div class="fn-box g" data-tour="fin-repasses"><b>${M(r.repassesRecebidos)}</b><span>${L('Repasses recebidos', 'Transferencias recibidas')}</span></div>
            <div class="fn-box" data-tour="fin-disponivel"><b>${M(r.repasseDisponivel)}</b><span>${L('Repasse disponível', 'Transferencia disponible')} ${r.repasseDisponivel ? infoInert() : ''}</span></div>
          </div>
        </div>
        <hr>
        <div data-tour="fin-faturas">
          <h3 class="fn-sub">${L('Faturas do Período', 'Facturas del Período')}</h3>
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
    <div class="md-head"><div>${title}${extra}</div><button type="button" class="md-x" data-act="close" aria-label="${L('Fechar', 'Cerrar')}">${ic('x')}</button></div>`;

  const MODALS = {
    totalBruto(d) {
      const b = (k) => {
        const p = d.pay[k];
        return `
        <div class="tb-b" data-tour="tb-${k}">
          <div class="tb-t">${PAY_TITLE[k]}</div>
          <div class="tb-r"><span>${pl(p.n, 'pedido', 'pedidos')}</span><b class="pos">${M(p.itens, '+')}</b></div>
          <div class="tb-r"><span>${pl(p.nTaxas, L('taxa de serviço', 'tasa de servicio'), L('taxas de serviço', 'tasas de servicio'))}</span><b class="pos">+${F(p.taxas)}</b></div>
        </div>`;
      };
      return `${head('<h3>Total Bruto</h3>')}
      <div class="md-content">
        <div class="tb-list" data-tour="tb-list">${b('online')}${b('dinheiro')}${b('maquininha')}</div>
        <div class="tb-tot" data-tour="tb-total">
          <div class="tb-r"><span>Total de ${pl(d.n, 'pedido', 'pedidos')}</span><b class="pos">+${F(d.all.itens)}</b></div>
          <div class="tb-r" data-tour="tb-taxas"><span>Total de ${pl(d.all.nTaxas, L('taxa de serviço', 'tasa de servicio'), L('taxas de serviço', 'tasas de servicio'))}</span><b class="pos">+${F(d.all.taxas)}</b></div>
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
        <div data-tour="fa-titulo"><h3 class="fa-title">${L('Fatura', 'Factura')} - ${TREINO.config.mesExtenso}</h3><small>${f.inicio} - ${f.fim}</small></div>
        <div class="fa-hr"><span data-tour="fa-status">${badge(f.status)}</span><button type="button" class="md-x" data-act="close" aria-label="${L('Fechar', 'Cerrar')}">${ic('x')}</button></div>
      </div>
      <div class="md-content">
        <h4 class="fa-sec">${L('Cálculo do Repasse ou Boleto', 'Cálculo de la Transferencia o Boleto')}</h4>
        <div class="fa-box" data-tour="fl-box">
          <div class="fa-group" data-tour="fl-entradas">
          ${line('fl-liquido-online', L(`Valor líquido de <b>${pl(f.nOnline, 'venda confirmada', 'vendas confirmadas')} com pagamento online</b>`, `Valor neto de <b>${pl(f.nOnline, 'venta confirmada', 'ventas confirmadas')} con pago online</b>`), f.liquidoOnline, '+')}
          ${line('fl-incentivos', `${L('Reembolso dos incentivos usados em', 'Reembolso de los incentivos usados en')} <b>${pl(f.nReembolso, L('venda', 'venta'), L('vendas', 'ventas'))}</b> ${infoInert(false)}`, f.reembolso, '+')}
          ${line('fl-taxas-online', L(`Valor das <b>taxas de serviço</b> advindas de <b>${pl(f.nTaxasOnline, 'venda confirmada', 'vendas confirmadas')} com pagamento online</b><small>(valor pago pelo cliente e repassado para a plataforma)</small>`, `Valor de las <b>tasas de servicio</b> provenientes de <b>${pl(f.nTaxasOnline, 'venta confirmada', 'ventas confirmadas')} con pago online</b><small>(valor pagado por el cliente y transferido a la plataforma)</small>`), f.taxasOnline, '+')}
          </div>
          <div class="fa-debits" data-tour="fl-cobrancas">
            ${f.debitoRemanescente ? line('fl-debitos', L('Débitos remanescentes', 'Débitos pendientes'), f.debitoRemanescente, '-') : ''}
            ${line('fl-comissao', `${L('Comissão', 'Comisión')} ${info('open:comissao', 'fl-comissao-info', L('Ver cálculo da comissão', 'Ver cálculo de la comisión'))}`, f.comissao, '-')}
            ${line('fl-taxa-online', `${L('Taxa do pagamento online', 'Tasa de pago online')} ${info('open:taxaOnline', 'fl-taxa-online-info', L('Ver cálculo da taxa do pagamento online', 'Ver cálculo de la tasa de pago online'))}`, f.taxaOnline, '-')}
            ${line('fl-transferencia', L('Taxa de transferência', 'Tasa bancaria'), f.transferencia, '-')}
            ${line('fl-antecipacao', L('Taxa de antecipação', 'Tasa de anticipo'), f.taxaAntecipacao, '-')}
            ${line('fl-taxa-servico', `${L('Taxa de serviço', 'Tasa de servicio')} ${info('open:taxaServico', 'fl-taxa-servico-info', L('Ver cálculo da taxa de serviço', 'Ver cálculo de la tasa de servicio'))}`, f.taxaServico, '-')}
            ${f.mensalidade ? line('fl-mensalidade', L('Mensalidade', 'Mensualidad'), f.mensalidade, '-') : ''}
          </div>
        </div>
        <div class="fa-total" data-tour="fl-total"><b>${f.tipo}</b><b class="${f.total >= 0 ? 'pos' : 'neg'}">${M(Math.abs(f.total))}</b></div>
        ${
          f.status === 'VIGENTE'
            ? `<div class="fa-ant"><button type="button" class="fa-ant-link" data-act="open:antecipacao" data-tour="btn-antecipar">${L('Solicitar antecipação', 'Solicitar anticipo')} ${ic('arrow')}</button></div>`
            : Clone.st.repassado
              ? `<div class="fa-pago" data-tour="fa-repasse-realizado"><b>${L('Repasse realizado', 'Transferencia realizada')}</b><span>${L('A transferência foi realizada em', 'La transferencia se realizó el')} ${d.sc.antecipacaoData}</span>
                  <button type="button" class="fa-pago-link" data-act="toast" data-msg="${L('No sistema, aqui abre o comprovante da transferência. No treinamento, não há comprovante real.', 'En el sistema, aquí se abre el comprobante de la transferencia. En la capacitación, no hay comprobante real.')}" data-tour="btn-comprovante">${L('Ver comprovante', 'Ver comprobante')} ${ic('arrow')}</button></div>`
              : ''
        }
      </div>`;
    },

    comissao(d) {
      const f = d.f, a = d.all, c = d.canc;
      const vendas = (n) => `<b>${n} ${n === 1 ? L('venda', 'venta') : L('vendas', 'ventas')}</b>`;
      const cTxt = L(`${c.n === 1 ? 'cancelada' : 'canceladas'} por tempo`, `${c.n === 1 ? 'cancelada' : 'canceladas'} por tiempo`);
            const incl = (x) => L(`(incluindo: ${x.nCupons} cupons + 0 subsídios + ${x.nTaxas} taxas de serviço)`, `(incluye: ${x.nCupons} cupones + 0 subsidios + ${x.nTaxas} tasas de servicio)`);
      return `${head(`<h3>${L('Cálculo da Comissão', 'Cálculo de la Comisión')}</h3>`)}
      <div class="md-content">
        <div class="cm-sec">${L('Cálculo do total bruto', 'Cálculo del total bruto')}</div>
        <div class="cm-grey col" data-tour="cm-vendas-box">
          <div class="cm-gl" data-tour="cm-vendas">
            <div><span>${vendas(a.n)} confirmadas</span><small>${incl(a)}</small></div>
            <b class="pos">${M(a.bruto, '+ ')}</b>
          </div>
          ${c.n ? `<div class="cm-gl" data-tour="cm-canceladas">
            <div><span>${vendas(c.n)} ${cTxt}</span><small>${incl(c)}</small></div>
            <b class="pos">${M(c.bruto, '+ ')}</b>
          </div>` : ''}
        </div>
        <div class="cm-card" data-tour="cm-bruto"><div><b>Total bruto de ${pl(f.nComissao, L('venda', 'venta'), L('vendas', 'ventas'))}</b><small>(${a.n} confirmadas${c.n ? ` + ${c.n} ${cTxt}` : ''})</small></div><b>${F(f.brutoComissao)}</b></div>
        <div class="cm-group" data-tour="cm-taxas">
          <div class="cm-card" data-tour="cm-taxa"><b>${L(`Taxa de serviço de ${a.nTaxas} vendas confirmadas`, `Tasa de servicio de ${a.nTaxas} ventas confirmadas`)}</b><b>- ${F(a.taxas)}</b></div>
          ${c.n ? `<div class="cm-card" data-tour="cm-taxa-canc"><b>${L('Taxa de serviço de', 'Tasa de servicio de')} ${pl(c.nTaxas, L('venda', 'venta'), L('vendas', 'ventas'))} ${cTxt}</b><b>- ${F(c.taxas)}</b></div>` : ''}
        </div>
        <div class="cm-card" data-tour="cm-base"><b>${L('Base de cálculo da comissão', 'Base de cálculo de la comisión')}</b><b>${M(f.baseComissao)}</b></div>
        <div class="cm-card" data-tour="cm-comissao"><b>${L('Comissão', 'Comisión')}</b><b>${M(f.comissao)}</b></div>
      </div>`;
    },

    taxaOnline(d) {
      const f = d.f, on = d.pay.online;
      const vendas = pl(on.n, L('venda', 'venta'), L('vendas', 'ventas'));
      return `${head(`<h3>${L('Taxa de Pagamento Online', 'Tasa de Pago Online')}</h3>`)}
      <div class="md-content">
        <div class="cm-sec">${L('Cálculo do total bruto com pagamento online', 'Cálculo del total bruto con pago online')}</div>
        <div class="cm-grey" data-tour="to-vendas">
          <div><span><b>${vendas}</b> ${L('com pagamento online confirmadas', 'con pago online confirmadas')}</span><small>${L(`(incluindo: ${on.nCupons} cupons + 0 subsídios + ${on.nTaxas} taxas de serviço)`, `(incluye: ${on.nCupons} cupones + 0 subsidios + ${on.nTaxas} tasas de servicio)`)}</small></div>
          <b class="pos">${M(on.bruto, '+ ')}</b>
        </div>
        <div class="cm-card" data-tour="to-bruto"><b>${L(`Total bruto de ${vendas} com pagamento online`, `Total bruto de ${vendas} con pago online`)}</b><b>${M(on.bruto)}</b></div>
        <div class="cm-card" data-tour="to-taxa"><b>${L(`Taxa de serviço de ${on.nTaxas} vendas confirmadas`, `Tasa de servicio de ${on.nTaxas} ventas confirmadas`)}</b><b>- ${F(on.taxas)}</b></div>
        <div class="cm-group" data-tour="to-calc">
          <div class="cm-card" data-tour="to-base"><b>${L('Base de cálculo da taxa de pagamento online', 'Base de cálculo de la tasa de pago online')}</b><b>${M(f.baseOnline)}</b></div>
          <div class="cm-card" data-tour="to-final"><b>${L('Taxa de pagamento online', 'Tasa de pago online')}</b><b>${M(f.taxaOnline)}</b></div>
        </div>
      </div>`;
    },

    taxaServico(d) {
      const f = d.f, p = d.pay;
      const r = (k, label) => `<div class="ts-r"><span><b>${pl(p[k].nTaxas, L('venda', 'venta'), L('vendas', 'ventas'))}</b> ${label}</span><b>-${F(p[k].taxas)}</b></div>`;
      const pctDev = Math.round(TREINO.config.taxas.devolucaoMaquininha * 100);
      return `${head(`<h3>${L('Taxa de Serviço', 'Tasa de Servicio')}</h3>`, `<span class="ts-link">${L('O que é Taxa de Serviço?', '¿Qué es la Tasa de Servicio?')}</span>`)}
      <div class="md-content">
        <div class="cm-sec">${L('Cálculo do total de taxas de serviço', 'Cálculo del total de tasas de servicio')}</div>
        <div class="cm-grey col" data-tour="ts-rows">
          <div data-tour="ts-online">${r('online', L('confirmadas com pagamento online', 'confirmadas con pago online'))}</div>
          <div data-tour="ts-offline">${r('dinheiro', L('confirmadas em dinheiro', 'confirmadas en efectivo'))}${r('maquininha', L('confirmadas com maquininha de cartão', 'confirmadas con POS'))}</div>
        </div>
        <div class="cm-card" data-tour="ts-soma"><b>${L(`Total das taxas de ${d.all.nTaxas} vendas confirmadas`, `Total de las tasas de ${d.all.nTaxas} ventas confirmadas`)}</b><b>-${F(d.all.taxas)}</b></div>
        <div class="cm-card" data-tour="ts-devolvido"><div><b>${L('Valor da taxa de maquininha de cartão devolvido', 'Valor de la tasa del POS devuelto')}</b><small>${L(`(${pctDev}% de ${F(p.maquininha.taxas)} referentes a ${pl(p.maquininha.nTaxas, 'venda realizada', 'vendas realizadas')} com maquininha de cartão)`, `(${pctDev}% de ${F(p.maquininha.taxas)} correspondientes a ${pl(p.maquininha.nTaxas, 'venta realizada', 'ventas realizadas')} con POS)`)}</small></div><b class="pos">+${F(f.devolucao)}</b></div>
        <div class="cm-card" data-tour="ts-total"><b>${L('Valor repassado para a plataforma', 'Valor transferido a la plataforma')}</b><b>${M(f.taxaServico)}</b></div>
      </div>`;
    },


    antecipacao(d) {
      const f = d.f;
      return `${head(`<h3>${L('Antecipação', 'Anticipo')}</h3>`)}
      <div class="md-content">
        <div class="an-box" data-tour="ant-box"><b>${L('Valor a receber', 'Valor a recibir')}: ${F(f.total)}</b><span>${L('Período de apuração', 'Período de cálculo')}: ${f.inicio} - ${f.fim}.</span></div>
        <ul class="an-list">
          <li data-tour="ant-data">${L(`A transferência do valor antecipado ocorrerá no dia <u>${d.sc.antecipacaoData} (próximo dia útil)</u>, e será enviada para a chave PIX 000.000.000-00.`, `La transferencia del valor anticipado se realizará el día <u>${d.sc.antecipacaoData} (próximo día hábil)</u> y se enviará a la clave PIX 000.000.000-00.`)}</li>
          <li>${L('Feriados municipais da cidade de Rio Pomba (sede da empresa) não são considerados como dia útil.', 'Los feriados municipales de la ciudad de Rio Pomba (sede de la empresa) no se consideran días hábiles.')}</li>
          <li>${L('Para evitar atrasos no recebimento, certifique-se que os dados bancários estão corretos e em nome da pessoa física ou jurídica titular do contrato.', 'Para evitar demoras en el cobro, asegúrate de que los datos bancarios sean correctos y estén a nombre de la persona física o jurídica titular del contrato.')}</li>
          <li data-tour="ant-aviso">${L('Ao clicar em CONFIRMAR, o sistema efetivará a contabilidade de todos os pedidos confirmados e compreendidos no período de apuração. Sendo assim, não será possível solicitar o cancelamento destes pedidos.', 'Al hacer clic en CONFIRMAR, el sistema registrará contablemente todos los pedidos confirmados dentro del período de cálculo. Por lo tanto, no será posible solicitar la cancelación de estos pedidos.')}</li>
        </ul>
        <div class="an-actions">
          <button type="button" class="bx-btn" data-act="antecipar-confirm" data-tour="btn-confirmar">CONFIRMAR</button>
          <button type="button" class="an-close" data-act="close">${L('FECHAR', 'CERRAR')}</button>
        </div>
      </div>`;
    },

    boletos() {
      return `${head('<h3>Boletos</h3>')}
      <div class="md-content"><p class="md-empty" data-tour="bol-empty">${L('Você não possui boletos pendentes', 'No tienes boletos pendientes')}</p></div>`;
    },

    repasses() {
      return `${head(`<h3>${L('Repasses', 'Transferencias')}</h3>`)}
      <div class="md-content"><p class="md-empty" data-tour="rep-list">${L('Você não possui nenhum repasse', 'No tienes ninguna transferencia')}</p></div>`;
    },
  };


  TREINO.Clone = Clone;
})();
