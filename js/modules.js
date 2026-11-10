/* =========================================================================
   MÓDULOS DO TREINAMENTO
   Curva: Relatório → formas de pagamento → Financeiro → fatura (entradas,
   depois deduções) → repasse e antecipação → exercício final.
   Os módulos 1 a 9 terminam com um "Desafio rápido" (uma pergunta).

   Cada passo define:
     state   → como a tela deve estar (página, modais abertos, antecipada, repassado)
     target  → elemento destacado pelo spotlight (data-tour)
     mode    → 'next' (padrão) | 'click' (o parceiro clica) | 'quiz'
   Todos os números vêm de TREINO.calc — nunca são digitados à mão.
   Textos em português e espanhol lado a lado: L('pt', 'es') (js/data.js).
   ========================================================================= */
(function () {
  const F = TREINO.fmt;
  const pl = TREINO.pl;
  const b = (c) => `<b class="tm">${F(c)}</b>`;
  const S = (page, modals, extra) => Object.assign({ page, modals: modals || [], antecipada: false, repassado: false }, extra || {});
  const PCT = (p) => String(Math.round(p * 10000) / 100).replace('.', ',') + '%';

  TREINO.buildModules = function (d) {
    const on = d.pay.online, di = d.pay.dinheiro, mq = d.pay.maquininha;
    const f = d.f, r = d.r;
    const T = TREINO.config.taxas;
    const MS = TREINO.config.mensalidade;
    const limite = F(Math.round(MS.acimaDeBruto * 100));
    const valorMens = F(Math.round(MS.valor * 100));
    const TS = TREINO.config.taxaServico;
    const taxaTxt = L(
      `${F(Math.round(TS.normal * 100))} por pedido, ou ${F(Math.round(TS.maior * 100))} em pedidos acima de ${F(TS.acimaDe * 100)}`,
      `${F(Math.round(TS.normal * 100))} por pedido, o ${F(Math.round(TS.maior * 100))} en pedidos de más de ${F(TS.acimaDe * 100)}`,
      `${F(Math.round(TS.normal * 100))} per order, or ${F(Math.round(TS.maior * 100))} on orders over ${F(TS.acimaDe * 100)}`,
    );
    const caixa = r.recebidoLoja;      // dinheiro + maquininha
    const plataforma = r.plataforma;   // o que passou pela plataforma
    const vendasPagas = (n) => pl(n, L('venda foi paga', 'venta fue pagada', 'sale was paid'), L('vendas foram pagas', 'ventas fueron pagadas', 'sales were paid'));
    const cliqueInfo = L('Clique no ⓘ destacado', 'Haz clic en el ⓘ resaltado', 'Click the highlighted ⓘ');

    /* 1 ------------------------------------------------------------------ */
    const m1 = {
      n: 1,
      titulo: L('Suas vendas', 'Tus ventas', 'Your sales'),
      icone: 'relatorio',
      desc: L('Onde ficam suas vendas e o que é o Total Bruto.', 'Dónde están tus ventas y qué es el Total Bruto.', 'Where your sales are and what Gross Total means.'),
      intro: L('Vamos começar pelo lugar onde ficam todas as vendas da sua loja: a tela Relatório.', 'Empecemos por el lugar donde están todas las ventas de tu tienda: la pantalla Informe.', "Let's start with the place where all your store's sales are: the Report screen."),
      aviso: L(
        'Lembre: este treinamento é ilustrativo. Todos os dados são fictícios, inclusive os valores de comissão e taxas. Confira no seu contrato os valores praticados na sua loja.',
        'Recuerda: esta capacitación es ilustrativa. Todos los datos son ficticios, incluso los valores de comisión y tasas. Consulta en tu contrato los valores que se aplican a tu tienda.',
        'Remember: this training is just an example. All data is made up, including commission and fee amounts. Check your contract for the amounts that apply to your store.',
      ),
      aprender: L(
        ['Onde ver suas vendas', 'O que é o Total Bruto', 'As 3 formas de pagamento'],
        ['Dónde ver tus ventas', 'Qué es el Total Bruto', 'Las 3 formas de pago'],
        ['Where to see your sales', 'What Gross Total is', 'The 3 ways to pay'],
      ),
      steps: [
        {
          state: S('relatorio'),
          target: 'rp-table',
          title: L('Aqui estão todas as suas vendas', 'Aquí están todas tus ventas', 'Here are all your sales'),
          body: L(
            `Esta é a tela <b>Relatório</b>. Cada linha é um pedido da sua loja.<br>Neste mês, foram <b>${pl(d.n, 'venda', 'vendas')}</b>.`,
            `Esta es la pantalla <b>Informe</b>. Cada fila es un pedido de tu tienda.<br>Este mes hubo <b>${pl(d.n, 'venta', 'ventas')}</b>.`,
            `This is the <b>Report</b> screen. Each line is an order from your store.<br>This month, you had <b>${pl(d.n, 'sale', 'sales')}</b>.`,
          ),
        },
        {
          target: 'rp-bruto',
          title: L('Total Bruto', 'Total Bruto', 'Gross Total'),
          body: L(`É a soma de tudo o que você vendeu no mês: ${b(d.totalBruto)}.`, `Es la suma de todo lo que vendiste en el mes: ${b(d.totalBruto)}.`, `It is the sum of everything you sold this month: ${b(d.totalBruto)}.`),
          countUp: true,
        },
        {
          target: 'rp-bruto-info',
          mode: 'click',
          pad: 6,
          title: L('Veja como ele é formado', 'Mira cómo se compone', 'See how it adds up'),
          body: L('Clique no <b>ⓘ</b> ao lado de <b>Total Bruto</b>.', 'Haz clic en el <b>ⓘ</b> al lado de <b>Total Bruto</b>.', 'Click the <b>ⓘ</b> next to <b>Gross Total</b>.'),
          hint: cliqueInfo,
        },
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-list',
          title: L('Suas vendas chegam de 3 formas', 'Tus ventas llegan de 3 formas', 'Your sales come in 3 ways'),
          body: L(
            '<b>Pagamento online</b>, <b>dinheiro</b> e <b>maquininha</b>.<br>Vamos entender cada uma nos próximos módulos.',
            '<b>Pago online</b>, <b>efectivo</b> y <b>POS</b>.<br>Vamos a entender cada una en los próximos módulos.',
            '<b>Online payment</b>, <b>cash</b> and <b>card machine</b>.<br>We will look at each one in the next modules.',
          ),
        },
        {
          target: 'tb-total',
          title: L('Todas são vendas', 'Todas son ventas', 'They are all sales'),
          body: L('Mas o valor chegou por caminhos diferentes.', 'Pero el dinero llegó por caminos diferentes.', 'But the money came in different ways.'),
          calc: [
            { l: L('Pagamento online', 'Pago online', 'Online payment'), v: on.bruto },
            { op: '+', l: L('Dinheiro', 'Efectivo', 'Cash'), v: di.bruto },
            { op: '+', l: L('Maquininha', 'POS', 'Card machine'), v: mq.bruto },
            { op: '=', l: 'Total Bruto', v: d.totalBruto, total: true },
          ],
          foot: L(
            `Cada pedido tem uma taxa de serviço, paga pelo cliente: ${taxaTxt}. Ela aparece de novo na fatura.`,
            `Cada pedido tiene una tasa de servicio, pagada por el cliente: ${taxaTxt}. Vuelve a aparecer en la factura.`,
            `Each order has a service fee, paid by the customer: ${taxaTxt}. You will see it again on the invoice.`,
          ),
        },
      ],
      resumo: L(
        [
          'Todas as vendas do mês ficam na tela Relatório.',
          'Total Bruto é a soma de todas as vendas.',
          'As vendas chegam de 3 formas: online, dinheiro e maquininha.',
        ],
        [
          'Todas las ventas del mes están en la pantalla Informe.',
          'El Total Bruto es la suma de todas las ventas.',
          'Las ventas llegan de 3 formas: online, efectivo y POS.',
        ],
        [
          'All sales of the month are on the Report screen.',
          'Gross Total is the sum of all sales.',
          'Sales come in 3 ways: online, cash and card machine.',
        ],
      ),
    };

    /* 2 ------------------------------------------------------------------ */
    const m2 = {
      n: 2,
      titulo: L('Pagamento online', 'Pago online', 'Online payment'),
      icone: 'celular',
      desc: L('Vendas pagas pelo aplicativo.', 'Ventas pagadas por la aplicación.', 'Sales paid through the app.'),
      intro: L('Veja o que acontece com o dinheiro quando o cliente paga pelo aplicativo.', 'Mira qué pasa con el dinero cuando el cliente paga por la aplicación.', 'See what happens to the money when the customer pays through the app.'),
      aprender: L(
        ['O que é pagamento online', 'Por que esse valor é tão importante', 'O que é repasse'],
        ['Qué es el pago online', 'Por qué ese valor es tan importante', 'Qué es la transferencia'],
        ['What online payment is', 'Why this amount is so important', 'What a payout is'],
      ),
      steps: [
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-online',
          title: L('Vendas com pagamento online', 'Ventas con pago online', 'Sales with online payment'),
          body: L(
            `${vendasPagas(on.n)} pelo aplicativo, na hora do pedido: ${b(on.bruto)}.<br>Esse valor <b>passa primeiro pela plataforma</b>.`,
            `${vendasPagas(on.n)} por la aplicación, al momento del pedido: ${b(on.bruto)}.<br>Ese valor <b>pasa primero por la plataforma</b>.`,
            `${vendasPagas(on.n)} through the app, when the order was placed: ${b(on.bruto)}.<br>This money <b>goes through the platform first</b>.`,
          ),
          foot: L(
            'Dica: nesses pedidos, o cliente já pagou. Você só precisa aceitar e entregar, sem cobrar o cliente.',
            'Consejo: en esos pedidos, el cliente ya pagó. Solo tienes que aceptar y entregar, sin cobrarle al cliente.',
            'Tip: in these orders, the customer has already paid. You just need to accept and deliver, without charging the customer.',
          ),
          countUp: true,
        },
        {
          target: 'tb-online',
          title: L('É daqui que saem as deduções', 'De aquí salen las deducciones', 'This is where deductions come from'),
          body: L(
            'Dele, a plataforma deduz a comissão e as taxas de <b>todas</b> as suas vendas, inclusive das vendas em dinheiro e maquininha.',
            'De él, la plataforma descuenta la comisión y las tasas de <b>todas</b> tus ventas, incluso de las ventas en efectivo y POS.',
            'From it, the platform deducts the commission and fees for <b>all</b> your sales, including cash and card machine sales.',
          ),
        },
        {
          target: 'tb-online',
          title: L('O repasse', 'La transferencia', 'The payout'),
          body: L(
            'O valor que fica depois das deduções é enviado para você.<br>Esse envio se chama <b>repasse</b>.',
            'El valor que queda después de las deducciones se te envía a ti.<br>Ese envío se llama <b>transferencia</b>.',
            'What is left after the deductions is sent to you.<br>This transfer is called a <b>payout</b>.',
          ),
        },
      ],
      resumo: L(
        [
          'Pagamento online: o cliente paga pelo aplicativo.',
          'Esse valor passa primeiro pela plataforma.',
          'Dele, a plataforma deduz a comissão e as taxas de todas as vendas.',
          'O valor que fica é enviado para você: o repasse.',
        ],
        [
          'Pago online: el cliente paga por la aplicación.',
          'Ese valor pasa primero por la plataforma.',
          'De él, la plataforma descuenta la comisión y las tasas de todas las ventas.',
          'El valor que queda se te envía a ti: la transferencia.',
        ],
        [
          'Online payment: the customer pays through the app.',
          'This money goes through the platform first.',
          'From it, the platform deducts the commission and fees for all sales.',
          'What is left is sent to you: the payout.',
        ],
      ),
    };

    /* 3 ------------------------------------------------------------------ */
    const m3 = {
      n: 3,
      titulo: L('Dinheiro e maquininha', 'Efectivo y POS', 'Cash and card machine'),
      icone: 'dinheiro',
      desc: L('Vendas que entram direto no seu caixa.', 'Ventas que entran directo en tu caja.', 'Sales that go straight into your till.'),
      intro: L('Agora, as vendas em que o cliente paga direto para você.', 'Ahora, las ventas en las que el cliente te paga directo a ti.', 'Now, the sales where the customer pays you directly.'),
      aprender: L(
        ['Vendas em dinheiro', 'Vendas na maquininha', 'Onde está o dinheiro das suas vendas'],
        ['Ventas en efectivo', 'Ventas con POS', 'Dónde está el dinero de tus ventas'],
        ['Cash sales', 'Card machine sales', 'Where the money from your sales is'],
      ),
      steps: [
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-dinheiro',
          title: L('Dinheiro', 'Efectivo', 'Cash'),
          body: L(
            `${vendasPagas(di.n)} em dinheiro: ${b(di.bruto)}.<br>O cliente pagou direto para você. Esse dinheiro <b>já entrou no seu caixa</b>.`,
            `${vendasPagas(di.n)} en efectivo: ${b(di.bruto)}.<br>El cliente te pagó directo a ti. Ese dinero <b>ya entró en tu caja</b>.`,
            `${vendasPagas(di.n)} in cash: ${b(di.bruto)}.<br>The customer paid you directly. This money <b>is already in your till</b>.`,
          ),
          countUp: true,
        },
        {
          target: 'tb-maquininha',
          title: L('Maquininha', 'POS', 'Card machine'),
          body: L(
            `${vendasPagas(mq.n)} no cartão, na sua maquininha: ${b(mq.bruto)}.<br>O valor cai na conta da sua maquininha, <b>não passa pela plataforma</b>.`,
            `${vendasPagas(mq.n)} con tarjeta, en tu POS: ${b(mq.bruto)}.<br>El valor cae en la cuenta de tu POS, <b>no pasa por la plataforma</b>.`,
            `${vendasPagas(mq.n)} by card, on your card machine: ${b(mq.bruto)}.<br>The money goes to your card machine account and <b>does not go through the platform</b>.`,
          ),
          countUp: true,
        },
        {
          target: 'tb-total',
          title: L('Onde está o dinheiro das suas vendas', 'Dónde está el dinero de tus ventas', 'Where the money from your sales is'),
          fala: L(
            [
              `Das suas vendas, ${F(caixa)} já estão com você, porque foram pagos em dinheiro ou na maquininha.`,
              `Só ${F(plataforma)} passaram pela plataforma, no pagamento on-line.`,
              'Guarde essa ideia: ela explica por que o repasse pode parecer pequeno.',
            ],
            [
              `De tus ventas, ${F(caixa)} ya están contigo, porque se pagaron en efectivo o con POS.`,
              `Solo ${F(plataforma)} pasaron por la plataforma, en el pago online.`,
              'Guarda esta idea: explica por qué la transferencia puede parecer pequeña.',
            ],
            [
              `Of your sales, ${F(caixa)} is already with you, because it was paid in cash or on the card machine.`,
              `Only ${F(plataforma)} went through the platform, as online payment.`,
              'Keep this in mind: it explains why the payout may look small.',
            ],
          ),
          body: L(
            `Das suas vendas, ${b(caixa)} já estão com você.<br>Só ${b(plataforma)} passaram pela plataforma.`,
            `De tus ventas, ${b(caixa)} ya están contigo.<br>Solo ${b(plataforma)} pasaron por la plataforma.`,
            `Of your sales, ${b(caixa)} is already with you.<br>Only ${b(plataforma)} went through the platform.`,
          ),
          calc: [
            { l: L('Dinheiro + maquininha (no seu caixa)', 'Efectivo + POS (en tu caja)', 'Cash + card machine (in your till)'), v: caixa },
            { op: '+', l: L('Pagamento online (pela plataforma)', 'Pago online (por la plataforma)', 'Online payment (through the platform)'), v: plataforma },
            { op: '=', l: 'Total Bruto', v: d.totalBruto, total: true },
          ],
          foot: L('Guarde essa ideia: ela explica por que o repasse pode parecer pequeno.', 'Guarda esta idea: explica por qué la transferencia puede parecer pequeña.', 'Keep this in mind: it explains why the payout may look small.'),
          wide: true,
        },
      ],
      resumo: L(
        [
          'Dinheiro e maquininha: o cliente paga direto para você.',
          'Esse dinheiro entra direto no seu caixa.',
          'Só o pagamento online passa pela plataforma.',
        ],
        [
          'Efectivo y POS: el cliente te paga directo a ti.',
          'Ese dinero entra directo en tu caja.',
          'Solo el pago online pasa por la plataforma.',
        ],
        [
          'Cash and card machine: the customer pays you directly.',
          'This money goes straight into your till.',
          'Only online payment goes through the platform.',
        ],
      ),
    };

    /* 4 ------------------------------------------------------------------ */
    const m4 = {
      n: 4,
      titulo: L('Tela Financeiro', 'Pantalla Finanzas', 'Finance screen'),
      icone: 'painel',
      desc: L('Resultado, recebidos e repasse disponível.', 'Resultado, recibidos y transferencia disponible.', 'Result, received amounts and available payout.'),
      intro: L('Agora vamos para a tela Financeiro. Ela mostra quanto ficou com você no mês.', 'Ahora vamos a la pantalla Finanzas. Muestra cuánto te quedó en el mes.', "Now let's go to the Finance screen. It shows how much you kept this month."),
      aprender: L(
        ['O que é o Resultado', 'Os 3 quadros ao lado dele', 'Onde ficam as faturas'],
        ['Qué es el Resultado', 'Los 3 cuadros a su lado', 'Dónde están las facturas'],
        ['What the Result is', 'The 3 boxes next to it', 'Where the invoices are'],
      ),
      steps: [
        {
          state: S('relatorio', [], { sidebar: true }),
          target: 'nav-financeiro',
          mode: 'click',
          pad: 4,
          title: L('Vamos ao Financeiro', 'Vamos a Finanzas', "Let's go to Finance"),
          body: L('Clique em <b>Financeiro</b> no menu.', 'Haz clic en <b>Finanzas</b> en el menú.', 'Click <b>Finance</b> in the menu.'),
          hint: L('Clique em Financeiro', 'Haz clic en Finanzas', 'Click Finance'),
        },
        {
          state: S('financeiro'),
          target: 'fin-resultado',
          title: L('Resultado', 'Resultado', 'Result'),
          body: L(
            `É tudo o que ficou com você no mês depois das deduções: ${b(r.resultado)}.<br>Ele é a soma dos 3 quadros ao lado.`,
            `Es todo lo que te quedó en el mes después de las deducciones: ${b(r.resultado)}.<br>Es la suma de los 3 cuadros de al lado.`,
            `It is everything you kept this month after deductions: ${b(r.resultado)}.<br>It is the sum of the 3 boxes next to it.`,
          ),
          countUp: true,
        },
        {
          target: 'fin-recebido',
          title: L('Recebido pela Loja', 'Recibido por la Tienda', 'Received by the store'),
          body: L('É o valor das vendas em dinheiro e maquininha. Ele já entrou no seu caixa.', 'Es el valor de las ventas en efectivo y POS. Ya entró en tu caja.', 'This is the amount from cash and card machine sales. It is already in your till.'),
          calc: [
            { l: L('Dinheiro', 'Efectivo', 'Cash'), v: di.liquido },
            { op: '+', l: L('Maquininha', 'POS', 'Card machine'), v: mq.liquido },
            { op: '=', l: L('Recebido pela Loja', 'Recibido por la Tienda', 'Received by the store'), v: r.recebidoLoja, total: true },
          ],
          countUp: true,
        },
        {
          target: 'fin-repasses',
          title: L('Repasses recebidos', 'Transferencias recibidas', 'Payouts received'),
          body: L(
            `É o que a plataforma já transferiu para você neste mês, caso você tenha antecipado.<br>Por enquanto: ${b(0)}.`,
            `Es lo que la plataforma ya te transfirió este mes, si anticipaste.<br>Por ahora: ${b(0)}.`,
            `This is what the platform has already transferred to you this month, if you requested early payout.<br>So far: ${b(0)}.`,
          ),
        },
        {
          target: 'fin-disponivel',
          title: L('Repasse disponível', 'Transferencia disponible', 'Available payout'),
          body: L(
            `É o valor disponível para repasse: ${b(r.repasseDisponivel)}. Se você não antecipar, a plataforma transfere no 2º dia útil do mês seguinte às suas vendas (${TREINO.periodo.repasseMensal}).<br>Esse é o valor das vendas online, após a dedução da comissão e das taxas.`,
            `Es el valor disponible para transferencia: ${b(r.repasseDisponivel)}. Si no anticipas, la plataforma lo transfiere el 2º día hábil del mes siguiente a tus ventas (${TREINO.periodo.repasseMensal}).<br>Es el valor de las ventas online, después de descontar la comisión y las tasas.`,
            `This is the amount available for payout: ${b(r.repasseDisponivel)}. If you do not request early payout, the platform transfers it on the 2nd business day of the month after your sales (${TREINO.periodo.repasseMensal}).<br>This is the amount from online sales, after commission and fees are deducted.`,
          ),
          countUp: true,
        },
        {
          target: 'fin-disponivel',
          title: L('Esse valor muda todos os dias', 'Este valor cambia todos los días', 'This amount changes every day'),
          body: L(
            'O Repasse disponível é <b>volátil</b>.<br>Se em um dia você tiver apenas vendas pagas em dinheiro ou maquininha, as deduções dessas vendas saem do saldo online, e ele diminui.',
            'La Transferencia disponible es <b>variable</b>.<br>Si en un día solo tienes ventas pagadas en efectivo o POS, las deducciones de esas ventas salen del saldo online, y este disminuye.',
            'The Available payout <b>changes often</b>.<br>If on one day you only have cash or card machine sales, the deductions for those sales come out of the online balance, and it goes down.',
          ),
        },
        {
          target: 'fin-res',
          title: L('A soma', 'La suma', 'The sum'),
          calc: [
            { l: L('Recebido pela Loja', 'Recibido por la Tienda', 'Received by the store'), v: r.recebidoLoja },
            { op: '+', l: L('Repasses recebidos', 'Transferencias recibidas', 'Payouts received'), v: r.repassesRecebidos },
            { op: '+', l: L('Repasse disponível', 'Transferencia disponible', 'Available payout'), v: r.repasseDisponivel },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
        },
        {
          target: 'fin-botoes',
          title: L('Boletos e Repasses', 'Boletos y Transferencias', 'Bank slips and Payouts'),
          body: L(
            'Em <b>Repasses</b>, ficam as transferências feitas para você.<br>Em <b>Boletos</b>, pode aparecer um boleto quando o saldo online não cobre a comissão e as taxas. Nesse caso, basta acessá-lo e pagar.',
            'En <b>Transferencias</b> están las transferencias que te hicieron.<br>En <b>Boletos</b> puede aparecer un boleto cuando el saldo online no cubre la comisión y las tasas. En ese caso, solo tienes que abrirlo y pagarlo.',
            'Under <b>Payouts</b>, you see the transfers made to you.<br>Under <b>Bank slips</b>, a bank slip may appear when the online balance does not cover the commission and fees. If so, just open it and pay it.',
          ),
        },
        {
          target: 'fin-faturas',
          title: L('Faturas do Período', 'Facturas del Período', 'Invoices for the Period'),
          body: L(
            'A fatura mostra a conta completa do repasse.<br>Nos próximos módulos, vamos abrir e ler linha por linha.',
            'La factura muestra la cuenta completa de la transferencia.<br>En los próximos módulos, la vamos a abrir y leer línea por línea.',
            'The invoice shows the full payout calculation.<br>In the next modules, we will open it and read it line by line.',
          ),
        },
      ],
      resumo: L(
        [
          'Resultado: tudo o que ficou com você no mês.',
          'Recebido pela Loja: dinheiro e maquininha, já no seu caixa.',
          'Repasse disponível: transferido no 2º dia útil do mês seguinte, se você não antecipar.',
          'Repasses recebidos: o que já foi transferido.',
        ],
        [
          'Resultado: todo lo que te quedó en el mes.',
          'Recibido por la Tienda: efectivo y POS, ya en tu caja.',
          'Transferencia disponible: se transfiere el 2º día hábil del mes siguiente, si no anticipas.',
          'Transferencias recibidas: lo que ya se transfirió.',
        ],
        [
          'Result: everything you kept this month.',
          'Received by the store: cash and card machine, already in your till.',
          'Available payout: transferred on the 2nd business day of the next month, if you do not request early payout.',
          'Payouts received: what has already been transferred.',
        ],
      ),
    };

    /* 5 ------------------------------------------------------------------ */
    const m5 = {
      n: 5,
      titulo: L('Fatura: o que entrou de pagamento online', 'Factura: lo que entró por pago online', 'Invoice: what came in from online payment'),
      icone: 'faturaEntra',
      desc: L('As vendas online e os valores devolvidos.', 'Las ventas online y los valores devueltos.', 'Online sales and amounts returned to you.'),
      intro: L(
        'A fatura mostra todo o cálculo para repasse, linha por linha. Primeiro, o que entrou de pagamento online.',
        'La factura muestra todo el cálculo de la transferencia, línea por línea. Primero, lo que entró por pago online.',
        'The invoice shows the whole payout calculation, line by line. First, what came in from online payment.',
      ),
      aprender: L(
        ['Como ler a fatura', 'As vendas online', 'Os valores devolvidos para você'],
        ['Cómo leer la factura', 'Las ventas online', 'Los valores que se te devuelven'],
        ['How to read the invoice', 'Online sales', 'Amounts returned to you'],
      ),
      steps: [
        {
          state: S('financeiro'),
          target: 'fatura-item',
          mode: 'click',
          title: L('Abra a fatura', 'Abre la factura', 'Open the invoice'),
          body: L('Clique na fatura para ver a conta.', 'Haz clic en la factura para ver la cuenta.', 'Click the invoice to see the calculation.'),
          hint: L('Clique na fatura destacada', 'Haz clic en la factura resaltada', 'Click the highlighted invoice'),
        },
        {
          state: S('financeiro', ['fatura']),
          target: 'fa-titulo',
          title: L('A fatura do período', 'La factura del período', 'The invoice for the period'),
          body: L(`Ela junta as vendas de <b>${f.inicio}</b> até <b>${f.fim}</b>.`, `Reúne las ventas del <b>${f.inicio}</b> al <b>${f.fim}</b>.`, `It includes the sales from <b>${f.inicio}</b> to <b>${f.fim}</b>.`),
        },
        {
          target: 'fa-status',
          pad: 6,
          title: L('VIGENTE', 'VIGENTE', 'OPEN'),
          body: L('A fatura está aberta. O valor ainda não foi transferido para você.', 'La factura está abierta. El valor todavía no se te transfirió.', 'The invoice is open. The money has not been transferred to you yet.'),
        },
        {
          target: 'fl-liquido-online',
          title: L('Vendas online', 'Ventas online', 'Online sales'),
          body: L(
            `O que os clientes pagaram pelos produtos nas ${pl(on.n, 'venda feita e paga', 'vendas feitas e pagas')} diretamente pelo aplicativo: ${b(f.liquidoOnline)}.`,
            `Lo que los clientes pagaron por los productos en las ${pl(on.n, 'venta hecha y pagada', 'ventas hechas y pagadas')} directamente por la aplicación: ${b(f.liquidoOnline)}.`,
            `What customers paid for the products in the ${pl(on.n, 'sale made and paid', 'sales made and paid')} directly through the app: ${b(f.liquidoOnline)}.`,
          ),
          countUp: true,
        },
        {
          target: 'fl-incentivos',
          title: L('Reembolso dos incentivos', 'Reembolso de incentivos', 'Refund of incentives'),
          body: L(
            `Em algumas vendas, foram utilizados cupons do Bigou. Quando o Bigou oferece o cupom para o cliente, quem paga esse desconto é a plataforma, não você. Você só paga se você criar o cupom.<br>Aqui ela devolve esse valor: ${b(f.reembolso)}.`,
            `En algunas ventas se usaron cupones de Bigou. Cuando Bigou le ofrece el cupón al cliente, quien paga ese descuento es la plataforma, no tú. Solo pagas si tú creas el cupón.<br>Aquí te devuelve ese valor: ${b(f.reembolso)}.`,
            `Some sales used Bigou coupons. When Bigou gives the customer a coupon, the platform pays for that discount, not you. You only pay if you create the coupon.<br>Here the platform gives that amount back: ${b(f.reembolso)}.`,
          ),
          foot: L('Dica: quando chegar um pedido com cupom de desconto, aceite normalmente.', 'Consejo: cuando llegue un pedido con cupón de descuento, acéptalo normalmente.', 'Tip: when an order with a discount coupon comes in, accept it as usual.'),
        },
        {
          target: 'fl-taxas-online',
          title: L('Taxas de serviço online', 'Tasas de servicio online', 'Online service fees'),
          body: L(
            `Em cada pedido, o cliente paga uma taxa de serviço: ${taxaTxt}. Nas vendas online, ela foi paga pelo aplicativo.<br>Ela entra aqui, mas <b>não é sua</b>: sai mais abaixo, na linha Taxa de serviço.`,
            `En cada pedido, el cliente paga una tasa de servicio: ${taxaTxt}. En las ventas online, se pagó por la aplicación.<br>Entra aquí, pero <b>no es tuya</b>: sale más abajo, en la línea Tasa de Servicio.`,
            `On each order, the customer pays a service fee: ${taxaTxt}. In online sales, it was paid through the app.<br>It comes in here, but <b>it is not yours</b>: it goes out further down, on the Service fee line.`,
          ),
        },
        {
          target: 'fl-entradas',
          title: L('Tudo o que entrou', 'Todo lo que entró', 'Everything that came in'),
          body: L('Somando as 3 linhas, você tem todo o valor online que passou pela plataforma.', 'Sumando las 3 líneas, tienes todo el valor online que pasó por la plataforma.', 'Adding up the 3 lines, you get the whole online amount that went through the platform.'),
          calc: [
            { l: L('Vendas online', 'Ventas online', 'Online sales'), v: f.liquidoOnline },
            { op: '+', l: L('Reembolso dos incentivos', 'Reembolso de incentivos', 'Refund of incentives'), v: f.reembolso },
            { op: '+', l: L('Taxas de serviço online', 'Tasas de servicio online', 'Online service fees'), v: f.taxasOnline },
            { op: '=', l: L('Total que passou pela plataforma', 'Total que pasó por la plataforma', 'Total that went through the platform'), v: f.creditos, total: true },
          ],
          foot: L('É o mesmo valor do pagamento online que você viu no Relatório.', 'Es el mismo valor del pago online que viste en el Informe.', 'It is the same online payment amount you saw in the Report.'),
        },
      ],
      resumo: L(
        [
          'A fatura junta as vendas de um período.',
          'VIGENTE: a fatura está aberta.',
          'Entram as vendas online, os cupons do Bigou devolvidos e as taxas de serviço online.',
        ],
        [
          'La factura reúne las ventas de un período.',
          'VIGENTE: la factura está abierta.',
          'Entran las ventas online, los cupones de Bigou devueltos y las tasas de servicio online.',
        ],
        [
          'The invoice includes the sales from one period.',
          'OPEN: the invoice is still open.',
          'It includes online sales, Bigou coupons paid back to you and online service fees.',
        ],
      ),
    };

    /* 6 ------------------------------------------------------------------ */
    const cn = d.canc;
    const cancTxt = pl(cn.n, L('pedido foi cancelado', 'pedido fue cancelado', 'order was canceled'), L('pedidos foram cancelados', 'pedidos fueron cancelados', 'orders were canceled'));
    const mensalidadeStep = {
      target: 'fl-mensalidade',
      title: L('Mensalidade', 'Mensualidad', 'Monthly fee'),
      body: L(
        `A mensalidade é de ${b(f.mensalidade)}, cobrada apenas quando a loja atinge o faturamento mínimo de ${limite} em Total Bruto.<br>Suas vendas somaram ${b(d.totalBruto)}. É um valor fixo por mês, <b>separado</b> da comissão.`,
        `La mensualidad es de ${b(f.mensalidade)}, y se cobra solo cuando la tienda alcanza la facturación mínima de ${limite} en Total Bruto.<br>Tus ventas sumaron ${b(d.totalBruto)}. Es un valor fijo por mes, <b>aparte</b> de la comisión.`,
        `The monthly fee is ${b(f.mensalidade)}, charged only when the store reaches the minimum revenue of ${limite} in Gross Total.<br>Your sales added up to ${b(d.totalBruto)}. It is a fixed amount per month, <b>separate</b> from the commission.`,
      ),
      countUp: true,
    };
    const debitosStep = {
      target: 'fl-debitos',
      title: L('Débitos remanescentes', 'Débitos pendientes', 'Remaining debits'),
      body: L(
        `Na virada do mês passado, a mensalidade foi deduzida, mas não havia saldo online suficiente para receber, porque todos os valores online foram antecipados durante o mês.<br>O valor veio para esta fatura: ${b(f.debitoRemanescente)}.`,
        `Al cierre del mes pasado se descontó la mensualidad, pero no había saldo online suficiente, porque todos los valores online se anticiparon durante el mes.<br>El valor pasó a esta factura: ${b(f.debitoRemanescente)}.`,
        `At the end of last month, the monthly fee was deducted, but there was not enough online balance to cover it, because all online amounts were paid out early during the month.<br>The amount moved to this invoice: ${b(f.debitoRemanescente)}.`,
      ),
      foot: L(
        'Dica: o boleto deve ser pago caso a loja fique sem saldo online suficiente no pagamento online.',
        'Consejo: el boleto se debe pagar si la tienda se queda sin saldo online suficiente en el pago online.',
        'Tip: the bank slip must be paid if the store does not have enough online balance from online payments.',
      ),
      countUp: true,
    };
    const cobrancasCalc = [
      { l: L('Débitos remanescentes', 'Débitos pendientes', 'Remaining debits'), v: f.debitoRemanescente },
      { l: L('Comissão', 'Comisión', 'Commission'), v: f.comissao },
      { l: L('Taxa do pagamento online', 'Tasa de Pago Online', 'Online payment fee'), v: f.taxaOnline },
      { l: L('Taxa de transferência', 'Tasa bancaria', 'Transfer fee'), v: f.transferencia },
      { l: L('Taxa de antecipação', 'Tasa de Anticipo', 'Early payout fee'), v: f.taxaAntecipacao },
      { l: L('Taxa de serviço', 'Tasa de Servicio', 'Service fee'), v: f.taxaServico },
      { l: L('Mensalidade', 'Mensualidad', 'Monthly fee'), v: f.mensalidade },
      { op: '=', l: L('Total das deduções', 'Total de deducciones', 'Total deductions'), v: f.cobrancas, total: true },
    ];

    const m6 = {
      n: 6,
      titulo: L('Fatura: comissão', 'Factura: comisión', 'Invoice: commission'),
      desc: L('A comissão e os pedidos cancelados por tempo.', 'La comisión y los pedidos cancelados por tiempo.', 'The commission and orders canceled by timeout.'),
      icone: 'faturaSai',
      intro: L(
        'Agora, as deduções. Todas saem do valor online que passou pela plataforma, ou seja, do pagamento online. Começamos pela comissão.',
        'Ahora, las deducciones. Todas salen del valor online que pasó por la plataforma, es decir, del pago online. Empezamos por la comisión.',
        'Now, the deductions. They all come out of the online amount that went through the platform, that is, from online payment. We start with the commission.',
      ),
      aprender: L(
        ['Os débitos remanescentes', 'Como a comissão é calculada', 'Pedidos cancelados por tempo', 'Onde aceitar os pedidos a tempo'],
        ['Los débitos pendientes', 'Cómo se calcula la comisión', 'Pedidos cancelados por tiempo', 'Dónde aceptar los pedidos a tiempo'],
        ['Remaining debits', 'How the commission is calculated', 'Orders canceled by timeout', 'Where to accept orders on time'],
      ),
      steps: [
        Object.assign({ state: S('financeiro', ['fatura']) }, debitosStep),
        {
          target: 'fl-comissao',
          title: L('Comissão', 'Comisión', 'Commission'),
          body: L(
            `É a parte da plataforma pelas vendas feitas pelo aplicativo: ${b(f.comissao)}.<br>Ela vale para <b>todas</b> as vendas: online, dinheiro e maquininha.`,
            `Es la parte de la plataforma por las ventas hechas por la aplicación: ${b(f.comissao)}.<br>Se aplica a <b>todas</b> las ventas: online, efectivo y POS.`,
            `It is the platform's share of the sales made through the app: ${b(f.comissao)}.<br>It applies to <b>all</b> sales: online, cash and card machine.`,
          ),
          countUp: true,
        },
        {
          target: 'fl-comissao-info',
          mode: 'click',
          pad: 6,
          title: L('Veja a conta da comissão', 'Mira la cuenta de la comisión', 'See how the commission is calculated'),
          body: L('Clique no <b>ⓘ</b> ao lado de <b>Comissão</b>.', 'Haz clic en el <b>ⓘ</b> al lado de <b>Comisión</b>.', 'Click the <b>ⓘ</b> next to <b>Commission</b>.'),
          hint: cliqueInfo,
        },
        {
          state: S('financeiro', ['fatura', 'comissao']),
          target: 'cm-vendas',
          title: L('Todas as vendas entram', 'Entran todas las ventas', 'All sales are included'),
          body: L(
            `A conta começa com as <b>${d.n} vendas confirmadas</b> do mês, de todas as formas de pagamento: ${b(d.totalBruto)}.<br>É o mesmo Total Bruto do Relatório.`,
            `La cuenta empieza con las <b>${d.n} ventas confirmadas</b> del mes, de todas las formas de pago: ${b(d.totalBruto)}.<br>Es el mismo Total Bruto del Informe.`,
            `The calculation starts with the <b>${d.n} confirmed sales</b> of the month, from all payment methods: ${b(d.totalBruto)}.<br>It is the same Gross Total as in the Report.`,
          ),
          countUp: true,
        },
        {
          target: 'cm-canceladas',
          title: L('Venda cancelada por tempo', 'Venta cancelada por tiempo', 'Sale canceled by timeout'),
          body: L(
            `${cancTxt} porque não ${cn.n === 1 ? 'foi aceito nem recusado' : 'foram aceitos nem recusados'} em até <b>15 minutos</b>.<br>Você <b>não recebeu</b> esse valor, mas ele <b>entra na conta da comissão</b>: ${b(cn.bruto)}.`,
            `${cancTxt} porque no ${cn.n === 1 ? 'fue aceptado ni rechazado' : 'fueron aceptados ni rechazados'} en hasta <b>15 minutos</b>.<br><b>No recibiste</b> ese valor, pero <b>entra en la cuenta de la comisión</b>: ${b(cn.bruto)}.`,
            `${cancTxt} because ${cn.n === 1 ? 'it was not accepted or declined' : 'they were not accepted or declined'} within <b>15 minutes</b>.<br>You <b>did not receive</b> this money, but it <b>counts toward the commission</b>: ${b(cn.bruto)}.`,
          ),
          countUp: true,
        },
        {
          target: 'cm-bruto',
          title: L('O total bruto da comissão', 'El total bruto de la comisión', 'The gross total for commission'),
          body: L('Por isso, aqui o total é maior que o Total Bruto do Relatório.', 'Por eso, aquí el total es mayor que el Total Bruto del Informe.', 'That is why the total here is higher than the Gross Total in the Report.'),
          calc: [
            { l: L('Vendas confirmadas', 'Ventas confirmadas', 'Confirmed sales'), v: d.totalBruto },
            { op: '+', l: pl(cn.n, L('Cancelada por tempo', 'Cancelada por tiempo', 'Canceled by timeout'), L('Canceladas por tempo', 'Canceladas por tiempo', 'Canceled by timeout')), v: cn.bruto },
            { op: '=', l: L('Total bruto da comissão', 'Total bruto de la comisión', 'Gross total for commission'), v: f.brutoComissao, total: true },
          ],
          wide: true,
        },
        {
          target: 'cm-taxas',
          title: L('A taxa de serviço sai da conta', 'La tasa de servicio sale de la cuenta', 'The service fee is left out'),
          body: L(
            'A comissão <b>não</b> considera a taxa de serviço, porque ela foi paga pelo cliente e é da plataforma.',
            'La comisión <b>no</b> considera la tasa de servicio, porque la pagó el cliente y es de la plataforma.',
            'The commission does <b>not</b> include the service fee, because the customer paid it and it belongs to the platform.',
          ),
        },
        {
          target: 'cm-comissao',
          title: L(`A comissão é ${PCT(T.comissao)}`, `La comisión es ${PCT(T.comissao)}`, `The commission is ${PCT(T.comissao)}`),
          body: L('Sobra o valor dos produtos. A comissão é uma parte desse valor.', 'Queda el valor de los productos. La comisión es una parte de ese valor.', 'What is left is the value of the products. The commission is a part of that value.'),
          calc: [
            { l: L('Base de cálculo', 'Base de cálculo', 'Calculation base'), v: f.baseComissao },
            { op: '×', l: PCT(T.comissao), txt: PCT(T.comissao) },
            { op: '=', l: L('Comissão', 'Comisión', 'Commission'), v: f.comissao, total: true },
          ],
          countUp: true,
        },
        {
          state: S('financeiro', [], { sidebar: true }),
          target: 'nav-pedidos',
          mode: 'click',
          pad: 4,
          title: L('Como evitar o cancelamento por tempo', 'Cómo evitar la cancelación por tiempo', 'How to avoid cancellation by timeout'),
          body: L('Os pedidos novos chegam na tela <b>Pedidos</b>.<br>Clique em <b>Pedidos</b> no menu.', 'Los pedidos nuevos llegan a la pantalla <b>Pedidos</b>.<br>Haz clic en <b>Pedidos</b> en el menú.', 'New orders come in on the <b>Orders</b> screen.<br>Click <b>Orders</b> in the menu.'),
          hint: L('Clique em Pedidos', 'Haz clic en Pedidos', 'Click Orders'),
        },
        {
          state: S('pedidos'),
          target: 'pd-aguardando',
          pad: 2,
          title: L('Pedido aguardando confirmação', 'Pedido esperando confirmación', 'Order waiting for confirmation'),
          body: L(
            'Quando chega um pedido novo, ele aparece aqui.<br>Você tem até <b>15 minutos</b> para aceitar ou recusar.',
            'Cuando llega un pedido nuevo, aparece aquí.<br>Tienes hasta <b>15 minutos</b> para aceptarlo o rechazarlo.',
            'When a new order comes in, it shows up here.<br>You have up to <b>15 minutes</b> to accept or decline it.',
          ),
        },
        {
          target: 'pd-head',
          title: L('Fique de olho nesta tela', 'Mantén un ojo en esta pantalla', 'Keep an eye on this screen'),
          body: L(
            'Se o pedido não for aceito nem recusado em 15 minutos, ele é cancelado automaticamente.<br>Você perde a venda e ainda paga a comissão sobre ela.',
            'Si el pedido no se acepta ni se rechaza en 15 minutos, se cancela automáticamente.<br>Pierdes la venta y además pagas la comisión sobre ella.',
            'If the order is not accepted or declined within 15 minutes, it is canceled automatically.<br>You lose the sale and still pay the commission on it.',
          ),
          foot: L(
            'Dica: se não puder atender um pedido, recuse dentro do prazo. Assim ele não entra na comissão.',
            'Consejo: si no puedes atender un pedido, recházalo dentro del plazo. Así no entra en la comisión.',
            'Tip: if you cannot take an order, decline it in time. That way it does not count toward the commission.',
          ),
        },
      ],
      resumo: L(
        [
          'Débitos remanescentes: deduções que ficaram sem saldo online em uma fatura anterior.',
          `Comissão: ${PCT(T.comissao)} do valor dos produtos de todas as vendas.`,
          'Pedido não aceito nem recusado em 15 minutos é cancelado e entra na comissão.',
          'Acompanhe a tela Pedidos e aceite ou recuse cada pedido a tempo.',
        ],
        [
          'Débitos pendientes: deducciones que quedaron sin saldo online en una factura anterior.',
          `Comisión: ${PCT(T.comissao)} del valor de los productos de todas las ventas.`,
          'Un pedido que no se acepta ni se rechaza en 15 minutos se cancela y entra en la comisión.',
          'Sigue la pantalla Pedidos y acepta o rechaza cada pedido a tiempo.',
        ],
        [
          'Remaining debits: deductions that had no online balance on an earlier invoice.',
          `Commission: ${PCT(T.comissao)} of the product value of all sales.`,
          'An order not accepted or declined within 15 minutes is canceled and counts toward the commission.',
          'Watch the Orders screen and accept or decline each order on time.',
        ],
      ),
    };

    /* 7 ------------------------------------------------------------------ */
    const m7 = {
      n: 7,
      titulo: L('Fatura: taxas', 'Factura: tasas', 'Invoice: fees'),
      desc: L('Pagamento online, transferência e antecipação.', 'Pago online, tasa bancaria y anticipo.', 'Online payment, transfer and early payout.'),
      icone: 'percent',
      intro: L('Agora, as taxas da fatura.', 'Ahora, las tasas de la factura.', 'Now, the fees on the invoice.'),
      aprender: L(
        ['A taxa do pagamento online', 'A taxa de transferência', 'A taxa de antecipação'],
        ['La Tasa de Pago Online', 'La tasa bancaria', 'La Tasa de Anticipo'],
        ['The online payment fee', 'The transfer fee', 'The early payout fee'],
      ),
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-taxa-online',
          title: L('Taxa do pagamento online', 'Tasa de Pago Online', 'Online payment fee'),
          body: L(
            `É a dedução somente dos valores pagos pelo aplicativo: ${b(f.taxaOnline)}.<br>Ela vale <b>só</b> para as vendas com pagamento online.`,
            `Es la deducción solo de los valores pagados por la aplicación: ${b(f.taxaOnline)}.<br>Se aplica <b>solo</b> a las ventas con pago online.`,
            `It is a deduction only on amounts paid through the app: ${b(f.taxaOnline)}.<br>It applies <b>only</b> to sales with online payment.`,
          ),
          countUp: true,
        },
        {
          target: 'fl-taxa-online-info',
          mode: 'click',
          pad: 6,
          title: L('Veja a conta da taxa', 'Mira la cuenta de la tasa', 'See how the fee is calculated'),
          body: L('Clique no <b>ⓘ</b> ao lado de <b>Taxa do pagamento online</b>.', 'Haz clic en el <b>ⓘ</b> al lado de <b>Tasa de Pago Online</b>.', 'Click the <b>ⓘ</b> next to <b>Online payment fee</b>.'),
          hint: cliqueInfo,
        },
        {
          state: S('financeiro', ['fatura', 'taxaOnline']),
          target: 'to-calc',
          title: L(`A taxa é ${PCT(T.pagamentoOnline)} das vendas online`, `La tasa es el ${PCT(T.pagamentoOnline)} de las ventas online`, `The fee is ${PCT(T.pagamentoOnline)} of online sales`),
          calc: [
            { l: L('Total das vendas online', 'Total de ventas online', 'Total online sales'), v: f.brutoOnline },
            { op: '−', l: L('Taxas de serviço online', 'Tasas de servicio online', 'Online service fees'), v: on.taxas },
            { op: '=', l: L('Base de cálculo', 'Base de cálculo', 'Calculation base'), v: f.baseOnline, hl: true },
            { op: '×', l: PCT(T.pagamentoOnline), txt: PCT(T.pagamentoOnline) },
            { op: '=', l: L('Taxa do pagamento online', 'Tasa de Pago Online', 'Online payment fee'), v: f.taxaOnline, total: true },
          ],
          wide: true,
        },
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-transferencia',
          title: L('Taxa de transferência', 'Tasa bancaria', 'Transfer fee'),
          body: L(
            `${b(f.transferencia)}. É referente a despesas bancárias.<br>É cobrada uma única vez no dia do repasse mensal ou toda vez que você antecipar.`,
            `${b(f.transferencia)}. Corresponde a gastos bancarios.<br>Se cobra una sola vez el día de la transferencia mensual o cada vez que anticipas.`,
            `${b(f.transferencia)}. It covers bank costs.<br>It is charged once on the day of the monthly payout, or every time you request early payout.`,
          ),
        },
        {
          target: 'fl-antecipacao',
          title: L('Taxa de antecipação', 'Tasa de Anticipo', 'Early payout fee'),
          body: L(
            `É ${PCT(T.antecipacao)} do total das vendas online.<br>Ela já aparece deduzida aqui, mas <b>só é aplicada se você pedir a antecipação</b>.`,
            `Es el ${PCT(T.antecipacao)} del total de las ventas online.<br>Ya aparece descontada aquí, pero <b>solo se aplica si pides el anticipo</b>.`,
            `It is ${PCT(T.antecipacao)} of total online sales.<br>It already shows here as deducted, but <b>it only applies if you request early payout</b>.`,
          ),
          calc: [
            { l: L('Total das vendas online', 'Total de ventas online', 'Total online sales'), v: on.bruto },
            { op: '×', l: PCT(T.antecipacao), txt: PCT(T.antecipacao) },
            { op: '=', l: L('Taxa de antecipação', 'Tasa de Anticipo', 'Early payout fee'), v: f.taxaAntecipacao, total: true },
          ],
          wide: true,
        },
      ],
      resumo: L(
        [
          `Taxa do pagamento online: ${PCT(T.pagamentoOnline)}, só das vendas online.`,
          `Taxa de transferência: ${F(f.transferencia)}, de despesas bancárias.`,
          `Taxa de antecipação: ${PCT(T.antecipacao)} das vendas online, só se você antecipar.`,
        ],
        [
          `Tasa de Pago Online: ${PCT(T.pagamentoOnline)}, solo de las ventas online.`,
          `Tasa bancaria: ${F(f.transferencia)}, por gastos bancarios.`,
          `Tasa de Anticipo: ${PCT(T.antecipacao)} de las ventas online, solo si anticipas.`,
        ],
        [
          `Online payment fee: ${PCT(T.pagamentoOnline)}, only on online sales.`,
          `Transfer fee: ${F(f.transferencia)}, for bank costs.`,
          `Early payout fee: ${PCT(T.antecipacao)} of online sales, only if you request early payout.`,
        ],
      ),
    };

    /* 8 ------------------------------------------------------------------ */
    // Um pedido pago em dinheiro, para mostrar a taxa de serviço no caixa da loja
    const exDin = d.orders.find((o) => o.pag === 'dinheiro');
    const taxasCaixa = di.taxas + mq.taxas;
    const m8 = {
      n: 8,
      titulo: L('Fatura: taxa de serviço e mensalidade', 'Factura: tasa de servicio y mensualidad', 'Invoice: service fee and monthly fee'),
      desc: L('De quem é a taxa de serviço e quando há mensalidade.', 'De quién es la tasa de servicio y cuándo hay mensualidad.', 'Who the service fee belongs to and when there is a monthly fee.'),
      icone: 'moedas',
      intro: L(
        'Vamos entender a taxa de serviço, a mensalidade e fechar a conta das deduções.',
        'Vamos a entender la tasa de servicio, la mensualidad y cerrar la cuenta de las deducciones.',
        "Let's understand the service fee and the monthly fee, and finish the deductions.",
      ),
      aprender: L(
        ['De quem é a taxa de serviço', 'Por que ela aparece como dedução', 'A mensalidade', 'Como não absorver os custos'],
        ['De quién es la tasa de servicio', 'Por qué aparece como deducción', 'La mensualidad', 'Cómo no absorber los costos'],
        ['Who the service fee belongs to', 'Why it shows up as a deduction', 'The monthly fee', 'How to avoid absorbing the costs'],
      ),
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-taxa-servico',
          title: L('Taxa de serviço: de quem é?', 'Tasa de servicio: ¿de quién es?', 'Service fee: whose is it?'),
          body: L(
            `Em cada pedido, o cliente paga uma taxa de serviço, além dos produtos: ${taxaTxt}.<br>Essa taxa é <b>da plataforma</b>. Não é um custo seu: quem paga é o cliente.`,
            `En cada pedido, el cliente paga una tasa de servicio, además de los productos: ${taxaTxt}.<br>Esa tasa es <b>de la plataforma</b>. No es un costo tuyo: la paga el cliente.`,
            `On each order, the customer pays a service fee on top of the products: ${taxaTxt}.<br>This fee belongs to <b>the platform</b>. It is not your cost: the customer pays it.`,
          ),
        },
        {
          target: 'fl-taxas-online',
          title: L('No pagamento online: entra e sai', 'En el pago online: entra y sale', 'With online payment: it comes in and goes out'),
          body: L(
            `Nas vendas online, o cliente pagou a taxa pelo aplicativo. Ela entrou na fatura aqui (${b(on.taxas)}) e sai na linha Taxa de serviço.<br>Você não paga comissão nem taxas sobre o valor da taxa de serviço.`,
            `En las ventas online, el cliente pagó la tasa por la aplicación. Entró en la factura aquí (${b(on.taxas)}) y sale en la línea Tasa de Servicio.<br>No pagas comisión ni tasas sobre el valor de la tasa de servicio.`,
            `In online sales, the customer paid the fee through the app. It came into the invoice here (${b(on.taxas)}) and goes out on the Service fee line.<br>You do not pay commission or fees on the service fee amount.`,
          ),
        },
        {
          target: 'fl-taxa-servico-info',
          mode: 'click',
          pad: 6,
          title: L('Veja a conta da taxa de serviço', 'Mira la cuenta de la tasa de servicio', 'See how the service fee is calculated'),
          body: L('Clique no <b>ⓘ</b> ao lado de <b>Taxa de serviço</b>.', 'Haz clic en el <b>ⓘ</b> al lado de <b>Tasa de Servicio</b>.', 'Click the <b>ⓘ</b> next to <b>Service fee</b>.'),
          hint: cliqueInfo,
        },
        {
          state: S('financeiro', ['fatura', 'taxaServico']),
          target: 'ts-offline',
          title: L('No dinheiro e na maquininha: a taxa ficou com você', 'En efectivo y POS: la tasa se quedó contigo', 'With cash and card machine: the fee stayed with you'),
          fala: exDin ? L(
            [
              `Em um pedido pago em dinheiro, o cliente pagou ${F(exDin.bruto)}: ${F(exDin.itens)} dos produtos e ${F(exDin.taxa)} de taxa de serviço.`,
              'Essa taxa é da plataforma, mas ficou no seu caixa. Por isso, ela é deduzida aqui.',
            ],
            [
              `En un pedido pagado en efectivo, el cliente pagó ${F(exDin.bruto)}: ${F(exDin.itens)} de los productos y ${F(exDin.taxa)} de tasa de servicio.`,
              'Esa tasa es de la plataforma, pero se quedó en tu caja. Por eso se descuenta aquí.',
            ],
            [
              `In an order paid in cash, the customer paid ${F(exDin.bruto)}: ${F(exDin.itens)} for the products and ${F(exDin.taxa)} for the service fee.`,
              'This fee belongs to the platform, but it stayed in your till. That is why it is deducted here.',
            ],
          ) : null,
          body: (exDin ? L(
            `No pedido ${exDin.cod}, pago em dinheiro, o cliente pagou ${b(exDin.bruto)}: ${F(exDin.itens)} dos produtos e ${F(exDin.taxa)} de taxa de serviço.<br>`,
            `En el pedido ${exDin.cod}, pagado en efectivo, el cliente pagó ${b(exDin.bruto)}: ${F(exDin.itens)} de los productos y ${F(exDin.taxa)} de tasa de servicio.<br>`,
            `In order ${exDin.cod}, paid in cash, the customer paid ${b(exDin.bruto)}: ${F(exDin.itens)} for the products and ${F(exDin.taxa)} for the service fee.<br>`,
          ) : '') +
            L('Essa taxa é da plataforma, mas <b>ficou no seu caixa</b>. Por isso, ela é deduzida aqui.', 'Esa tasa es de la plataforma, pero <b>se quedó en tu caja</b>. Por eso se descuenta aquí.', 'This fee belongs to the platform, but <b>it stayed in your till</b>. That is why it is deducted here.'),
          calc: [
            { l: L('Taxas recebidas em dinheiro', 'Tasas recibidas en efectivo', 'Fees received in cash'), v: di.taxas },
            { op: '+', l: L('Taxas recebidas na maquininha', 'Tasas recibidas en POS', 'Fees received on the card machine'), v: mq.taxas },
            { op: '=', l: L('Ficaram no seu caixa', 'Se quedaron en tu caja', 'Stayed in your till'), v: taxasCaixa, total: true },
          ],
          wide: true,
        },
        {
          target: 'ts-devolvido',
          title: L('A taxa da maquininha volta para você', 'La tasa del POS vuelve a ti', 'The card machine fee comes back to you'),
          body: L(
            `A maquininha cobra uma taxa sobre tudo o que passa nela, inclusive sobre a taxa de serviço.<br>Para você não pagar por isso, a plataforma devolve ${PCT(T.devolucaoMaquininha)}.`,
            `El POS cobra una tasa sobre todo lo que pasa por él, incluso sobre la tasa de servicio.<br>Para que no pagues por eso, la plataforma te devuelve el ${PCT(T.devolucaoMaquininha)}.`,
            `The card machine charges a fee on everything that goes through it, including the service fee.<br>So you do not pay for that, the platform gives back ${PCT(T.devolucaoMaquininha)}.`,
          ),
          calc: [
            { l: L('Taxas pagas na maquininha', 'Tasas pagadas en POS', 'Fees paid on the card machine'), v: mq.taxas },
            { op: '×', l: PCT(T.devolucaoMaquininha), txt: PCT(T.devolucaoMaquininha) },
            { op: '=', l: L('Devolvido para você', 'Devuelto a ti', 'Returned to you'), v: f.devolucao, total: true },
          ],
        },
        {
          target: 'ts-total',
          title: L('Resumindo a taxa de serviço', 'Resumen de la tasa de servicio', 'Service fee in short'),
          body: L(
            'Você só repassa para a plataforma a taxa que o cliente pagou. Ela <b>não sai</b> do valor dos seus produtos.',
            'Solo le pasas a la plataforma la tasa que pagó el cliente. <b>No sale</b> del valor de tus productos.',
            'You only pass on to the platform the fee the customer paid. It <b>does not come out</b> of the value of your products.',
          ),
          calc: [
            { l: L('Paga online (entrou na fatura)', 'Pagada online (entró en la factura)', 'Paid online (came into the invoice)'), v: on.taxas },
            { op: '+', l: L('Paga no seu caixa', 'Pagada en tu caja', 'Paid at your till'), v: taxasCaixa },
            { op: '−', l: L('Devolvido da maquininha', 'Devuelto del POS', 'Returned from the card machine'), v: f.devolucao },
            { op: '=', l: L('Taxa de serviço', 'Tasa de Servicio', 'Service fee'), v: f.taxaServico, total: true },
          ],
          wide: true,
          countUp: true,
        },
        Object.assign({ state: S('financeiro', ['fatura']) }, mensalidadeStep),
        {
          target: 'fl-cobrancas',
          title: L('Todas as deduções', 'Todas las deducciones', 'All deductions'),
          body: L('Todas saem do valor que passou pela plataforma, ou seja, do pagamento online.', 'Todas salen del valor que pasó por la plataforma, es decir, del pago online.', 'They all come out of the amount that went through the platform, that is, from online payment.'),
          calc: cobrancasCalc,
          wide: true,
        },
        {
          state: S('financeiro', [], { sidebar: true }),
          target: 'nav-cardapio',
          pad: 4,
          title: L('Você pode ajustar seus preços', 'Puedes ajustar tus precios', 'You can adjust your prices'),
          body: L(
            'Fique tranquilo: você pode ajustar o valor dos seus produtos para não absorver o custo da comissão e das taxas.<br>Confira se o seu cardápio já está atualizado. Se não estiver, fale com o nosso suporte para atualizar.',
            'Tranquilo: puedes ajustar el valor de tus productos para no absorber el costo de la comisión y las tasas.<br>Revisa si tu menú ya está actualizado. Si no lo está, habla con nuestro soporte para actualizarlo.',
            'Do not worry: you can adjust the price of your products so you do not absorb the cost of the commission and fees.<br>Check that your menu is up to date. If it is not, talk to our support team to update it.',
          ),
        },
      ],
      resumo: L(
        [
          'Taxa de serviço: paga pelo cliente, é da plataforma.',
          'No online, ela entra e sai da fatura. No dinheiro e na maquininha, ficou no seu caixa e é deduzida.',
          `Mensalidade: ${valorMens}, só quando a loja atinge o faturamento mínimo (${limite} em Total Bruto).`,
          'Você pode ajustar os preços do seu cardápio para não absorver esses custos.',
        ],
        [
          'Tasa de servicio: la paga el cliente y es de la plataforma.',
          'En el online, entra y sale de la factura. En efectivo y POS, se quedó en tu caja y se descuenta.',
          `Mensualidad: ${valorMens}, solo cuando la tienda alcanza la facturación mínima (${limite} en Total Bruto).`,
          'Puedes ajustar los precios de tu menú para no absorber esos costos.',
        ],
        [
          'Service fee: paid by the customer, it belongs to the platform.',
          'Online, it comes into the invoice and goes out again. With cash and card machine, it stayed in your till and is deducted.',
          `Monthly fee: ${valorMens}, only when the store reaches the minimum revenue (${limite} in Gross Total).`,
          'You can adjust your menu prices so you do not absorb these costs.',
        ],
      ),
    };

    /* 9 ------------------------------------------------------------------ */
    const pago = { antecipada: true, repassado: true };
    const m9 = {
      n: 9,
      titulo: L('Repasse e antecipação', 'Transferencia y anticipo', 'Payout and early payout'),
      icone: 'foguete',
      desc: L('Por que o repasse parece menor, como receber antes e o comprovante.', 'Por qué la transferencia parece menor, cómo recibir antes y el comprobante.', 'Why the payout looks smaller, how to get paid sooner and the receipt.'),
      intro: L(
        'Vamos fechar a conta, aprender a receber o repasse antes e onde pegar o comprovante.',
        'Vamos a cerrar la cuenta, aprender a recibir la transferencia antes y dónde obtener el comprobante.',
        "Let's finish the calculation, learn how to get the payout sooner and where to find the receipt.",
      ),
      aprender: L(
        ['Como o repasse é formado', 'Por que ele parece pequeno', 'Como pedir a antecipação', 'Onde pegar o comprovante'],
        ['Cómo se compone la transferencia', 'Por qué parece pequeña', 'Cómo pedir el anticipo', 'Dónde obtener el comprobante'],
        ['How the payout is made up', 'Why it looks small', 'How to request early payout', 'Where to find the receipt'],
      ),
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-total',
          title: L('O repasse', 'La transferencia', 'The payout'),
          body: L('É o que será repassado para você depois das deduções.', 'Es lo que se te transferirá después de las deducciones.', 'It is what will be paid out to you after the deductions.'),
          calc: [
            { l: L('Total que passou pela plataforma', 'Total que pasó por la plataforma', 'Total that went through the platform'), v: f.creditos },
            { op: '−', l: L('Deduções', 'Deducciones', 'Deductions'), v: f.cobrancas },
            { op: '=', l: L('Repasse', 'Transferencia', 'Payout'), v: f.total, total: true },
          ],
          countUp: true,
        },
        {
          target: 'fl-total',
          title: L('Por que o repasse parece pequeno?', '¿Por qué la transferencia parece pequeña?', 'Why does the payout look small?'),
          fala: L(
            [
              `Você vendeu ${F(d.totalBruto)}, mas o repasse é ${F(f.total)}.`,
              `Isso acontece porque as deduções de todas as vendas saem só dos ${F(plataforma)} que passaram pela plataforma.`,
              `Os outros ${F(caixa)}, das vendas em dinheiro e maquininha, já estão no seu caixa.`,
            ],
            [
              `Vendiste ${F(d.totalBruto)}, pero la transferencia es de ${F(f.total)}.`,
              `Esto pasa porque las deducciones de todas las ventas salen solo de los ${F(plataforma)} que pasaron por la plataforma.`,
              `Los otros ${F(caixa)}, de las ventas en efectivo y POS, ya están en tu caja.`,
            ],
            [
              `You sold ${F(d.totalBruto)}, but the payout is ${F(f.total)}.`,
              `This happens because the deductions for all sales come out only of the ${F(plataforma)} that went through the platform.`,
              `The other ${F(caixa)}, from cash and card machine sales, is already in your till.`,
            ],
          ),
          body: L(
            `Você vendeu ${b(d.totalBruto)}, mas o repasse é ${b(f.total)}.<br>Isso acontece porque as deduções de <b>todas</b> as vendas saem <b>só</b> do valor que passou pela plataforma.`,
            `Vendiste ${b(d.totalBruto)}, pero la transferencia es de ${b(f.total)}.<br>Esto pasa porque las deducciones de <b>todas</b> las ventas salen <b>solo</b> del valor que pasó por la plataforma.`,
            `You sold ${b(d.totalBruto)}, but the payout is ${b(f.total)}.<br>This happens because the deductions for <b>all</b> sales come out <b>only</b> of the amount that went through the platform.`,
          ),
          calc: [
            { l: L('Pagamento online (pela plataforma)', 'Pago online (por la plataforma)', 'Online payment (through the platform)'), v: plataforma },
            { l: L('Dinheiro + maquininha (no seu caixa)', 'Efectivo + POS (en tu caja)', 'Cash + card machine (in your till)'), v: caixa },
          ],
          wide: true,
        },
        {
          target: 'fl-total',
          title: L('A plataforma não ficou com o seu dinheiro', 'La plataforma no se quedó con tu dinero', 'The platform did not keep your money'),
          body: L(
            'O valor das vendas em dinheiro e maquininha já estava com você. Somando com o repasse, você chega ao Resultado.',
            'El valor de las ventas en efectivo y POS ya estaba contigo. Sumándolo a la transferencia, llegas al Resultado.',
            'The money from cash and card machine sales was already with you. Add the payout and you get the Result.',
          ),
          calc: [
            { l: L('Já no seu caixa', 'Ya en tu caja', 'Already in your till'), v: caixa },
            { op: '+', l: L('Repasse', 'Transferencia', 'Payout'), v: f.total },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
          wide: true,
        },
        {
          target: 'btn-antecipar',
          mode: 'click',
          title: L('Receba antes: antecipação', 'Recibe antes: anticipo', 'Get paid sooner: early payout'),
          body: L(
            'O sistema não faz repasses automáticos durante o mês: para receber antes, é preciso solicitar a antecipação.<br>Clique em <b>Solicitar antecipação</b>.',
            'El sistema no hace transferencias automáticas durante el mes: para recibir antes, tienes que solicitar el anticipo.<br>Haz clic en <b>Solicitar anticipo</b>.',
            'The system does not make automatic payouts during the month: to get paid sooner, you need to request early payout.<br>Click <b>Request early payout</b>.',
          ),
          hint: L('Clique em Solicitar antecipação', 'Haz clic en Solicitar anticipo', 'Click Request early payout'),
        },
        {
          state: S('financeiro', ['fatura', 'antecipacao']),
          target: 'ant-box',
          title: L('Valor a receber', 'Valor a recibir', 'Amount to receive'),
          body: L(
            `É o valor do repasse: ${b(f.total)}, das vendas de ${f.inicio} até ${f.fim}.`,
            `Es el valor de la transferencia: ${b(f.total)}, de las ventas del ${f.inicio} al ${f.fim}.`,
            `It is the payout amount: ${b(f.total)}, from sales from ${f.inicio} to ${f.fim}.`,
          ),
        },
        {
          target: 'ant-data',
          title: L('Quando o dinheiro cai', 'Cuándo cae el dinero', 'When the money arrives'),
          body: L(
            `A transferência acontece no próximo dia útil (${d.sc.antecipacaoData}), na sua chave PIX.<br>Confira se os seus dados bancários estão certos.`,
            `La transferencia se hace el próximo día hábil (${d.sc.antecipacaoData}), en tu clave PIX.<br>Revisa que tus datos bancarios estén correctos.`,
            `The transfer happens on the next business day (${d.sc.antecipacaoData}), to your PIX key.<br>Check that your bank details are correct.`,
          ),
          foot: L(
            'Dica: você pode antecipar seu saldo positivo sempre que quiser. Não há repasses em fins de semana nem em feriados nacionais ou municipais de Rio Pomba - MG.',
            'Consejo: puedes anticipar tu saldo positivo cuando quieras. No hay transferencias los fines de semana ni en feriados nacionales o municipales de Rio Pomba - MG.',
            'Tip: you can request early payout of your positive balance whenever you want. There are no payouts on weekends or on national or Rio Pomba - MG city holidays.',
          ),
        },
        {
          target: 'ant-aviso',
          title: L('Atenção', 'Atención', 'Attention'),
          body: L(
            'Depois de confirmar, os pedidos desse período <b>não podem mais ser cancelados</b>.',
            'Después de confirmar, los pedidos de ese período <b>ya no se pueden cancelar</b>.',
            'After you confirm, orders from this period <b>can no longer be canceled</b>.',
          ),
        },
        {
          target: 'btn-confirmar',
          mode: 'click',
          pad: 6,
          title: L('Confirme a antecipação', 'Confirma el anticipo', 'Confirm the early payout'),
          body: L(
            'Clique em <b>CONFIRMAR</b>.<br>No treinamento, nenhum valor é enviado de verdade.',
            'Haz clic en <b>CONFIRMAR</b>.<br>En la capacitación, no se envía ningún valor de verdad.',
            'Click <b>CONFIRMAR</b>.<br>In the training, no money is actually sent.',
          ),
          hint: L('Clique em CONFIRMAR', 'Haz clic en CONFIRMAR', 'Click CONFIRMAR'),
        },
        {
          state: S('financeiro', ['fatura'], { antecipada: true }),
          target: 'fa-status',
          pad: 6,
          title: L('Fatura antecipada', 'Factura anticipada', 'Invoice paid early'),
          body: L('A fatura mudou para <b>ANTECIPADA</b>: o repasse foi solicitado.', 'La factura cambió a <b>ANTICIPADA</b>: la transferencia fue solicitada.', 'The invoice changed to <b>PAID EARLY</b>: the payout has been requested.'),
        },
        {
          state: S('financeiro', ['fatura'], pago),
          target: 'fa-repasse-realizado',
          title: L('Repasse realizado', 'Transferencia realizada', 'Payout completed'),
          body: L(
            `No dia da transferência (${d.sc.antecipacaoData}), aparece aqui <b>Repasse realizado</b>, no mesmo lugar onde você pediu a antecipação.<br>No repasse mensal, é igual.`,
            `El día de la transferencia (${d.sc.antecipacaoData}), aparece aquí <b>Transferencia realizada</b>, en el mismo lugar donde pediste el anticipo.<br>En la transferencia mensual es igual.`,
            `On the transfer day (${d.sc.antecipacaoData}), <b>Payout completed</b> shows up here, in the same place where you requested early payout.<br>The monthly payout works the same way.`,
          ),
        },
        {
          target: 'btn-comprovante',
          mode: 'click',
          pad: 6,
          title: L('Pegue o comprovante', 'Obtén el comprobante', 'Get the receipt'),
          body: L(
            'O comprovante da transferência fica aqui.<br>Clique em <b>Ver comprovante</b>.',
            'El comprobante de la transferencia está aquí.<br>Haz clic en <b>Ver comprobante</b>.',
            'The transfer receipt is here.<br>Click <b>View receipt</b>.',
          ),
          hint: L('Clique em Ver comprovante', 'Haz clic en Ver comprobante', 'Click View receipt'),
        },
        {
          state: S('financeiro', [], pago),
          target: 'fin-repasses',
          title: L('O valor foi para Repasses recebidos', 'El valor pasó a Transferencias recibidas', 'The amount moved to Payouts received'),
          body: L(
            `Quando o repasse cai na sua conta, o valor sai de <b>Repasse disponível</b> e vai para <b>Repasses recebidos</b>: ${b(f.total)}.`,
            `Cuando la transferencia cae en tu cuenta, el valor sale de <b>Transferencia disponible</b> y pasa a <b>Transferencias recibidas</b>: ${b(f.total)}.`,
            `When the payout reaches your account, the amount leaves <b>Available payout</b> and goes to <b>Payouts received</b>: ${b(f.total)}.`,
          ),
          countUp: true,
        },
        {
          target: 'fin-res',
          title: L('O Resultado não muda', 'El Resultado no cambia', 'The Result does not change'),
          body: L('O dinheiro só mudou de lugar.', 'El dinero solo cambió de lugar.', 'The money just moved to a different place.'),
          calc: [
            { l: L('Recebido pela Loja', 'Recibido por la Tienda', 'Received by the store'), v: r.recebidoLoja },
            { op: '+', l: L('Repasses recebidos', 'Transferencias recibidas', 'Payouts received'), v: f.total },
            { op: '+', l: L('Repasse disponível', 'Transferencia disponible', 'Available payout'), v: 0 },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
        },
        {
          target: 'fin-disponivel',
          title: L('Cuidado ao antecipar tudo', 'Cuidado al anticipar todo', 'Be careful when paying out everything early'),
          body:
            L(
              'A mensalidade é deduzida na virada do último dia do mês. Se você antecipou todas as faturas, normalmente não sobra saldo online.<br>Aí ela entra na próxima fatura como <b>Débitos remanescentes</b>.',
              'La mensualidad se descuenta al cierre del último día del mes. Si anticipaste todas las facturas, normalmente no queda saldo online.<br>Entonces entra en la próxima factura como <b>Débitos pendientes</b>.',
              'The monthly fee is deducted when the last day of the month ends. If you requested early payout for all invoices, there is usually no online balance left.<br>Then it goes to the next invoice as <b>Remaining debits</b>.',
            ) +
            (f.debitoRemanescente ? L('<br>Foi o que aconteceu no mês passado.', '<br>Eso fue lo que pasó el mes pasado.', '<br>That is what happened last month.') : ''),
        },
      ],
      resumo: L(
        [
          'Repasse = o que passou pela plataforma − as deduções.',
          'Ele parece pequeno porque o valor das vendas em dinheiro e maquininha já estava com você.',
          'Com a antecipação, você recebe o repasse antes.',
          'O comprovante fica na fatura, em Repasse realizado.',
          'Antecipar tudo pode deixar a mensalidade sem saldo: ela vira débito remanescente.',
        ],
        [
          'Transferencia = lo que pasó por la plataforma − las deducciones.',
          'Parece pequeña porque el valor de las ventas en efectivo y POS ya estaba contigo.',
          'Con el anticipo, recibes la transferencia antes.',
          'El comprobante está en la factura, en Transferencia realizada.',
          'Anticipar todo puede dejar la mensualidad sin saldo: se convierte en débito pendiente.',
        ],
        [
          'Payout = what went through the platform − the deductions.',
          'It looks small because the money from cash and card machine sales was already with you.',
          'With early payout, you get the payout sooner.',
          'The receipt is on the invoice, under Payout completed.',
          'Paying out everything early can leave the monthly fee without a balance: it becomes a remaining debit.',
        ],
      ),
    };

    /* Assuntos das perguntas (usados no painel admin para ver o que não foi entendido).
       Ficam sempre em português: vão nos eventos e o painel agrupa por eles. */
    const TEMA = {
      bruto: 'Total Bruto e formas de pagamento',
      online: 'Pagamento online',
      financeiro: 'Tela Financeiro',
      cupons: 'Cupons',
      comissao: 'Comissão',
      cancelados: 'Pedidos cancelados por tempo',
      taxas: 'Taxas',
      servico: 'Taxa de serviço',
      mensalidade: 'Mensalidade e débitos',
      repasse: 'Repasse, antecipação e comprovante',
    };

    /* 10 ----------------------------------------------------------------- */
    const nums = [mq.n, on.n, d.n].sort((a, c) => a - c);
    /* Perguntas — versão 2 (reescritas em 10/2026 para não induzir ao erro).
       Cada uma tem um id fixo: as respostas antigas (versão 1, sem id) são
       ligadas a ela pela posição (módulo e passo), que não muda.
       O painel pode editar os textos (TREINO.aplicarPerguntas, abaixo). */
    const QV = 2;
    const perguntas = [
      {
        id: 'f1',
        tema: TEMA.bruto,
        state: S('relatorio'),
        target: 'rp-bruto',
        q: L('Somando todas as formas de pagamento, qual foi o Total Bruto da loja no mês?', 'Sumando todas las formas de pago, ¿cuál fue el Total Bruto de la tienda en el mes?', "Adding up all payment methods, what was the store's Gross Total this month?"),
        options: [{ t: F(f.total) }, { t: F(d.totalBruto), ok: true }, { t: F(r.recebidoLoja) }],
        ok: L('O Total Bruto é a soma de todas as vendas.', 'El Total Bruto es la suma de todas las ventas.', 'Gross Total is the sum of all sales.'),
        no: L('Ainda não. Olhe o valor destacado: é o Total Bruto.', 'Todavía no. Mira el valor resaltado: es el Total Bruto.', 'Not yet. Look at the highlighted amount: that is the Gross Total.'),
      },
      {
        id: 'f2',
        tema: TEMA.bruto,
        state: S('relatorio', ['totalBruto']),
        target: 'tb-list',
        q: L('Quantas vendas foram pagas na maquininha?', '¿Cuántas ventas se pagaron con POS?', 'How many sales were paid on the card machine?'),
        options: nums.map((x) => ({ t: pl(x, L('venda', 'venta', 'sale'), L('vendas', 'ventas', 'sales')), ok: x === mq.n })),
        ok: L(`${vendasPagas(mq.n)} com maquininha de cartão.`, `${vendasPagas(mq.n)} con POS.`, `${vendasPagas(mq.n)} with a card machine.`),
        no: L('Quase! Procure o bloco "Total pago com maquininha de cartão".', '¡Casi! Busca el bloque "Total pagado con POS".', 'Almost! Look for the "Total paid with card machine" block.'),
      },
      {
        id: 'f3',
        tema: TEMA.comissao,
        state: S('financeiro', ['fatura']),
        target: 'fl-comissao',
        q: L('Sobre quais vendas a comissão é calculada?', '¿Sobre qué ventas se calcula la comisión?', 'Which sales is the commission calculated on?'),
        options: [
          { t: L('Só sobre as vendas online', 'Solo sobre las ventas online', 'Only online sales') },
          { t: L('Sobre todas, sem a taxa de serviço', 'Sobre todas, sin la tasa de servicio', 'All of them, without the service fee'), ok: true },
          { t: L('Só sobre as vendas em dinheiro', 'Solo sobre las ventas en efectivo', 'Only cash sales') },
        ],
        ok: L('Online, dinheiro e maquininha entram na conta, sem a taxa de serviço.', 'Online, efectivo y POS entran en la cuenta, sin la tasa de servicio.', 'Online, cash and card machine are all included, without the service fee.'),
        no: L('Quase! Lembre: a comissão vale para todas as formas de pagamento.', '¡Casi! Recuerda: la comisión se aplica a todas las formas de pago.', 'Almost! Remember: the commission applies to all payment methods.'),
      },
      {
        id: 'f4',
        tema: TEMA.cancelados,
        state: S('financeiro', ['fatura', 'comissao']),
        target: 'cm-canceladas',
        q: L('Este pedido foi cancelado por tempo. Por que ele entrou na comissão?', 'Este pedido fue cancelado por tiempo. ¿Por qué entró en la comisión?', 'This order was canceled by timeout. Why does it count toward the commission?'),
        options: [
          { t: L('Porque o cliente desistiu do pedido', 'Porque el cliente desistió del pedido', 'Because the customer gave up on the order') },
          { t: L('Porque foi pago em dinheiro', 'Porque se pagó en efectivo', 'Because it was paid in cash') },
          { t: L('Porque não foi aceito nem recusado a tempo', 'Porque no se aceptó ni se rechazó a tiempo', 'Because it was not accepted or declined in time'), ok: true },
        ],
        ok: L('Aceite ou recuse cada pedido em até 15 minutos, na tela Pedidos.', 'Acepta o rechaza cada pedido en hasta 15 minutos, en la pantalla Pedidos.', 'Accept or decline each order within 15 minutes, on the Orders screen.'),
        no: L('Ainda não. Lembre do prazo para aceitar ou recusar um pedido.', 'Todavía no. Recuerda el plazo para aceptar o rechazar un pedido.', 'Not yet. Remember the time limit to accept or decline an order.'),
      },
      {
        id: 'f5',
        tema: TEMA.mensalidade,
        state: S('financeiro', ['fatura']),
        target: 'fl-cobrancas',
        q: L('Em qual situação a loja paga a mensalidade?', '¿En qué situación la tienda paga la mensualidad?', 'When does the store pay the monthly fee?'),
        options: [
          { t: L('Todo mês, em qualquer caso', 'Todos los meses, en cualquier caso', 'Every month, no matter what') },
          { t: L(`Ao atingir ${limite} de Total Bruto no mês`, `Al alcanzar ${limite} de Total Bruto en el mes`, `When it reaches ${limite} in Gross Total in the month`), ok: true },
          { t: L('Só no mês com vendas em dinheiro', 'Solo en el mes con ventas en efectivo', 'Only in months with cash sales') },
        ],
        ok: L(`A mensalidade é de ${valorMens}, separada da comissão.`, `La mensualidad es de ${valorMens}, aparte de la comisión.`, `The monthly fee is ${valorMens}, separate from the commission.`),
        no: L('Ainda não. A mensalidade depende do Total Bruto do mês.', 'Todavía no. La mensualidad depende del Total Bruto del mes.', "Not yet. The monthly fee depends on the month's Gross Total."),
      },
      {
        id: 'f6',
        tema: TEMA.online,
        target: 'fl-total',
        q: L(`A loja vendeu ${F(d.totalBruto)}, mas o repasse foi de ${F(f.total)}. Por quê?`, `La tienda vendió ${F(d.totalBruto)}, pero la transferencia fue de ${F(f.total)}. ¿Por qué?`, `The store sold ${F(d.totalBruto)}, but the payout was ${F(f.total)}. Why?`),
        options: [
          { t: L('A plataforma ficou com a maior parte', 'La plataforma se quedó con la mayor parte', 'The platform kept most of it') },
          { t: L('O dinheiro e a maquininha já estavam com a loja', 'El efectivo y el POS ya estaban con la tienda', 'The cash and card machine money was already with the store'), ok: true },
          { t: L('Houve um erro no cálculo do repasse', 'Hubo un error en el cálculo de la transferencia', 'There was a mistake in the payout calculation') },
        ],
        ok: L(`${F(caixa)} já estavam no seu caixa, e as deduções saem do valor online.`, `${F(caixa)} ya estaban en tu caja, y las deducciones salen del valor online.`, `${F(caixa)} was already in your till, and the deductions come out of the online amount.`),
        no: L('Pense: por onde passou o dinheiro das vendas em dinheiro e maquininha?', 'Piensa: ¿por dónde pasó el dinero de las ventas en efectivo y POS?', 'Think: where did the money from cash and card machine sales go?'),
      },
      {
        id: 'f7',
        tema: TEMA.mensalidade,
        target: 'fl-cobrancas',
        q: L('Se o saldo online não cobrir as deduções, o que acontece?', 'Si el saldo online no cubre las deducciones, ¿qué pasa?', 'If the online balance does not cover the deductions, what happens?'),
        options: [
          { t: L('É preciso pagar um boleto no mesmo dia', 'Hay que pagar un boleto el mismo día', 'You have to pay a bank slip on the same day') },
          { t: L('Vai para a próxima fatura ou é paga no boleto', 'Pasa a la próxima factura o se paga con boleto', 'It goes to the next invoice or is paid by bank slip'), ok: true },
          { t: L('A diferença é perdoada pela plataforma', 'La plataforma perdona la diferencia', 'The platform forgives the difference') },
        ],
        ok: L(
          'Ela aparece na próxima fatura como Débitos remanescentes. Se aparecer um boleto, basta pagá-lo.',
          'Aparece en la próxima factura como Débitos pendientes. Si aparece un boleto, solo tienes que pagarlo.',
          'It shows up on the next invoice as Remaining debits. If a bank slip appears, just pay it.',
        ),
        no: L('Ainda não. Lembre da primeira linha das deduções na fatura.', 'Todavía no. Recuerda la primera línea de las deducciones en la factura.', 'Not yet. Remember the first deductions line on the invoice.'),
      },
      {
        id: 'f8',
        tema: TEMA.repasse,
        state: S('financeiro'),
        target: 'fin-boxes',
        q: L('Depois de antecipar, quando o dinheiro cai, em qual campo o valor aparece?', 'Después de anticipar, cuando cae el dinero, ¿en qué campo aparece el valor?', 'After an early payout, when the money arrives, which field shows the amount?'),
        options: [
          { t: L('Repasse disponível', 'Transferencia disponible', 'Available payout') },
          { t: L('Repasses recebidos', 'Transferencias recibidas', 'Payouts received'), ok: true },
          { t: L('Recebido pela Loja', 'Recibido por la Tienda', 'Received by the store') },
        ],
        ok: L('Ele sai de Repasse disponível e vai para Repasses recebidos.', 'Sale de Transferencia disponible y pasa a Transferencias recibidas.', 'It leaves Available payout and goes to Payouts received.'),
        no: L('Ainda não. Lembre do que aconteceu depois do CONFIRMAR.', 'Todavía no. Recuerda lo que pasó después de CONFIRMAR.', 'Not yet. Remember what happened after CONFIRMAR.'),
      },
      {
        id: 'f9',
        tema: TEMA.financeiro,
        target: 'fin-resultado',
        q: L('Qual foi o Resultado da loja no mês?', '¿Cuál fue el Resultado de la tienda en el mes?', "What was the store's Result this month?"),
        options: [{ t: F(d.totalBruto) }, { t: F(r.resultado), ok: true }, { t: F(f.total) }],
        ok: L('Recebido pela Loja + repasses = Resultado.', 'Recibido por la Tienda + transferencias = Resultado.', 'Received by the store + payouts = Result.'),
        no: L('Ainda não. O Resultado está em destaque na tela.', 'Todavía no. El Resultado está resaltado en la pantalla.', 'Not yet. The Result is highlighted on the screen.'),
      },
      {
        id: 'f10',
        tema: TEMA.repasse,
        state: S('financeiro', ['fatura'], pago),
        target: 'fa-repasse-realizado',
        q: L('Onde você encontra o comprovante do repasse?', '¿Dónde encuentras el comprobante de la transferencia?', 'Where do you find the payout receipt?'),
        options: [
          { t: L('Na tela Relatório, no pedido', 'En la pantalla Informe, en el pedido', 'On the Report screen, in the order') },
          { t: L('Na fatura, em Ver comprovante', 'En la factura, en Ver comprobante', 'On the invoice, under View receipt'), ok: true },
          { t: L('Em Boletos, no Financeiro', 'En Boletos, en Finanzas', 'Under Bank slips, in Finance') },
        ],
        ok: L('Fica no mesmo lugar onde você pede a antecipação.', 'Está en el mismo lugar donde pides el anticipo.', 'It is in the same place where you request early payout.'),
        no: L('Ainda não. Lembre de onde apareceu Repasse realizado.', 'Todavía no. Recuerda dónde apareció Transferencia realizada.', 'Not yet. Remember where Payout completed showed up.'),
      },
    ];
    const m10 = {
      n: 10,
      titulo: L('Exercício final', 'Ejercicio final', 'Final exercise'),
      icone: 'trofeu',
      desc: L('Teste o que você aprendeu.', 'Pon a prueba lo que aprendiste.', 'Test what you learned.'),
      intro: L('Hora de praticar. Responda olhando para a tela.', 'Hora de practicar. Responde mirando la pantalla.', 'Time to practice. Answer by looking at the screen.'),
      aprender: L(
        [`${perguntas.length} perguntas rápidas`, 'Sem pressa: você pode tentar de novo'],
        [`${perguntas.length} preguntas rápidas`, 'Sin prisa: puedes intentarlo de nuevo'],
        [`${perguntas.length} quick questions`, 'No rush: you can try again'],
      ),
      steps: perguntas.map((p, i) => Object.assign({ mode: 'quiz', title: L(`Pergunta ${i + 1}`, `Pregunta ${i + 1}`, `Question ${i + 1}`) }, p)),
      resumo: L(
        [
          'Você sabe onde ver o total vendido.',
          'Você sabe separar online, dinheiro e maquininha.',
          'Você sabe ler a fatura, pedir a antecipação e pegar o comprovante.',
        ],
        [
          'Sabes dónde ver el total vendido.',
          'Sabes separar online, efectivo y POS.',
          'Sabes leer la factura, pedir el anticipo y obtener el comprobante.',
        ],
        [
          'You know where to see the total sold.',
          'You know how to tell online, cash and card machine apart.',
          'You know how to read the invoice, request early payout and get the receipt.',
        ],
      ),
    };

    /* Desafio rápido: uma pergunta de revisão no fim dos módulos 1 a 9 */
    const DESAFIO = L('Desafio rápido', 'Desafío rápido', 'Quick challenge');
    const desafio = (id, tema, state, target, q, options, ok, no) => ({ id, tema, state, target, mode: 'quiz', desafio: true, title: DESAFIO, q, options, ok, no: no || L('Quase! Pense no que você acabou de ver.', '¡Casi! Piensa en lo que acabas de ver.', 'Almost! Think about what you just saw.') });
    const DESAFIOS = {
      1: desafio('d1', TEMA.bruto, S('relatorio'), 'rp-bruto', L('O que representa o Total Bruto da loja?', '¿Qué representa el Total Bruto de la tienda?', "What does the store's Gross Total represent?"),
        [
          { t: L('Só as vendas pagas online', 'Solo las ventas pagadas online', 'Only sales paid online') },
          { t: L('A soma de todas as vendas do mês', 'La suma de todas las ventas del mes', 'The sum of all sales in the month'), ok: true },
          { t: L('O valor transferido para a sua conta', 'El valor transferido a tu cuenta', 'The amount transferred to your account') },
        ],
        L('O Total Bruto junta todas as formas de pagamento.', 'El Total Bruto reúne todas las formas de pago.', 'Gross Total includes all payment methods.')),
      2: desafio('d2', TEMA.online, S('relatorio', ['totalBruto']), 'tb-online', L('Quando o cliente paga online, o que a plataforma desconta desse valor?', 'Cuando el cliente paga online, ¿qué descuenta la plataforma de ese valor?', 'When the customer pays online, what does the platform deduct from that amount?'),
        [
          { t: L('Só a comissão das vendas online', 'Solo la comisión de las ventas online', 'Only the commission on online sales') },
          { t: L('Nada: o valor vai inteiro para a loja', 'Nada: el valor va entero a la tienda', 'Nothing: the full amount goes to the store') },
          { t: L('A comissão e as taxas de todas as vendas', 'La comisión y las tasas de todas las ventas', 'The commission and fees for all sales'), ok: true },
        ],
        L('Por isso o repasse é menor que o valor online.', 'Por eso la transferencia es menor que el valor online.', 'That is why the payout is smaller than the online amount.')),
      3: desafio('d3', TEMA.bruto, S('relatorio', ['totalBruto']), 'tb-list', L('Quando o cliente paga o pedido em dinheiro, onde fica esse valor?', 'Cuando el cliente paga el pedido en efectivo, ¿dónde queda ese valor?', 'When the customer pays for the order in cash, where does that money stay?'),
        [
          { t: L('Fica direto com a loja', 'Queda directo con la tienda', 'It stays directly with the store'), ok: true },
          { t: L('Passa antes pela plataforma', 'Pasa antes por la plataforma', 'It goes through the platform first') },
          { t: L('Não entra no faturamento', 'No entra en la facturación', 'It does not count as revenue') },
        ],
        L('E o valor da maquininha cai direto na conta dela.', 'Y el valor del POS cae directo en su cuenta.', 'And card machine money goes straight to the card machine account.')),
      4: desafio('d4', TEMA.financeiro, S('financeiro'), 'fin-boxes', L('Antes de antecipar, em qual campo do Financeiro você vê o valor que ainda vai ser transferido?', 'Antes de anticipar, ¿en qué campo de Finanzas ves el valor que todavía se va a transferir?', 'Before an early payout, which Finance field shows the amount that will still be transferred?'),
        [
          { t: L('Repasses recebidos', 'Transferencias recibidas', 'Payouts received') },
          { t: L('Repasse disponível', 'Transferencia disponible', 'Available payout'), ok: true },
          { t: L('Recebido pela Loja', 'Recibido por la Tienda', 'Received by the store') },
        ],
        L('Ele vira "Repasses recebidos" quando é transferido.', 'Pasa a "Transferencias recibidas" cuando se transfiere.', 'It becomes "Payouts received" when it is transferred.')),
      5: desafio('d5', TEMA.cupons, S('financeiro', ['fatura']), 'fl-incentivos', L('Quando o Bigou oferece um cupom ao cliente, quem paga o desconto?', 'Cuando Bigou le ofrece un cupón al cliente, ¿quién paga el descuento?', 'When Bigou gives a customer a coupon, who pays for the discount?'),
        [
          { t: L('A loja, em todos os casos', 'La tienda, en todos los casos', 'The store, in every case') },
          { t: L('O cliente, depois da entrega', 'El cliente, después de la entrega', 'The customer, after delivery') },
          { t: L('A plataforma, que devolve na fatura', 'La plataforma, que lo devuelve en la factura', 'The platform, which pays it back on the invoice'), ok: true },
        ],
        L('Ele volta como "Reembolso dos incentivos".', 'Vuelve como "Reembolso de incentivos".', 'It comes back as "Refund of incentives".')),
      6: desafio('d6', TEMA.cancelados, S('pedidos'), 'pd-aguardando', L('O que acontece com um pedido que fica 15 minutos sem ser aceito nem recusado?', '¿Qué pasa con un pedido que pasa 15 minutos sin ser aceptado ni rechazado?', 'What happens to an order that goes 15 minutes without being accepted or declined?'),
        [
          { t: L('Continua esperando a loja', 'Sigue esperando a la tienda', 'It keeps waiting for the store') },
          { t: L('É cancelado e entra na comissão', 'Se cancela y entra en la comisión', 'It is canceled and counts toward the commission'), ok: true },
          { t: L('É aceito automaticamente', 'Se acepta automáticamente', 'It is accepted automatically') },
        ],
        L('Por isso, aceite ou recuse cada pedido a tempo.', 'Por eso, acepta o rechaza cada pedido a tiempo.', 'That is why you should accept or decline each order on time.')),
      7: desafio('d7', TEMA.taxas, S('financeiro', ['fatura']), 'fl-antecipacao', L('Em qual situação a taxa de antecipação é cobrada de fato?', '¿En qué situación se cobra de verdad la Tasa de Anticipo?', 'When is the early payout fee actually charged?'),
        [
          { t: L('Quando a loja pede a antecipação', 'Cuando la tienda pide el anticipo', 'When the store requests early payout'), ok: true },
          { t: L('Em toda fatura, mesmo sem antecipar', 'En toda factura, aunque no anticipe', 'On every invoice, even without early payout') },
          { t: L('Só nas vendas pagas em dinheiro', 'Solo en las ventas pagadas en efectivo', 'Only on sales paid in cash') },
        ],
        L('Ela aparece em toda fatura, mas só é cobrada se você antecipar.', 'Aparece en toda factura, pero solo se cobra si anticipas.', 'It shows on every invoice, but it is only charged if you request early payout.'),
        L('Quase! Lembre: ela aparece na fatura, mas só é aplicada em um caso.', '¡Casi! Recuerda: aparece en la factura, pero solo se aplica en un caso.', 'Almost! Remember: it shows on the invoice, but it only applies in one case.')),
      8: desafio('d8', TEMA.servico, S('financeiro', ['fatura', 'taxaServico']), 'ts-offline', L('Por que a taxa de serviço das vendas em dinheiro aparece como dedução?', '¿Por qué la tasa de servicio de las ventas en efectivo aparece como deducción?', 'Why does the service fee from cash sales show up as a deduction?'),
        [
          { t: L('Porque é uma multa para a loja', 'Porque es una multa para la tienda', 'Because it is a penalty for the store') },
          { t: L('Porque a loja recebeu a taxa, que é da plataforma', 'Porque la tienda recibió la tasa, que es de la plataforma', 'Because the store received the fee, which belongs to the platform'), ok: true },
          { t: L('Porque a comissão foi cobrada duas vezes', 'Porque la comisión se cobró dos veces', 'Because the commission was charged twice') },
        ],
        L('Você só repassa o que o cliente pagou para a plataforma.', 'Solo le pasas a la plataforma lo que pagó el cliente.', 'You only pass on to the platform what the customer paid.')),
      9: desafio('d9', TEMA.repasse, S('financeiro', [], pago), 'fin-disponivel', L('Se a loja não pedir antecipação, quando recebe o repasse?', 'Si la tienda no pide anticipo, ¿cuándo recibe la transferencia?', 'If the store does not request early payout, when does it get the payout?'),
        [
          { t: L('Todos os dias, automaticamente', 'Todos los días, automáticamente', 'Every day, automatically') },
          { t: L('Só quando a loja pedir', 'Solo cuando la tienda lo pida', 'Only when the store asks') },
          { t: L('No 2º dia útil do mês seguinte', 'El 2º día hábil del mes siguiente', 'On the 2nd business day of the next month'), ok: true },
        ],
        L('Antecipar é opcional: sem pedir, o repasse chega no mês seguinte.', 'Anticipar es opcional: si no lo pides, la transferencia llega el mes siguiente.', 'Early payout is optional: if you do not request it, the payout arrives the next month.')),
    };

    const mods = [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10];
    mods.forEach((m) => { if (DESAFIOS[m.n]) m.steps.push(DESAFIOS[m.n]); });
    mods.forEach((m) => m.steps.forEach((s) => { s.kicker = s.desafio ? DESAFIO : m.titulo; if (s.mode === 'quiz') s.versao = QV; }));
    return mods;
  };

  /* Perguntas editadas no painel (tabela treino_perguntas): trocam o enunciado, as alternativas,
     a correta e as mensagens. As alternativas mantêm a posição, e é por ela que as respostas são
     contadas. O texto do código fica em s.original (para "Restaurar" e para ligar respostas antigas).
     html = true: o texto vem do banco e vai para o balão, então é escapado.
     Em espanhol, os textos editados (escritos em português) não são aplicados; só a alternativa correta. */
  TREINO.aplicarPerguntas = function (mods, lista, html) {
    const esc = (t) => (html ? String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])) : String(t));
    const txt = (v) => TREINO.pt && typeof v === 'string' && v.trim() ? v.trim() : null;
    const porId = new Map((Array.isArray(lista) ? lista : []).filter((p) => p && p.id).map((p) => [p.id, p]));
    mods.forEach((m) => m.steps.forEach((s) => {
      if (s.mode !== 'quiz') return;
      if (!s.original) s.original = { q: s.q, options: s.options.map((o) => ({ t: o.t, ok: !!o.ok })), ok: s.ok, no: s.no };
      const o = s.original, p = porId.get(s.id);
      const ops = p && Array.isArray(p.opcoes) && p.opcoes.length === o.options.length ? p.opcoes : null;
      const correta = ops && Number.isInteger(p.correta) && p.correta >= 0 && p.correta < ops.length ? p.correta : null;
      s.q = p && txt(p.q) ? esc(txt(p.q)) : o.q;
      s.options = o.options.map((x, i) => ({ t: ops && txt(ops[i]) ? esc(txt(ops[i])) : x.t, ok: correta != null ? i === correta : x.ok }));
      s.ok = p && txt(p.ok) ? esc(txt(p.ok)) : o.ok;
      s.no = p && txt(p.no) ? esc(txt(p.no)) : o.no;
      s.editada = p ? { em: p.atualizado_em, autor: p.autor || null } : null;
    }));
    return mods;
  };

  /* Revisão final: um lembrete curto por assunto, com os números da loja */
  TREINO.buildReview = function (d) {
    const f = d.f, r = d.r, p = d.pay, T = TREINO.config.taxas, MS = TREINO.config.mensalidade;
    const pc = (x) => String(Math.round(x * 10000) / 100).replace('.', ',') + '%';
    return L(
      [
        ['Venda total', `${F(d.totalBruto)}: a soma de todas as vendas (Total Bruto).`],
        ['Pagamento online', `${F(p.online.bruto)} pagos pelo aplicativo. As deduções saem daqui.`],
        ['Dinheiro', `${F(p.dinheiro.liquido)}, direto no seu caixa.`],
        ['Maquininha', `${F(p.maquininha.liquido)}, direto na conta da sua maquininha.`],
        ['Comissão', `${F(f.comissao)}: ${pc(T.comissao)} do valor dos produtos de todas as vendas.`],
        ['Pedidos cancelados por tempo', 'Pedido não aceito nem recusado em 15 minutos é cancelado e entra na comissão.'],
        ['Taxa de serviço', 'Paga pelo cliente e da plataforma: você só repassa o que o cliente pagou.'],
        ['Mensalidade', f.mensalidade ? `${F(f.mensalidade)}, porque a loja atingiu o faturamento mínimo (${F(MS.acimaDeBruto * 100)} em Total Bruto).` : `Não houve: a loja não atingiu o faturamento mínimo (${F(MS.acimaDeBruto * 100)} em Total Bruto).`],
        ['Débitos remanescentes', 'Deduções sem saldo online vão para a próxima fatura. Se aparecer um boleto, basta pagá-lo.'],
        ['Antecipação', `${F(f.total)} de repasse, que vai para Repasses recebidos quando cai.`],
        ['Comprovante', 'Fica na fatura, em Repasse realizado → Ver comprovante.'],
        ['Resultado final', `${F(r.resultado)} = Recebido pela Loja + repasses.`],
      ],
      [
        ['Venta total', `${F(d.totalBruto)}: la suma de todas las ventas (Total Bruto).`],
        ['Pago online', `${F(p.online.bruto)} pagados por la aplicación. Las deducciones salen de aquí.`],
        ['Efectivo', `${F(p.dinheiro.liquido)}, directo en tu caja.`],
        ['POS', `${F(p.maquininha.liquido)}, directo en la cuenta de tu POS.`],
        ['Comisión', `${F(f.comissao)}: ${pc(T.comissao)} del valor de los productos de todas las ventas.`],
        ['Pedidos cancelados por tiempo', 'Un pedido que no se acepta ni se rechaza en 15 minutos se cancela y entra en la comisión.'],
        ['Tasa de servicio', 'La paga el cliente y es de la plataforma: solo le pasas lo que pagó el cliente.'],
        ['Mensualidad', f.mensalidade ? `${F(f.mensalidade)}, porque la tienda alcanzó la facturación mínima (${F(MS.acimaDeBruto * 100)} en Total Bruto).` : `No hubo: la tienda no alcanzó la facturación mínima (${F(MS.acimaDeBruto * 100)} en Total Bruto).`],
        ['Débitos pendientes', 'Las deducciones sin saldo online pasan a la próxima factura. Si aparece un boleto, solo tienes que pagarlo.'],
        ['Anticipo', `${F(f.total)} de transferencia, que pasa a Transferencias recibidas cuando cae.`],
        ['Comprobante', 'Está en la factura, en Transferencia realizada → Ver comprobante.'],
        ['Resultado final', `${F(r.resultado)} = Recibido por la Tienda + transferencias.`],
      ],
      [
        ['Total sales', `${F(d.totalBruto)}: the sum of all sales (Gross Total).`],
        ['Online payment', `${F(p.online.bruto)} paid through the app. The deductions come out of this.`],
        ['Cash', `${F(p.dinheiro.liquido)}, straight into your till.`],
        ['Card machine', `${F(p.maquininha.liquido)}, straight into your card machine account.`],
        ['Commission', `${F(f.comissao)}: ${pc(T.comissao)} of the product value of all sales.`],
        ['Orders canceled by timeout', 'An order not accepted or declined within 15 minutes is canceled and counts toward the commission.'],
        ['Service fee', 'Paid by the customer and belongs to the platform: you only pass on what the customer paid.'],
        ['Monthly fee', f.mensalidade ? `${F(f.mensalidade)}, because the store reached the minimum revenue (${F(MS.acimaDeBruto * 100)} in Gross Total).` : `None: the store did not reach the minimum revenue (${F(MS.acimaDeBruto * 100)} in Gross Total).`],
        ['Remaining debits', 'Deductions without online balance go to the next invoice. If a bank slip appears, just pay it.'],
        ['Early payout', `${F(f.total)} of payout, which moves to Payouts received when it arrives.`],
        ['Receipt', 'It is on the invoice, under Payout completed → View receipt.'],
        ['Final result', `${F(r.resultado)} = Received by the store + payouts.`],
      ],
    );
  };
})();
