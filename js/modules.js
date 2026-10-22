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
    );
    const caixa = r.recebidoLoja;      // dinheiro + maquininha
    const plataforma = r.plataforma;   // o que passou pela plataforma
    const vendasPagas = (n) => pl(n, L('venda foi paga', 'venta fue pagada'), L('vendas foram pagas', 'ventas fueron pagadas'));
    const cliqueInfo = L('Clique no ⓘ destacado', 'Haz clic en el ⓘ resaltado');

    /* 1 ------------------------------------------------------------------ */
    const m1 = {
      n: 1,
      titulo: L('Suas vendas', 'Tus ventas'),
      icone: 'relatorio',
      desc: L('Onde ficam suas vendas e o que é o Total Bruto.', 'Dónde están tus ventas y qué es el Total Bruto.'),
      intro: L('Vamos começar pelo lugar onde ficam todas as vendas da sua loja: a tela Relatório.', 'Empecemos por el lugar donde están todas las ventas de tu tienda: la pantalla Informe.'),
      aviso: L(
        'Lembre: este treinamento é ilustrativo. Todos os dados são fictícios, inclusive os valores de comissão e taxas. Confira no seu contrato os valores praticados na sua loja.',
        'Recuerda: esta capacitación es ilustrativa. Todos los datos son ficticios, incluso los valores de comisión y tasas. Consulta en tu contrato los valores que se aplican a tu tienda.',
      ),
      aprender: L(
        ['Onde ver suas vendas', 'O que é o Total Bruto', 'As 3 formas de pagamento'],
        ['Dónde ver tus ventas', 'Qué es el Total Bruto', 'Las 3 formas de pago'],
      ),
      steps: [
        {
          state: S('relatorio'),
          target: 'rp-table',
          title: L('Aqui estão todas as suas vendas', 'Aquí están todas tus ventas'),
          body: L(
            `Esta é a tela <b>Relatório</b>. Cada linha é um pedido da sua loja.<br>Neste mês, foram <b>${pl(d.n, 'venda', 'vendas')}</b>.`,
            `Esta es la pantalla <b>Informe</b>. Cada fila es un pedido de tu tienda.<br>Este mes hubo <b>${pl(d.n, 'venta', 'ventas')}</b>.`,
          ),
        },
        {
          target: 'rp-bruto',
          title: 'Total Bruto',
          body: L(`É a soma de tudo o que você vendeu no mês: ${b(d.totalBruto)}.`, `Es la suma de todo lo que vendiste en el mes: ${b(d.totalBruto)}.`),
          countUp: true,
        },
        {
          target: 'rp-bruto-info',
          mode: 'click',
          pad: 6,
          title: L('Veja como ele é formado', 'Mira cómo se compone'),
          body: L('Clique no <b>ⓘ</b> ao lado de <b>Total Bruto</b>.', 'Haz clic en el <b>ⓘ</b> al lado de <b>Total Bruto</b>.'),
          hint: cliqueInfo,
        },
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-list',
          title: L('Suas vendas chegam de 3 formas', 'Tus ventas llegan de 3 formas'),
          body: L(
            '<b>Pagamento online</b>, <b>dinheiro</b> e <b>maquininha</b>.<br>Vamos entender cada uma nos próximos módulos.',
            '<b>Pago online</b>, <b>efectivo</b> y <b>POS</b>.<br>Vamos a entender cada una en los próximos módulos.',
          ),
        },
        {
          target: 'tb-total',
          title: L('Todas são vendas', 'Todas son ventas'),
          body: L('Mas o valor chegou por caminhos diferentes.', 'Pero el dinero llegó por caminos diferentes.'),
          calc: [
            { l: L('Pagamento online', 'Pago online'), v: on.bruto },
            { op: '+', l: L('Dinheiro', 'Efectivo'), v: di.bruto },
            { op: '+', l: L('Maquininha', 'POS'), v: mq.bruto },
            { op: '=', l: 'Total Bruto', v: d.totalBruto, total: true },
          ],
          foot: L(
            `Cada pedido tem uma taxa de serviço, paga pelo cliente: ${taxaTxt}. Ela aparece de novo na fatura.`,
            `Cada pedido tiene una tasa de servicio, pagada por el cliente: ${taxaTxt}. Vuelve a aparecer en la factura.`,
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
      ),
    };

    /* 2 ------------------------------------------------------------------ */
    const m2 = {
      n: 2,
      titulo: L('Pagamento online', 'Pago online'),
      icone: 'celular',
      desc: L('Vendas pagas pelo aplicativo.', 'Ventas pagadas por la aplicación.'),
      intro: L('Veja o que acontece com o dinheiro quando o cliente paga pelo aplicativo.', 'Mira qué pasa con el dinero cuando el cliente paga por la aplicación.'),
      aprender: L(
        ['O que é pagamento online', 'Por que esse valor é tão importante', 'O que é repasse'],
        ['Qué es el pago online', 'Por qué ese valor es tan importante', 'Qué es la transferencia'],
      ),
      steps: [
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-online',
          title: L('Vendas com pagamento online', 'Ventas con pago online'),
          body: L(
            `${vendasPagas(on.n)} pelo aplicativo, na hora do pedido: ${b(on.bruto)}.<br>Esse valor <b>passa primeiro pela plataforma</b>.`,
            `${vendasPagas(on.n)} por la aplicación, al momento del pedido: ${b(on.bruto)}.<br>Ese valor <b>pasa primero por la plataforma</b>.`,
          ),
          foot: L(
            'Dica: nesses pedidos, o cliente já pagou. Você só precisa aceitar e entregar, sem cobrar o cliente.',
            'Consejo: en esos pedidos, el cliente ya pagó. Solo tienes que aceptar y entregar, sin cobrarle al cliente.',
          ),
          countUp: true,
        },
        {
          target: 'tb-online',
          title: L('É daqui que saem as deduções', 'De aquí salen las deducciones'),
          body: L(
            'Dele, a plataforma deduz a comissão e as taxas de <b>todas</b> as suas vendas, inclusive das vendas em dinheiro e maquininha.',
            'De él, la plataforma descuenta la comisión y las tasas de <b>todas</b> tus ventas, incluso de las ventas en efectivo y POS.',
          ),
        },
        {
          target: 'tb-online',
          title: L('O repasse', 'La transferencia'),
          body: L(
            'O valor que fica depois das deduções é enviado para você.<br>Esse envio se chama <b>repasse</b>.',
            'El valor que queda después de las deducciones se te envía a ti.<br>Ese envío se llama <b>transferencia</b>.',
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
      ),
    };

    /* 3 ------------------------------------------------------------------ */
    const m3 = {
      n: 3,
      titulo: L('Dinheiro e maquininha', 'Efectivo y POS'),
      icone: 'dinheiro',
      desc: L('Vendas que entram direto no seu caixa.', 'Ventas que entran directo en tu caja.'),
      intro: L('Agora, as vendas em que o cliente paga direto para você.', 'Ahora, las ventas en las que el cliente te paga directo a ti.'),
      aprender: L(
        ['Vendas em dinheiro', 'Vendas na maquininha', 'Onde está o dinheiro das suas vendas'],
        ['Ventas en efectivo', 'Ventas con POS', 'Dónde está el dinero de tus ventas'],
      ),
      steps: [
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-dinheiro',
          title: L('Dinheiro', 'Efectivo'),
          body: L(
            `${vendasPagas(di.n)} em dinheiro: ${b(di.bruto)}.<br>O cliente pagou direto para você. Esse dinheiro <b>já entrou no seu caixa</b>.`,
            `${vendasPagas(di.n)} en efectivo: ${b(di.bruto)}.<br>El cliente te pagó directo a ti. Ese dinero <b>ya entró en tu caja</b>.`,
          ),
          countUp: true,
        },
        {
          target: 'tb-maquininha',
          title: L('Maquininha', 'POS'),
          body: L(
            `${vendasPagas(mq.n)} no cartão, na sua maquininha: ${b(mq.bruto)}.<br>O valor cai na conta da sua maquininha, <b>não passa pela plataforma</b>.`,
            `${vendasPagas(mq.n)} con tarjeta, en tu POS: ${b(mq.bruto)}.<br>El valor cae en la cuenta de tu POS, <b>no pasa por la plataforma</b>.`,
          ),
          countUp: true,
        },
        {
          target: 'tb-total',
          title: L('Onde está o dinheiro das suas vendas', 'Dónde está el dinero de tus ventas'),
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
          ),
          body: L(
            `Das suas vendas, ${b(caixa)} já estão com você.<br>Só ${b(plataforma)} passaram pela plataforma.`,
            `De tus ventas, ${b(caixa)} ya están contigo.<br>Solo ${b(plataforma)} pasaron por la plataforma.`,
          ),
          calc: [
            { l: L('Dinheiro + maquininha (no seu caixa)', 'Efectivo + POS (en tu caja)'), v: caixa },
            { op: '+', l: L('Pagamento online (pela plataforma)', 'Pago online (por la plataforma)'), v: plataforma },
            { op: '=', l: 'Total Bruto', v: d.totalBruto, total: true },
          ],
          foot: L('Guarde essa ideia: ela explica por que o repasse pode parecer pequeno.', 'Guarda esta idea: explica por qué la transferencia puede parecer pequeña.'),
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
      ),
    };

    /* 4 ------------------------------------------------------------------ */
    const m4 = {
      n: 4,
      titulo: L('Tela Financeiro', 'Pantalla Finanzas'),
      icone: 'painel',
      desc: L('Resultado, recebidos e repasse disponível.', 'Resultado, recibidos y transferencia disponible.'),
      intro: L('Agora vamos para a tela Financeiro. Ela mostra quanto ficou com você no mês.', 'Ahora vamos a la pantalla Finanzas. Muestra cuánto te quedó en el mes.'),
      aprender: L(
        ['O que é o Resultado', 'Os 3 quadros ao lado dele', 'Onde ficam as faturas'],
        ['Qué es el Resultado', 'Los 3 cuadros a su lado', 'Dónde están las facturas'],
      ),
      steps: [
        {
          state: S('relatorio', [], { sidebar: true }),
          target: 'nav-financeiro',
          mode: 'click',
          pad: 4,
          title: L('Vamos ao Financeiro', 'Vamos a Finanzas'),
          body: L('Clique em <b>Financeiro</b> no menu.', 'Haz clic en <b>Finanzas</b> en el menú.'),
          hint: L('Clique em Financeiro', 'Haz clic en Finanzas'),
        },
        {
          state: S('financeiro'),
          target: 'fin-resultado',
          title: 'Resultado',
          body: L(
            `É tudo o que ficou com você no mês depois das deduções: ${b(r.resultado)}.<br>Ele é a soma dos 3 quadros ao lado.`,
            `Es todo lo que te quedó en el mes después de las deducciones: ${b(r.resultado)}.<br>Es la suma de los 3 cuadros de al lado.`,
          ),
          countUp: true,
        },
        {
          target: 'fin-recebido',
          title: L('Recebido pela Loja', 'Recibido por la Tienda'),
          body: L('É o valor das vendas em dinheiro e maquininha. Ele já entrou no seu caixa.', 'Es el valor de las ventas en efectivo y POS. Ya entró en tu caja.'),
          calc: [
            { l: L('Dinheiro', 'Efectivo'), v: di.liquido },
            { op: '+', l: L('Maquininha', 'POS'), v: mq.liquido },
            { op: '=', l: L('Recebido pela Loja', 'Recibido por la Tienda'), v: r.recebidoLoja, total: true },
          ],
          countUp: true,
        },
        {
          target: 'fin-repasses',
          title: L('Repasses recebidos', 'Transferencias recibidas'),
          body: L(
            `É o que a plataforma já transferiu para você neste mês, caso você tenha antecipado.<br>Por enquanto: ${b(0)}.`,
            `Es lo que la plataforma ya te transfirió este mes, si anticipaste.<br>Por ahora: ${b(0)}.`,
          ),
        },
        {
          target: 'fin-disponivel',
          title: L('Repasse disponível', 'Transferencia disponible'),
          body: L(
            `É o valor disponível para repasse: ${b(r.repasseDisponivel)}. Se você não antecipar, a plataforma transfere no 2º dia útil do mês seguinte às suas vendas (${TREINO.periodo.repasseMensal}).<br>Esse é o valor das vendas online, após a dedução da comissão e das taxas.`,
            `Es el valor disponible para transferencia: ${b(r.repasseDisponivel)}. Si no anticipas, la plataforma lo transfiere el 2º día hábil del mes siguiente a tus ventas (${TREINO.periodo.repasseMensal}).<br>Es el valor de las ventas online, después de descontar la comisión y las tasas.`,
          ),
          countUp: true,
        },
        {
          target: 'fin-disponivel',
          title: L('Esse valor muda todos os dias', 'Este valor cambia todos los días'),
          body: L(
            'O Repasse disponível é <b>volátil</b>.<br>Se em um dia você tiver apenas vendas pagas em dinheiro ou maquininha, as deduções dessas vendas saem do saldo online, e ele diminui.',
            'La Transferencia disponible es <b>variable</b>.<br>Si en un día solo tienes ventas pagadas en efectivo o POS, las deducciones de esas ventas salen del saldo online, y este disminuye.',
          ),
        },
        {
          target: 'fin-res',
          title: L('A soma', 'La suma'),
          calc: [
            { l: L('Recebido pela Loja', 'Recibido por la Tienda'), v: r.recebidoLoja },
            { op: '+', l: L('Repasses recebidos', 'Transferencias recibidas'), v: r.repassesRecebidos },
            { op: '+', l: L('Repasse disponível', 'Transferencia disponible'), v: r.repasseDisponivel },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
        },
        {
          target: 'fin-botoes',
          title: L('Boletos e Repasses', 'Boletos y Transferencias'),
          body: L(
            'Em <b>Repasses</b>, ficam as transferências feitas para você.<br>Em <b>Boletos</b>, pode aparecer um boleto quando o saldo online não cobre a comissão e as taxas. Nesse caso, basta acessá-lo e pagar.',
            'En <b>Transferencias</b> están las transferencias que te hicieron.<br>En <b>Boletos</b> puede aparecer un boleto cuando el saldo online no cubre la comisión y las tasas. En ese caso, solo tienes que abrirlo y pagarlo.',
          ),
        },
        {
          target: 'fin-faturas',
          title: L('Faturas do Período', 'Facturas del Período'),
          body: L(
            'A fatura mostra a conta completa do repasse.<br>Nos próximos módulos, vamos abrir e ler linha por linha.',
            'La factura muestra la cuenta completa de la transferencia.<br>En los próximos módulos, la vamos a abrir y leer línea por línea.',
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
      ),
    };

    /* 5 ------------------------------------------------------------------ */
    const m5 = {
      n: 5,
      titulo: L('Fatura: o que entrou de pagamento online', 'Factura: lo que entró por pago online'),
      icone: 'faturaEntra',
      desc: L('As vendas online e os valores devolvidos.', 'Las ventas online y los valores devueltos.'),
      intro: L(
        'A fatura mostra todo o cálculo para repasse, linha por linha. Primeiro, o que entrou de pagamento online.',
        'La factura muestra todo el cálculo de la transferencia, línea por línea. Primero, lo que entró por pago online.',
      ),
      aprender: L(
        ['Como ler a fatura', 'As vendas online', 'Os valores devolvidos para você'],
        ['Cómo leer la factura', 'Las ventas online', 'Los valores que se te devuelven'],
      ),
      steps: [
        {
          state: S('financeiro'),
          target: 'fatura-item',
          mode: 'click',
          title: L('Abra a fatura', 'Abre la factura'),
          body: L('Clique na fatura para ver a conta.', 'Haz clic en la factura para ver la cuenta.'),
          hint: L('Clique na fatura destacada', 'Haz clic en la factura resaltada'),
        },
        {
          state: S('financeiro', ['fatura']),
          target: 'fa-titulo',
          title: L('A fatura do período', 'La factura del período'),
          body: L(`Ela junta as vendas de <b>${f.inicio}</b> até <b>${f.fim}</b>.`, `Reúne las ventas del <b>${f.inicio}</b> al <b>${f.fim}</b>.`),
        },
        {
          target: 'fa-status',
          pad: 6,
          title: 'VIGENTE',
          body: L('A fatura está aberta. O valor ainda não foi transferido para você.', 'La factura está abierta. El valor todavía no se te transfirió.'),
        },
        {
          target: 'fl-liquido-online',
          title: L('Vendas online', 'Ventas online'),
          body: L(
            `O que os clientes pagaram pelos produtos nas ${pl(on.n, 'venda feita e paga', 'vendas feitas e pagas')} diretamente pelo aplicativo: ${b(f.liquidoOnline)}.`,
            `Lo que los clientes pagaron por los productos en las ${pl(on.n, 'venta hecha y pagada', 'ventas hechas y pagadas')} directamente por la aplicación: ${b(f.liquidoOnline)}.`,
          ),
          countUp: true,
        },
        {
          target: 'fl-incentivos',
          title: L('Reembolso dos incentivos', 'Reembolso de incentivos'),
          body: L(
            `Em algumas vendas, foram utilizados cupons do Bigou. Quando o Bigou oferece o cupom para o cliente, quem paga esse desconto é a plataforma, não você. Você só paga se você criar o cupom.<br>Aqui ela devolve esse valor: ${b(f.reembolso)}.`,
            `En algunas ventas se usaron cupones de Bigou. Cuando Bigou le ofrece el cupón al cliente, quien paga ese descuento es la plataforma, no tú. Solo pagas si tú creas el cupón.<br>Aquí te devuelve ese valor: ${b(f.reembolso)}.`,
          ),
          foot: L('Dica: quando chegar um pedido com cupom de desconto, aceite normalmente.', 'Consejo: cuando llegue un pedido con cupón de descuento, acéptalo normalmente.'),
        },
        {
          target: 'fl-taxas-online',
          title: L('Taxas de serviço online', 'Tasas de servicio online'),
          body: L(
            `Em cada pedido, o cliente paga uma taxa de serviço: ${taxaTxt}. Nas vendas online, ela foi paga pelo aplicativo.<br>Ela entra aqui, mas <b>não é sua</b>: sai mais abaixo, na linha Taxa de serviço.`,
            `En cada pedido, el cliente paga una tasa de servicio: ${taxaTxt}. En las ventas online, se pagó por la aplicación.<br>Entra aquí, pero <b>no es tuya</b>: sale más abajo, en la línea Tasa de Servicio.`,
          ),
        },
        {
          target: 'fl-entradas',
          title: L('Tudo o que entrou', 'Todo lo que entró'),
          body: L('Somando as 3 linhas, você tem todo o valor online que passou pela plataforma.', 'Sumando las 3 líneas, tienes todo el valor online que pasó por la plataforma.'),
          calc: [
            { l: L('Vendas online', 'Ventas online'), v: f.liquidoOnline },
            { op: '+', l: L('Reembolso dos incentivos', 'Reembolso de incentivos'), v: f.reembolso },
            { op: '+', l: L('Taxas de serviço online', 'Tasas de servicio online'), v: f.taxasOnline },
            { op: '=', l: L('Total que passou pela plataforma', 'Total que pasó por la plataforma'), v: f.creditos, total: true },
          ],
          foot: L('É o mesmo valor do pagamento online que você viu no Relatório.', 'Es el mismo valor del pago online que viste en el Informe.'),
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
      ),
    };

    /* 6 ------------------------------------------------------------------ */
    const cn = d.canc;
    const cancTxt = pl(cn.n, L('pedido foi cancelado', 'pedido fue cancelado'), L('pedidos foram cancelados', 'pedidos fueron cancelados'));
    const mensalidadeStep = {
      target: 'fl-mensalidade',
      title: L('Mensalidade', 'Mensualidad'),
      body: L(
        `A mensalidade é de ${b(f.mensalidade)}, cobrada apenas quando a loja atinge o faturamento mínimo de ${limite} em Total Bruto.<br>Suas vendas somaram ${b(d.totalBruto)}. É um valor fixo por mês, <b>separado</b> da comissão.`,
        `La mensualidad es de ${b(f.mensalidade)}, y se cobra solo cuando la tienda alcanza la facturación mínima de ${limite} en Total Bruto.<br>Tus ventas sumaron ${b(d.totalBruto)}. Es un valor fijo por mes, <b>aparte</b> de la comisión.`,
      ),
      countUp: true,
    };
    const debitosStep = {
      target: 'fl-debitos',
      title: L('Débitos remanescentes', 'Débitos pendientes'),
      body: L(
        `Na virada do mês passado, a mensalidade foi deduzida, mas não havia saldo online suficiente para receber, porque todos os valores online foram antecipados durante o mês.<br>O valor veio para esta fatura: ${b(f.debitoRemanescente)}.`,
        `Al cierre del mes pasado se descontó la mensualidad, pero no había saldo online suficiente, porque todos los valores online se anticiparon durante el mes.<br>El valor pasó a esta factura: ${b(f.debitoRemanescente)}.`,
      ),
      foot: L(
        'Dica: o boleto deve ser pago caso a loja fique sem saldo online suficiente no pagamento online.',
        'Consejo: el boleto se debe pagar si la tienda se queda sin saldo online suficiente en el pago online.',
      ),
      countUp: true,
    };
    const cobrancasCalc = [
      { l: L('Débitos remanescentes', 'Débitos pendientes'), v: f.debitoRemanescente },
      { l: L('Comissão', 'Comisión'), v: f.comissao },
      { l: L('Taxa do pagamento online', 'Tasa de Pago Online'), v: f.taxaOnline },
      { l: L('Taxa de transferência', 'Tasa bancaria'), v: f.transferencia },
      { l: L('Taxa de antecipação', 'Tasa de Anticipo'), v: f.taxaAntecipacao },
      { l: L('Taxa de serviço', 'Tasa de Servicio'), v: f.taxaServico },
      { l: L('Mensalidade', 'Mensualidad'), v: f.mensalidade },
      { op: '=', l: L('Total das deduções', 'Total de deducciones'), v: f.cobrancas, total: true },
    ];

    const m6 = {
      n: 6,
      titulo: L('Fatura: comissão', 'Factura: comisión'),
      desc: L('A comissão e os pedidos cancelados por tempo.', 'La comisión y los pedidos cancelados por tiempo.'),
      icone: 'faturaSai',
      intro: L(
        'Agora, as deduções. Todas saem do valor online que passou pela plataforma, ou seja, do pagamento online. Começamos pela comissão.',
        'Ahora, las deducciones. Todas salen del valor online que pasó por la plataforma, es decir, del pago online. Empezamos por la comisión.',
      ),
      aprender: L(
        ['Os débitos remanescentes', 'Como a comissão é calculada', 'Pedidos cancelados por tempo', 'Onde aceitar os pedidos a tempo'],
        ['Los débitos pendientes', 'Cómo se calcula la comisión', 'Pedidos cancelados por tiempo', 'Dónde aceptar los pedidos a tiempo'],
      ),
      steps: [
        Object.assign({ state: S('financeiro', ['fatura']) }, debitosStep),
        {
          target: 'fl-comissao',
          title: L('Comissão', 'Comisión'),
          body: L(
            `É a parte da plataforma pelas vendas feitas pelo aplicativo: ${b(f.comissao)}.<br>Ela vale para <b>todas</b> as vendas: online, dinheiro e maquininha.`,
            `Es la parte de la plataforma por las ventas hechas por la aplicación: ${b(f.comissao)}.<br>Se aplica a <b>todas</b> las ventas: online, efectivo y POS.`,
          ),
          countUp: true,
        },
        {
          target: 'fl-comissao-info',
          mode: 'click',
          pad: 6,
          title: L('Veja a conta da comissão', 'Mira la cuenta de la comisión'),
          body: L('Clique no <b>ⓘ</b> ao lado de <b>Comissão</b>.', 'Haz clic en el <b>ⓘ</b> al lado de <b>Comisión</b>.'),
          hint: cliqueInfo,
        },
        {
          state: S('financeiro', ['fatura', 'comissao']),
          target: 'cm-vendas',
          title: L('Todas as vendas entram', 'Entran todas las ventas'),
          body: L(
            `A conta começa com as <b>${d.n} vendas confirmadas</b> do mês, de todas as formas de pagamento: ${b(d.totalBruto)}.<br>É o mesmo Total Bruto do Relatório.`,
            `La cuenta empieza con las <b>${d.n} ventas confirmadas</b> del mes, de todas las formas de pago: ${b(d.totalBruto)}.<br>Es el mismo Total Bruto del Informe.`,
          ),
          countUp: true,
        },
        {
          target: 'cm-canceladas',
          title: L('Venda cancelada por tempo', 'Venta cancelada por tiempo'),
          body: L(
            `${cancTxt} porque não ${cn.n === 1 ? 'foi aceito nem recusado' : 'foram aceitos nem recusados'} em até <b>15 minutos</b>.<br>Você <b>não recebeu</b> esse valor, mas ele <b>entra na conta da comissão</b>: ${b(cn.bruto)}.`,
            `${cancTxt} porque no ${cn.n === 1 ? 'fue aceptado ni rechazado' : 'fueron aceptados ni rechazados'} en hasta <b>15 minutos</b>.<br><b>No recibiste</b> ese valor, pero <b>entra en la cuenta de la comisión</b>: ${b(cn.bruto)}.`,
          ),
          countUp: true,
        },
        {
          target: 'cm-bruto',
          title: L('O total bruto da comissão', 'El total bruto de la comisión'),
          body: L('Por isso, aqui o total é maior que o Total Bruto do Relatório.', 'Por eso, aquí el total es mayor que el Total Bruto del Informe.'),
          calc: [
            { l: L('Vendas confirmadas', 'Ventas confirmadas'), v: d.totalBruto },
            { op: '+', l: pl(cn.n, L('Cancelada por tempo', 'Cancelada por tiempo'), L('Canceladas por tempo', 'Canceladas por tiempo')), v: cn.bruto },
            { op: '=', l: L('Total bruto da comissão', 'Total bruto de la comisión'), v: f.brutoComissao, total: true },
          ],
          wide: true,
        },
        {
          target: 'cm-taxas',
          title: L('A taxa de serviço sai da conta', 'La tasa de servicio sale de la cuenta'),
          body: L(
            'A comissão <b>não</b> considera a taxa de serviço, porque ela foi paga pelo cliente e é da plataforma.',
            'La comisión <b>no</b> considera la tasa de servicio, porque la pagó el cliente y es de la plataforma.',
          ),
        },
        {
          target: 'cm-comissao',
          title: L(`A comissão é ${PCT(T.comissao)}`, `La comisión es ${PCT(T.comissao)}`),
          body: L('Sobra o valor dos produtos. A comissão é uma parte desse valor.', 'Queda el valor de los productos. La comisión es una parte de ese valor.'),
          calc: [
            { l: L('Base de cálculo', 'Base de cálculo'), v: f.baseComissao },
            { op: '×', l: PCT(T.comissao), txt: PCT(T.comissao) },
            { op: '=', l: L('Comissão', 'Comisión'), v: f.comissao, total: true },
          ],
          countUp: true,
        },
        {
          state: S('financeiro', [], { sidebar: true }),
          target: 'nav-pedidos',
          mode: 'click',
          pad: 4,
          title: L('Como evitar o cancelamento por tempo', 'Cómo evitar la cancelación por tiempo'),
          body: L('Os pedidos novos chegam na tela <b>Pedidos</b>.<br>Clique em <b>Pedidos</b> no menu.', 'Los pedidos nuevos llegan a la pantalla <b>Pedidos</b>.<br>Haz clic en <b>Pedidos</b> en el menú.'),
          hint: L('Clique em Pedidos', 'Haz clic en Pedidos'),
        },
        {
          state: S('pedidos'),
          target: 'pd-aguardando',
          pad: 2,
          title: L('Pedido aguardando confirmação', 'Pedido esperando confirmación'),
          body: L(
            'Quando chega um pedido novo, ele aparece aqui.<br>Você tem até <b>15 minutos</b> para aceitar ou recusar.',
            'Cuando llega un pedido nuevo, aparece aquí.<br>Tienes hasta <b>15 minutos</b> para aceptarlo o rechazarlo.',
          ),
        },
        {
          target: 'pd-head',
          title: L('Fique de olho nesta tela', 'Mantén un ojo en esta pantalla'),
          body: L(
            'Se o pedido não for aceito nem recusado em 15 minutos, ele é cancelado automaticamente.<br>Você perde a venda e ainda paga a comissão sobre ela.',
            'Si el pedido no se acepta ni se rechaza en 15 minutos, se cancela automáticamente.<br>Pierdes la venta y además pagas la comisión sobre ella.',
          ),
          foot: L(
            'Dica: se não puder atender um pedido, recuse dentro do prazo. Assim ele não entra na comissão.',
            'Consejo: si no puedes atender un pedido, recházalo dentro del plazo. Así no entra en la comisión.',
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
      ),
    };

    /* 7 ------------------------------------------------------------------ */
    const m7 = {
      n: 7,
      titulo: L('Fatura: taxas', 'Factura: tasas'),
      desc: L('Pagamento online, transferência e antecipação.', 'Pago online, tasa bancaria y anticipo.'),
      icone: 'percent',
      intro: L('Agora, as taxas da fatura.', 'Ahora, las tasas de la factura.'),
      aprender: L(
        ['A taxa do pagamento online', 'A taxa de transferência', 'A taxa de antecipação'],
        ['La Tasa de Pago Online', 'La tasa bancaria', 'La Tasa de Anticipo'],
      ),
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-taxa-online',
          title: L('Taxa do pagamento online', 'Tasa de Pago Online'),
          body: L(
            `É a dedução somente dos valores pagos pelo aplicativo: ${b(f.taxaOnline)}.<br>Ela vale <b>só</b> para as vendas com pagamento online.`,
            `Es la deducción solo de los valores pagados por la aplicación: ${b(f.taxaOnline)}.<br>Se aplica <b>solo</b> a las ventas con pago online.`,
          ),
          countUp: true,
        },
        {
          target: 'fl-taxa-online-info',
          mode: 'click',
          pad: 6,
          title: L('Veja a conta da taxa', 'Mira la cuenta de la tasa'),
          body: L('Clique no <b>ⓘ</b> ao lado de <b>Taxa do pagamento online</b>.', 'Haz clic en el <b>ⓘ</b> al lado de <b>Tasa de Pago Online</b>.'),
          hint: cliqueInfo,
        },
        {
          state: S('financeiro', ['fatura', 'taxaOnline']),
          target: 'to-calc',
          title: L(`A taxa é ${PCT(T.pagamentoOnline)} das vendas online`, `La tasa es el ${PCT(T.pagamentoOnline)} de las ventas online`),
          calc: [
            { l: L('Total das vendas online', 'Total de ventas online'), v: f.brutoOnline },
            { op: '−', l: L('Taxas de serviço online', 'Tasas de servicio online'), v: on.taxas },
            { op: '=', l: L('Base de cálculo', 'Base de cálculo'), v: f.baseOnline, hl: true },
            { op: '×', l: PCT(T.pagamentoOnline), txt: PCT(T.pagamentoOnline) },
            { op: '=', l: L('Taxa do pagamento online', 'Tasa de Pago Online'), v: f.taxaOnline, total: true },
          ],
          wide: true,
        },
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-transferencia',
          title: L('Taxa de transferência', 'Tasa bancaria'),
          body: L(
            `${b(f.transferencia)}. É referente a despesas bancárias.<br>É cobrada uma única vez no dia do repasse mensal ou toda vez que você antecipar.`,
            `${b(f.transferencia)}. Corresponde a gastos bancarios.<br>Se cobra una sola vez el día de la transferencia mensual o cada vez que anticipas.`,
          ),
        },
        {
          target: 'fl-antecipacao',
          title: L('Taxa de antecipação', 'Tasa de Anticipo'),
          body: L(
            `É ${PCT(T.antecipacao)} do total das vendas online.<br>Ela já aparece deduzida aqui, mas <b>só é aplicada se você pedir a antecipação</b>.`,
            `Es el ${PCT(T.antecipacao)} del total de las ventas online.<br>Ya aparece descontada aquí, pero <b>solo se aplica si pides el anticipo</b>.`,
          ),
          calc: [
            { l: L('Total das vendas online', 'Total de ventas online'), v: on.bruto },
            { op: '×', l: PCT(T.antecipacao), txt: PCT(T.antecipacao) },
            { op: '=', l: L('Taxa de antecipação', 'Tasa de Anticipo'), v: f.taxaAntecipacao, total: true },
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
      ),
    };

    /* 8 ------------------------------------------------------------------ */
    // Um pedido pago em dinheiro, para mostrar a taxa de serviço no caixa da loja
    const exDin = d.orders.find((o) => o.pag === 'dinheiro');
    const taxasCaixa = di.taxas + mq.taxas;
    const m8 = {
      n: 8,
      titulo: L('Fatura: taxa de serviço e mensalidade', 'Factura: tasa de servicio y mensualidad'),
      desc: L('De quem é a taxa de serviço e quando há mensalidade.', 'De quién es la tasa de servicio y cuándo hay mensualidad.'),
      icone: 'moedas',
      intro: L(
        'Vamos entender a taxa de serviço, a mensalidade e fechar a conta das deduções.',
        'Vamos a entender la tasa de servicio, la mensualidad y cerrar la cuenta de las deducciones.',
      ),
      aprender: L(
        ['De quem é a taxa de serviço', 'Por que ela aparece como dedução', 'A mensalidade', 'Como não absorver os custos'],
        ['De quién es la tasa de servicio', 'Por qué aparece como deducción', 'La mensualidad', 'Cómo no absorber los costos'],
      ),
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-taxa-servico',
          title: L('Taxa de serviço: de quem é?', 'Tasa de servicio: ¿de quién es?'),
          body: L(
            `Em cada pedido, o cliente paga uma taxa de serviço, além dos produtos: ${taxaTxt}.<br>Essa taxa é <b>da plataforma</b>. Não é um custo seu: quem paga é o cliente.`,
            `En cada pedido, el cliente paga una tasa de servicio, además de los productos: ${taxaTxt}.<br>Esa tasa es <b>de la plataforma</b>. No es un costo tuyo: la paga el cliente.`,
          ),
        },
        {
          target: 'fl-taxas-online',
          title: L('No pagamento online: entra e sai', 'En el pago online: entra y sale'),
          body: L(
            `Nas vendas online, o cliente pagou a taxa pelo aplicativo. Ela entrou na fatura aqui (${b(on.taxas)}) e sai na linha Taxa de serviço.<br>Você não paga comissão nem taxas sobre o valor da taxa de serviço.`,
            `En las ventas online, el cliente pagó la tasa por la aplicación. Entró en la factura aquí (${b(on.taxas)}) y sale en la línea Tasa de Servicio.<br>No pagas comisión ni tasas sobre el valor de la tasa de servicio.`,
          ),
        },
        {
          target: 'fl-taxa-servico-info',
          mode: 'click',
          pad: 6,
          title: L('Veja a conta da taxa de serviço', 'Mira la cuenta de la tasa de servicio'),
          body: L('Clique no <b>ⓘ</b> ao lado de <b>Taxa de serviço</b>.', 'Haz clic en el <b>ⓘ</b> al lado de <b>Tasa de Servicio</b>.'),
          hint: cliqueInfo,
        },
        {
          state: S('financeiro', ['fatura', 'taxaServico']),
          target: 'ts-offline',
          title: L('No dinheiro e na maquininha: a taxa ficou com você', 'En efectivo y POS: la tasa se quedó contigo'),
          fala: exDin ? L(
            [
              `Em um pedido pago em dinheiro, o cliente pagou ${F(exDin.bruto)}: ${F(exDin.itens)} dos produtos e ${F(exDin.taxa)} de taxa de serviço.`,
              'Essa taxa é da plataforma, mas ficou no seu caixa. Por isso, ela é deduzida aqui.',
            ],
            [
              `En un pedido pagado en efectivo, el cliente pagó ${F(exDin.bruto)}: ${F(exDin.itens)} de los productos y ${F(exDin.taxa)} de tasa de servicio.`,
              'Esa tasa es de la plataforma, pero se quedó en tu caja. Por eso se descuenta aquí.',
            ],
          ) : null,
          body: (exDin ? L(
            `No pedido ${exDin.cod}, pago em dinheiro, o cliente pagou ${b(exDin.bruto)}: ${F(exDin.itens)} dos produtos e ${F(exDin.taxa)} de taxa de serviço.<br>`,
            `En el pedido ${exDin.cod}, pagado en efectivo, el cliente pagó ${b(exDin.bruto)}: ${F(exDin.itens)} de los productos y ${F(exDin.taxa)} de tasa de servicio.<br>`,
          ) : '') +
            L('Essa taxa é da plataforma, mas <b>ficou no seu caixa</b>. Por isso, ela é deduzida aqui.', 'Esa tasa es de la plataforma, pero <b>se quedó en tu caja</b>. Por eso se descuenta aquí.'),
          calc: [
            { l: L('Taxas recebidas em dinheiro', 'Tasas recibidas en efectivo'), v: di.taxas },
            { op: '+', l: L('Taxas recebidas na maquininha', 'Tasas recibidas en POS'), v: mq.taxas },
            { op: '=', l: L('Ficaram no seu caixa', 'Se quedaron en tu caja'), v: taxasCaixa, total: true },
          ],
          wide: true,
        },
        {
          target: 'ts-devolvido',
          title: L('A taxa da maquininha volta para você', 'La tasa del POS vuelve a ti'),
          body: L(
            `A maquininha cobra uma taxa sobre tudo o que passa nela, inclusive sobre a taxa de serviço.<br>Para você não pagar por isso, a plataforma devolve ${PCT(T.devolucaoMaquininha)}.`,
            `El POS cobra una tasa sobre todo lo que pasa por él, incluso sobre la tasa de servicio.<br>Para que no pagues por eso, la plataforma te devuelve el ${PCT(T.devolucaoMaquininha)}.`,
          ),
          calc: [
            { l: L('Taxas pagas na maquininha', 'Tasas pagadas en POS'), v: mq.taxas },
            { op: '×', l: PCT(T.devolucaoMaquininha), txt: PCT(T.devolucaoMaquininha) },
            { op: '=', l: L('Devolvido para você', 'Devuelto a ti'), v: f.devolucao, total: true },
          ],
        },
        {
          target: 'ts-total',
          title: L('Resumindo a taxa de serviço', 'Resumen de la tasa de servicio'),
          body: L(
            'Você só repassa para a plataforma a taxa que o cliente pagou. Ela <b>não sai</b> do valor dos seus produtos.',
            'Solo le pasas a la plataforma la tasa que pagó el cliente. <b>No sale</b> del valor de tus productos.',
          ),
          calc: [
            { l: L('Paga online (entrou na fatura)', 'Pagada online (entró en la factura)'), v: on.taxas },
            { op: '+', l: L('Paga no seu caixa', 'Pagada en tu caja'), v: taxasCaixa },
            { op: '−', l: L('Devolvido da maquininha', 'Devuelto del POS'), v: f.devolucao },
            { op: '=', l: L('Taxa de serviço', 'Tasa de Servicio'), v: f.taxaServico, total: true },
          ],
          wide: true,
          countUp: true,
        },
        Object.assign({ state: S('financeiro', ['fatura']) }, mensalidadeStep),
        {
          target: 'fl-cobrancas',
          title: L('Todas as deduções', 'Todas las deducciones'),
          body: L('Todas saem do valor que passou pela plataforma, ou seja, do pagamento online.', 'Todas salen del valor que pasó por la plataforma, es decir, del pago online.'),
          calc: cobrancasCalc,
          wide: true,
        },
        {
          state: S('financeiro', [], { sidebar: true }),
          target: 'nav-cardapio',
          pad: 4,
          title: L('Você pode ajustar seus preços', 'Puedes ajustar tus precios'),
          body: L(
            'Fique tranquilo: você pode ajustar o valor dos seus produtos para não absorver o custo da comissão e das taxas.<br>Confira se o seu cardápio já está atualizado. Se não estiver, fale com o nosso suporte para atualizar.',
            'Tranquilo: puedes ajustar el valor de tus productos para no absorber el costo de la comisión y las tasas.<br>Revisa si tu menú ya está actualizado. Si no lo está, habla con nuestro soporte para actualizarlo.',
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
      ),
    };

    /* 9 ------------------------------------------------------------------ */
    const pago = { antecipada: true, repassado: true };
    const m9 = {
      n: 9,
      titulo: L('Repasse e antecipação', 'Transferencia y anticipo'),
      icone: 'foguete',
      desc: L('Por que o repasse parece menor, como receber antes e o comprovante.', 'Por qué la transferencia parece menor, cómo recibir antes y el comprobante.'),
      intro: L(
        'Vamos fechar a conta, aprender a receber o repasse antes e onde pegar o comprovante.',
        'Vamos a cerrar la cuenta, aprender a recibir la transferencia antes y dónde obtener el comprobante.',
      ),
      aprender: L(
        ['Como o repasse é formado', 'Por que ele parece pequeno', 'Como pedir a antecipação', 'Onde pegar o comprovante'],
        ['Cómo se compone la transferencia', 'Por qué parece pequeña', 'Cómo pedir el anticipo', 'Dónde obtener el comprobante'],
      ),
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-total',
          title: L('O repasse', 'La transferencia'),
          body: L('É o que será repassado para você depois das deduções.', 'Es lo que se te transferirá después de las deducciones.'),
          calc: [
            { l: L('Total que passou pela plataforma', 'Total que pasó por la plataforma'), v: f.creditos },
            { op: '−', l: L('Deduções', 'Deducciones'), v: f.cobrancas },
            { op: '=', l: L('Repasse', 'Transferencia'), v: f.total, total: true },
          ],
          countUp: true,
        },
        {
          target: 'fl-total',
          title: L('Por que o repasse parece pequeno?', '¿Por qué la transferencia parece pequeña?'),
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
          ),
          body: L(
            `Você vendeu ${b(d.totalBruto)}, mas o repasse é ${b(f.total)}.<br>Isso acontece porque as deduções de <b>todas</b> as vendas saem <b>só</b> do valor que passou pela plataforma.`,
            `Vendiste ${b(d.totalBruto)}, pero la transferencia es de ${b(f.total)}.<br>Esto pasa porque las deducciones de <b>todas</b> las ventas salen <b>solo</b> del valor que pasó por la plataforma.`,
          ),
          calc: [
            { l: L('Pagamento online (pela plataforma)', 'Pago online (por la plataforma)'), v: plataforma },
            { l: L('Dinheiro + maquininha (no seu caixa)', 'Efectivo + POS (en tu caja)'), v: caixa },
          ],
          wide: true,
        },
        {
          target: 'fl-total',
          title: L('A plataforma não ficou com o seu dinheiro', 'La plataforma no se quedó con tu dinero'),
          body: L(
            'O valor das vendas em dinheiro e maquininha já estava com você. Somando com o repasse, você chega ao Resultado.',
            'El valor de las ventas en efectivo y POS ya estaba contigo. Sumándolo a la transferencia, llegas al Resultado.',
          ),
          calc: [
            { l: L('Já no seu caixa', 'Ya en tu caja'), v: caixa },
            { op: '+', l: L('Repasse', 'Transferencia'), v: f.total },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
          wide: true,
        },
        {
          target: 'btn-antecipar',
          mode: 'click',
          title: L('Receba antes: antecipação', 'Recibe antes: anticipo'),
          body: L(
            'O sistema não faz repasses automáticos durante o mês: para receber antes, é preciso solicitar a antecipação.<br>Clique em <b>Solicitar antecipação</b>.',
            'El sistema no hace transferencias automáticas durante el mes: para recibir antes, tienes que solicitar el anticipo.<br>Haz clic en <b>Solicitar anticipo</b>.',
          ),
          hint: L('Clique em Solicitar antecipação', 'Haz clic en Solicitar anticipo'),
        },
        {
          state: S('financeiro', ['fatura', 'antecipacao']),
          target: 'ant-box',
          title: L('Valor a receber', 'Valor a recibir'),
          body: L(
            `É o valor do repasse: ${b(f.total)}, das vendas de ${f.inicio} até ${f.fim}.`,
            `Es el valor de la transferencia: ${b(f.total)}, de las ventas del ${f.inicio} al ${f.fim}.`,
          ),
        },
        {
          target: 'ant-data',
          title: L('Quando o dinheiro cai', 'Cuándo cae el dinero'),
          body: L(
            `A transferência acontece no próximo dia útil (${d.sc.antecipacaoData}), na sua chave PIX.<br>Confira se os seus dados bancários estão certos.`,
            `La transferencia se hace el próximo día hábil (${d.sc.antecipacaoData}), en tu clave PIX.<br>Revisa que tus datos bancarios estén correctos.`,
          ),
          foot: L(
            'Dica: você pode antecipar seu saldo positivo sempre que quiser. Não há repasses em fins de semana nem em feriados nacionais ou municipais de Rio Pomba - MG.',
            'Consejo: puedes anticipar tu saldo positivo cuando quieras. No hay transferencias los fines de semana ni en feriados nacionales o municipales de Rio Pomba - MG.',
          ),
        },
        {
          target: 'ant-aviso',
          title: L('Atenção', 'Atención'),
          body: L(
            'Depois de confirmar, os pedidos desse período <b>não podem mais ser cancelados</b>.',
            'Después de confirmar, los pedidos de ese período <b>ya no se pueden cancelar</b>.',
          ),
        },
        {
          target: 'btn-confirmar',
          mode: 'click',
          pad: 6,
          title: L('Confirme a antecipação', 'Confirma el anticipo'),
          body: L(
            'Clique em <b>CONFIRMAR</b>.<br>No treinamento, nenhum valor é enviado de verdade.',
            'Haz clic en <b>CONFIRMAR</b>.<br>En la capacitación, no se envía ningún valor de verdad.',
          ),
          hint: L('Clique em CONFIRMAR', 'Haz clic en CONFIRMAR'),
        },
        {
          state: S('financeiro', ['fatura'], { antecipada: true }),
          target: 'fa-status',
          pad: 6,
          title: L('Fatura antecipada', 'Factura anticipada'),
          body: L('A fatura mudou para <b>ANTECIPADA</b>: o repasse foi solicitado.', 'La factura cambió a <b>ANTICIPADA</b>: la transferencia fue solicitada.'),
        },
        {
          state: S('financeiro', ['fatura'], pago),
          target: 'fa-repasse-realizado',
          title: L('Repasse realizado', 'Transferencia realizada'),
          body: L(
            `No dia da transferência (${d.sc.antecipacaoData}), aparece aqui <b>Repasse realizado</b>, no mesmo lugar onde você pediu a antecipação.<br>No repasse mensal, é igual.`,
            `El día de la transferencia (${d.sc.antecipacaoData}), aparece aquí <b>Transferencia realizada</b>, en el mismo lugar donde pediste el anticipo.<br>En la transferencia mensual es igual.`,
          ),
        },
        {
          target: 'btn-comprovante',
          mode: 'click',
          pad: 6,
          title: L('Pegue o comprovante', 'Obtén el comprobante'),
          body: L(
            'O comprovante da transferência fica aqui.<br>Clique em <b>Ver comprovante</b>.',
            'El comprobante de la transferencia está aquí.<br>Haz clic en <b>Ver comprobante</b>.',
          ),
          hint: L('Clique em Ver comprovante', 'Haz clic en Ver comprobante'),
        },
        {
          state: S('financeiro', [], pago),
          target: 'fin-repasses',
          title: L('O valor foi para Repasses recebidos', 'El valor pasó a Transferencias recibidas'),
          body: L(
            `Quando o repasse cai na sua conta, o valor sai de <b>Repasse disponível</b> e vai para <b>Repasses recebidos</b>: ${b(f.total)}.`,
            `Cuando la transferencia cae en tu cuenta, el valor sale de <b>Transferencia disponible</b> y pasa a <b>Transferencias recibidas</b>: ${b(f.total)}.`,
          ),
          countUp: true,
        },
        {
          target: 'fin-res',
          title: L('O Resultado não muda', 'El Resultado no cambia'),
          body: L('O dinheiro só mudou de lugar.', 'El dinero solo cambió de lugar.'),
          calc: [
            { l: L('Recebido pela Loja', 'Recibido por la Tienda'), v: r.recebidoLoja },
            { op: '+', l: L('Repasses recebidos', 'Transferencias recibidas'), v: f.total },
            { op: '+', l: L('Repasse disponível', 'Transferencia disponible'), v: 0 },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
        },
        {
          target: 'fin-disponivel',
          title: L('Cuidado ao antecipar tudo', 'Cuidado al anticipar todo'),
          body:
            L(
              'A mensalidade é deduzida na virada do último dia do mês. Se você antecipou todas as faturas, normalmente não sobra saldo online.<br>Aí ela entra na próxima fatura como <b>Débitos remanescentes</b>.',
              'La mensualidad se descuenta al cierre del último día del mes. Si anticipaste todas las facturas, normalmente no queda saldo online.<br>Entonces entra en la próxima factura como <b>Débitos pendientes</b>.',
            ) +
            (f.debitoRemanescente ? L('<br>Foi o que aconteceu no mês passado.', '<br>Eso fue lo que pasó el mes pasado.') : ''),
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
        q: L('Somando todas as formas de pagamento, qual foi o Total Bruto da loja no mês?', 'Sumando todas las formas de pago, ¿cuál fue el Total Bruto de la tienda en el mes?'),
        options: [{ t: F(f.total) }, { t: F(d.totalBruto), ok: true }, { t: F(r.recebidoLoja) }],
        ok: L('O Total Bruto é a soma de todas as vendas.', 'El Total Bruto es la suma de todas las ventas.'),
        no: L('Ainda não. Olhe o valor destacado: é o Total Bruto.', 'Todavía no. Mira el valor resaltado: es el Total Bruto.'),
      },
      {
        id: 'f2',
        tema: TEMA.bruto,
        state: S('relatorio', ['totalBruto']),
        target: 'tb-list',
        q: L('Quantas vendas foram pagas na maquininha?', '¿Cuántas ventas se pagaron con POS?'),
        options: nums.map((x) => ({ t: pl(x, L('venda', 'venta'), L('vendas', 'ventas')), ok: x === mq.n })),
        ok: L(`${vendasPagas(mq.n)} com maquininha de cartão.`, `${vendasPagas(mq.n)} con POS.`),
        no: L('Quase! Procure o bloco "Total pago com maquininha de cartão".', '¡Casi! Busca el bloque "Total pagado con POS".'),
      },
      {
        id: 'f3',
        tema: TEMA.comissao,
        state: S('financeiro', ['fatura']),
        target: 'fl-comissao',
        q: L('Sobre quais vendas a comissão é calculada?', '¿Sobre qué ventas se calcula la comisión?'),
        options: [
          { t: L('Só sobre as vendas online', 'Solo sobre las ventas online') },
          { t: L('Sobre todas, sem a taxa de serviço', 'Sobre todas, sin la tasa de servicio'), ok: true },
          { t: L('Só sobre as vendas em dinheiro', 'Solo sobre las ventas en efectivo') },
        ],
        ok: L('Online, dinheiro e maquininha entram na conta, sem a taxa de serviço.', 'Online, efectivo y POS entran en la cuenta, sin la tasa de servicio.'),
        no: L('Quase! Lembre: a comissão vale para todas as formas de pagamento.', '¡Casi! Recuerda: la comisión se aplica a todas las formas de pago.'),
      },
      {
        id: 'f4',
        tema: TEMA.cancelados,
        state: S('financeiro', ['fatura', 'comissao']),
        target: 'cm-canceladas',
        q: L('Este pedido foi cancelado por tempo. Por que ele entrou na comissão?', 'Este pedido fue cancelado por tiempo. ¿Por qué entró en la comisión?'),
        options: [
          { t: L('Porque o cliente desistiu do pedido', 'Porque el cliente desistió del pedido') },
          { t: L('Porque foi pago em dinheiro', 'Porque se pagó en efectivo') },
          { t: L('Porque não foi aceito nem recusado a tempo', 'Porque no se aceptó ni se rechazó a tiempo'), ok: true },
        ],
        ok: L('Aceite ou recuse cada pedido em até 15 minutos, na tela Pedidos.', 'Acepta o rechaza cada pedido en hasta 15 minutos, en la pantalla Pedidos.'),
        no: L('Ainda não. Lembre do prazo para aceitar ou recusar um pedido.', 'Todavía no. Recuerda el plazo para aceptar o rechazar un pedido.'),
      },
      {
        id: 'f5',
        tema: TEMA.mensalidade,
        state: S('financeiro', ['fatura']),
        target: 'fl-cobrancas',
        q: L('Em qual situação a loja paga a mensalidade?', '¿En qué situación la tienda paga la mensualidad?'),
        options: [
          { t: L('Todo mês, em qualquer caso', 'Todos los meses, en cualquier caso') },
          { t: L(`Ao atingir ${limite} de Total Bruto no mês`, `Al alcanzar ${limite} de Total Bruto en el mes`), ok: true },
          { t: L('Só no mês com vendas em dinheiro', 'Solo en el mes con ventas en efectivo') },
        ],
        ok: L(`A mensalidade é de ${valorMens}, separada da comissão.`, `La mensualidad es de ${valorMens}, aparte de la comisión.`),
        no: L('Ainda não. A mensalidade depende do Total Bruto do mês.', 'Todavía no. La mensualidad depende del Total Bruto del mes.'),
      },
      {
        id: 'f6',
        tema: TEMA.online,
        target: 'fl-total',
        q: L(`A loja vendeu ${F(d.totalBruto)}, mas o repasse foi de ${F(f.total)}. Por quê?`, `La tienda vendió ${F(d.totalBruto)}, pero la transferencia fue de ${F(f.total)}. ¿Por qué?`),
        options: [
          { t: L('A plataforma ficou com a maior parte', 'La plataforma se quedó con la mayor parte') },
          { t: L('O dinheiro e a maquininha já estavam com a loja', 'El efectivo y el POS ya estaban con la tienda'), ok: true },
          { t: L('Houve um erro no cálculo do repasse', 'Hubo un error en el cálculo de la transferencia') },
        ],
        ok: L(`${F(caixa)} já estavam no seu caixa, e as deduções saem do valor online.`, `${F(caixa)} ya estaban en tu caja, y las deducciones salen del valor online.`),
        no: L('Pense: por onde passou o dinheiro das vendas em dinheiro e maquininha?', 'Piensa: ¿por dónde pasó el dinero de las ventas en efectivo y POS?'),
      },
      {
        id: 'f7',
        tema: TEMA.mensalidade,
        target: 'fl-cobrancas',
        q: L('Se o saldo online não cobrir as deduções, o que acontece?', 'Si el saldo online no cubre las deducciones, ¿qué pasa?'),
        options: [
          { t: L('É preciso pagar um boleto no mesmo dia', 'Hay que pagar un boleto el mismo día') },
          { t: L('Vai para a próxima fatura ou é paga no boleto', 'Pasa a la próxima factura o se paga con boleto'), ok: true },
          { t: L('A diferença é perdoada pela plataforma', 'La plataforma perdona la diferencia') },
        ],
        ok: L(
          'Ela aparece na próxima fatura como Débitos remanescentes. Se aparecer um boleto, basta pagá-lo.',
          'Aparece en la próxima factura como Débitos pendientes. Si aparece un boleto, solo tienes que pagarlo.',
        ),
        no: L('Ainda não. Lembre da primeira linha das deduções na fatura.', 'Todavía no. Recuerda la primera línea de las deducciones en la factura.'),
      },
      {
        id: 'f8',
        tema: TEMA.repasse,
        state: S('financeiro'),
        target: 'fin-boxes',
        q: L('Depois de antecipar, quando o dinheiro cai, em qual campo o valor aparece?', 'Después de anticipar, cuando cae el dinero, ¿en qué campo aparece el valor?'),
        options: [
          { t: L('Repasse disponível', 'Transferencia disponible') },
          { t: L('Repasses recebidos', 'Transferencias recibidas'), ok: true },
          { t: L('Recebido pela Loja', 'Recibido por la Tienda') },
        ],
        ok: L('Ele sai de Repasse disponível e vai para Repasses recebidos.', 'Sale de Transferencia disponible y pasa a Transferencias recibidas.'),
        no: L('Ainda não. Lembre do que aconteceu depois do CONFIRMAR.', 'Todavía no. Recuerda lo que pasó después de CONFIRMAR.'),
      },
      {
        id: 'f9',
        tema: TEMA.financeiro,
        target: 'fin-resultado',
        q: L('Qual foi o Resultado da loja no mês?', '¿Cuál fue el Resultado de la tienda en el mes?'),
        options: [{ t: F(d.totalBruto) }, { t: F(r.resultado), ok: true }, { t: F(f.total) }],
        ok: L('Recebido pela Loja + repasses = Resultado.', 'Recibido por la Tienda + transferencias = Resultado.'),
        no: L('Ainda não. O Resultado está em destaque na tela.', 'Todavía no. El Resultado está resaltado en la pantalla.'),
      },
      {
        id: 'f10',
        tema: TEMA.repasse,
        state: S('financeiro', ['fatura'], pago),
        target: 'fa-repasse-realizado',
        q: L('Onde você encontra o comprovante do repasse?', '¿Dónde encuentras el comprobante de la transferencia?'),
        options: [
          { t: L('Na tela Relatório, no pedido', 'En la pantalla Informe, en el pedido') },
          { t: L('Na fatura, em Ver comprovante', 'En la factura, en Ver comprobante'), ok: true },
          { t: L('Em Boletos, no Financeiro', 'En Boletos, en Finanzas') },
        ],
        ok: L('Fica no mesmo lugar onde você pede a antecipação.', 'Está en el mismo lugar donde pides el anticipo.'),
        no: L('Ainda não. Lembre de onde apareceu Repasse realizado.', 'Todavía no. Recuerda dónde apareció Transferencia realizada.'),
      },
    ];
    const m10 = {
      n: 10,
      titulo: L('Exercício final', 'Ejercicio final'),
      icone: 'trofeu',
      desc: L('Teste o que você aprendeu.', 'Pon a prueba lo que aprendiste.'),
      intro: L('Hora de praticar. Responda olhando para a tela.', 'Hora de practicar. Responde mirando la pantalla.'),
      aprender: L(
        [`${perguntas.length} perguntas rápidas`, 'Sem pressa: você pode tentar de novo'],
        [`${perguntas.length} preguntas rápidas`, 'Sin prisa: puedes intentarlo de nuevo'],
      ),
      steps: perguntas.map((p, i) => Object.assign({ mode: 'quiz', title: L(`Pergunta ${i + 1}`, `Pregunta ${i + 1}`) }, p)),
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
      ),
    };

    /* Desafio rápido: uma pergunta de revisão no fim dos módulos 1 a 9 */
    const DESAFIO = L('Desafio rápido', 'Desafío rápido');
    const desafio = (id, tema, state, target, q, options, ok, no) => ({ id, tema, state, target, mode: 'quiz', desafio: true, title: DESAFIO, q, options, ok, no: no || L('Quase! Pense no que você acabou de ver.', '¡Casi! Piensa en lo que acabas de ver.') });
    const DESAFIOS = {
      1: desafio('d1', TEMA.bruto, S('relatorio'), 'rp-bruto', L('O que representa o Total Bruto da loja?', '¿Qué representa el Total Bruto de la tienda?'),
        [
          { t: L('Só as vendas pagas online', 'Solo las ventas pagadas online') },
          { t: L('A soma de todas as vendas do mês', 'La suma de todas las ventas del mes'), ok: true },
          { t: L('O valor transferido para a sua conta', 'El valor transferido a tu cuenta') },
        ],
        L('O Total Bruto junta todas as formas de pagamento.', 'El Total Bruto reúne todas las formas de pago.')),
      2: desafio('d2', TEMA.online, S('relatorio', ['totalBruto']), 'tb-online', L('Quando o cliente paga online, o que a plataforma desconta desse valor?', 'Cuando el cliente paga online, ¿qué descuenta la plataforma de ese valor?'),
        [
          { t: L('Só a comissão das vendas online', 'Solo la comisión de las ventas online') },
          { t: L('Nada: o valor vai inteiro para a loja', 'Nada: el valor va entero a la tienda') },
          { t: L('A comissão e as taxas de todas as vendas', 'La comisión y las tasas de todas las ventas'), ok: true },
        ],
        L('Por isso o repasse é menor que o valor online.', 'Por eso la transferencia es menor que el valor online.')),
      3: desafio('d3', TEMA.bruto, S('relatorio', ['totalBruto']), 'tb-list', L('Quando o cliente paga o pedido em dinheiro, onde fica esse valor?', 'Cuando el cliente paga el pedido en efectivo, ¿dónde queda ese valor?'),
        [
          { t: L('Fica direto com a loja', 'Queda directo con la tienda'), ok: true },
          { t: L('Passa antes pela plataforma', 'Pasa antes por la plataforma') },
          { t: L('Não entra no faturamento', 'No entra en la facturación') },
        ],
        L('E o valor da maquininha cai direto na conta dela.', 'Y el valor del POS cae directo en su cuenta.')),
      4: desafio('d4', TEMA.financeiro, S('financeiro'), 'fin-boxes', L('Antes de antecipar, em qual campo do Financeiro você vê o valor que ainda vai ser transferido?', 'Antes de anticipar, ¿en qué campo de Finanzas ves el valor que todavía se va a transferir?'),
        [
          { t: L('Repasses recebidos', 'Transferencias recibidas') },
          { t: L('Repasse disponível', 'Transferencia disponible'), ok: true },
          { t: L('Recebido pela Loja', 'Recibido por la Tienda') },
        ],
        L('Ele vira "Repasses recebidos" quando é transferido.', 'Pasa a "Transferencias recibidas" cuando se transfiere.')),
      5: desafio('d5', TEMA.cupons, S('financeiro', ['fatura']), 'fl-incentivos', L('Quando o Bigou oferece um cupom ao cliente, quem paga o desconto?', 'Cuando Bigou le ofrece un cupón al cliente, ¿quién paga el descuento?'),
        [
          { t: L('A loja, em todos os casos', 'La tienda, en todos los casos') },
          { t: L('O cliente, depois da entrega', 'El cliente, después de la entrega') },
          { t: L('A plataforma, que devolve na fatura', 'La plataforma, que lo devuelve en la factura'), ok: true },
        ],
        L('Ele volta como "Reembolso dos incentivos".', 'Vuelve como "Reembolso de incentivos".')),
      6: desafio('d6', TEMA.cancelados, S('pedidos'), 'pd-aguardando', L('O que acontece com um pedido que fica 15 minutos sem ser aceito nem recusado?', '¿Qué pasa con un pedido que pasa 15 minutos sin ser aceptado ni rechazado?'),
        [
          { t: L('Continua esperando a loja', 'Sigue esperando a la tienda') },
          { t: L('É cancelado e entra na comissão', 'Se cancela y entra en la comisión'), ok: true },
          { t: L('É aceito automaticamente', 'Se acepta automáticamente') },
        ],
        L('Por isso, aceite ou recuse cada pedido a tempo.', 'Por eso, acepta o rechaza cada pedido a tiempo.')),
      7: desafio('d7', TEMA.taxas, S('financeiro', ['fatura']), 'fl-antecipacao', L('Em qual situação a taxa de antecipação é cobrada de fato?', '¿En qué situación se cobra de verdad la Tasa de Anticipo?'),
        [
          { t: L('Quando a loja pede a antecipação', 'Cuando la tienda pide el anticipo'), ok: true },
          { t: L('Em toda fatura, mesmo sem antecipar', 'En toda factura, aunque no anticipe') },
          { t: L('Só nas vendas pagas em dinheiro', 'Solo en las ventas pagadas en efectivo') },
        ],
        L('Ela aparece em toda fatura, mas só é cobrada se você antecipar.', 'Aparece en toda factura, pero solo se cobra si anticipas.'),
        L('Quase! Lembre: ela aparece na fatura, mas só é aplicada em um caso.', '¡Casi! Recuerda: aparece en la factura, pero solo se aplica en un caso.')),
      8: desafio('d8', TEMA.servico, S('financeiro', ['fatura', 'taxaServico']), 'ts-offline', L('Por que a taxa de serviço das vendas em dinheiro aparece como dedução?', '¿Por qué la tasa de servicio de las ventas en efectivo aparece como deducción?'),
        [
          { t: L('Porque é uma multa para a loja', 'Porque es una multa para la tienda') },
          { t: L('Porque a loja recebeu a taxa, que é da plataforma', 'Porque la tienda recibió la tasa, que es de la plataforma'), ok: true },
          { t: L('Porque a comissão foi cobrada duas vezes', 'Porque la comisión se cobró dos veces') },
        ],
        L('Você só repassa o que o cliente pagou para a plataforma.', 'Solo le pasas a la plataforma lo que pagó el cliente.')),
      9: desafio('d9', TEMA.repasse, S('financeiro', [], pago), 'fin-disponivel', L('Se a loja não pedir antecipação, quando recebe o repasse?', 'Si la tienda no pide anticipo, ¿cuándo recibe la transferencia?'),
        [
          { t: L('Todos os dias, automaticamente', 'Todos los días, automáticamente') },
          { t: L('Só quando a loja pedir', 'Solo cuando la tienda lo pida') },
          { t: L('No 2º dia útil do mês seguinte', 'El 2º día hábil del mes siguiente'), ok: true },
        ],
        L('Antecipar é opcional: sem pedir, o repasse chega no mês seguinte.', 'Anticipar es opcional: si no lo pides, la transferencia llega el mes siguiente.')),
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
    const txt = (v) => !TREINO.es && typeof v === 'string' && v.trim() ? v.trim() : null;
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
    );
  };
})();
