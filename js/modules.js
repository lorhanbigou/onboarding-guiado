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
    const taxaTxt = `${F(Math.round(TS.normal * 100))} por pedido, ou ${F(Math.round(TS.maior * 100))} em pedidos acima de ${F(TS.acimaDe * 100)}`;
    const caixa = r.recebidoLoja;      // dinheiro + maquininha
    const plataforma = r.plataforma;   // o que passou pela plataforma

    /* 1 ------------------------------------------------------------------ */
    const m1 = {
      n: 1,
      titulo: 'Suas vendas',
      icone: 'relatorio',
      desc: 'Onde ficam suas vendas e o que é o Total Bruto.',
      intro: 'Vamos começar pelo lugar onde ficam todas as vendas da sua loja: a tela Relatório.',
      aviso: 'Lembre: este treinamento é ilustrativo. Todos os dados são fictícios, inclusive os valores de comissão e taxas. Confira no seu contrato os valores praticados na sua loja.',
      aprender: ['Onde ver suas vendas', 'O que é o Total Bruto', 'As 3 formas de pagamento'],
      steps: [
        {
          state: S('relatorio'),
          target: 'rp-table',
          title: 'Aqui estão todas as suas vendas',
          body: `Esta é a tela <b>Relatório</b>. Cada linha é um pedido da sua loja.<br>Neste mês, foram <b>${pl(d.n, 'venda', 'vendas')}</b>.`,
        },
        {
          target: 'rp-bruto',
          title: 'Total Bruto',
          body: `É a soma de tudo o que você vendeu no mês: ${b(d.totalBruto)}.`,
          countUp: true,
        },
        {
          target: 'rp-bruto-info',
          mode: 'click',
          pad: 6,
          title: 'Veja como ele é formado',
          body: 'Clique no <b>ⓘ</b> ao lado de <b>Total Bruto</b>.',
          hint: 'Clique no ⓘ destacado',
        },
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-list',
          title: 'Suas vendas chegam de 3 formas',
          body: '<b>Pagamento online</b>, <b>dinheiro</b> e <b>maquininha</b>.<br>Vamos entender cada uma nos próximos módulos.',
        },
        {
          target: 'tb-total',
          title: 'Todas são vendas',
          body: 'Mas o valor chegou por caminhos diferentes.',
          calc: [
            { l: 'Pagamento online', v: on.bruto },
            { op: '+', l: 'Dinheiro', v: di.bruto },
            { op: '+', l: 'Maquininha', v: mq.bruto },
            { op: '=', l: 'Total Bruto', v: d.totalBruto, total: true },
          ],
          foot: `Cada pedido tem uma taxa de serviço, paga pelo cliente: ${taxaTxt}. Ela aparece de novo na fatura.`,
        },
      ],
      resumo: [
        'Todas as vendas do mês ficam na tela Relatório.',
        'Total Bruto é a soma de todas as vendas.',
        'As vendas chegam de 3 formas: online, dinheiro e maquininha.',
      ],
    };

    /* 2 ------------------------------------------------------------------ */
    const m2 = {
      n: 2,
      titulo: 'Pagamento online',
      icone: 'celular',
      desc: 'Vendas pagas pelo aplicativo.',
      intro: 'Veja o que acontece com o dinheiro quando o cliente paga pelo aplicativo.',
      aprender: ['O que é pagamento online', 'Por que esse valor é tão importante', 'O que é repasse'],
      steps: [
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-online',
          title: 'Vendas com pagamento online',
          body: `${pl(on.n, 'venda foi paga', 'vendas foram pagas')} pelo aplicativo, na hora do pedido: ${b(on.bruto)}.<br>Esse valor <b>passa primeiro pela plataforma</b>.`,
          foot: 'Dica: nesses pedidos, o cliente já pagou. Você só precisa aceitar e entregar, sem cobrar o cliente.',
          countUp: true,
        },
        {
          target: 'tb-online',
          title: 'É daqui que saem as deduções',
          body: 'Dele, a plataforma deduz a comissão e as taxas de <b>todas</b> as suas vendas, inclusive das vendas em dinheiro e maquininha.',
        },
        {
          target: 'tb-online',
          title: 'O repasse',
          body: 'O valor que fica depois das deduções é enviado para você.<br>Esse envio se chama <b>repasse</b>.',
        },
      ],
      resumo: [
        'Pagamento online: o cliente paga pelo aplicativo.',
        'Esse valor passa primeiro pela plataforma.',
        'Dele, a plataforma deduz a comissão e as taxas de todas as vendas.',
        'O valor que fica é enviado para você: o repasse.',
      ],
    };

    /* 3 ------------------------------------------------------------------ */
    const m3 = {
      n: 3,
      titulo: 'Dinheiro e maquininha',
      icone: 'dinheiro',
      desc: 'Vendas que entram direto no seu caixa.',
      intro: 'Agora, as vendas em que o cliente paga direto para você.',
      aprender: ['Vendas em dinheiro', 'Vendas na maquininha', 'Onde está o dinheiro das suas vendas'],
      steps: [
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-dinheiro',
          title: 'Dinheiro',
          body: `${pl(di.n, 'venda foi paga', 'vendas foram pagas')} em dinheiro: ${b(di.bruto)}.<br>O cliente pagou direto para você. Esse dinheiro <b>já entrou no seu caixa</b>.`,
          countUp: true,
        },
        {
          target: 'tb-maquininha',
          title: 'Maquininha',
          body: `${pl(mq.n, 'venda foi paga', 'vendas foram pagas')} no cartão, na sua maquininha: ${b(mq.bruto)}.<br>O valor cai na conta da sua maquininha, <b>não passa pela plataforma</b>.`,
          countUp: true,
        },
        {
          target: 'tb-total',
          title: 'Onde está o dinheiro das suas vendas',
          fala: [
            `Das suas vendas, ${F(caixa)} já estão com você, porque foram pagos em dinheiro ou na maquininha.`,
            `Só ${F(plataforma)} passaram pela plataforma, no pagamento on-line.`,
            'Guarde essa ideia: ela explica por que o repasse pode parecer pequeno.',
          ],
          body: `Das suas vendas, ${b(caixa)} já estão com você.<br>Só ${b(plataforma)} passaram pela plataforma.`,
          calc: [
            { l: 'Dinheiro + maquininha (no seu caixa)', v: caixa },
            { op: '+', l: 'Pagamento online (pela plataforma)', v: plataforma },
            { op: '=', l: 'Total Bruto', v: d.totalBruto, total: true },
          ],
          foot: 'Guarde essa ideia: ela explica por que o repasse pode parecer pequeno.',
          wide: true,
        },
      ],
      resumo: [
        'Dinheiro e maquininha: o cliente paga direto para você.',
        'Esse dinheiro entra direto no seu caixa.',
        'Só o pagamento online passa pela plataforma.',
      ],
    };

    /* 4 ------------------------------------------------------------------ */
    const m4 = {
      n: 4,
      titulo: 'Tela Financeiro',
      icone: 'painel',
      desc: 'Resultado, recebidos e repasse disponível.',
      intro: 'Agora vamos para a tela Financeiro. Ela mostra quanto ficou com você no mês.',
      aprender: ['O que é o Resultado', 'Os 3 quadros ao lado dele', 'Onde ficam as faturas'],
      steps: [
        {
          state: S('relatorio', [], { sidebar: true }),
          target: 'nav-financeiro',
          mode: 'click',
          pad: 4,
          title: 'Vamos ao Financeiro',
          body: 'Clique em <b>Financeiro</b> no menu.',
          hint: 'Clique em Financeiro',
        },
        {
          state: S('financeiro'),
          target: 'fin-resultado',
          title: 'Resultado',
          body: `É tudo o que ficou com você no mês depois das deduções: ${b(r.resultado)}.<br>Ele é a soma dos 3 quadros ao lado.`,
          countUp: true,
        },
        {
          target: 'fin-recebido',
          title: 'Recebido pela Loja',
          body: 'É o valor das vendas em dinheiro e maquininha. Ele já entrou no seu caixa.',
          calc: [
            { l: 'Dinheiro', v: di.liquido },
            { op: '+', l: 'Maquininha', v: mq.liquido },
            { op: '=', l: 'Recebido pela Loja', v: r.recebidoLoja, total: true },
          ],
          countUp: true,
        },
        {
          target: 'fin-repasses',
          title: 'Repasses recebidos',
          body: `É o que a plataforma já transferiu para você neste mês, caso você tenha antecipado.<br>Por enquanto: ${b(0)}.`,
        },
        {
          target: 'fin-disponivel',
          title: 'Repasse disponível',
          body: `É o valor disponível para repasse: ${b(r.repasseDisponivel)}. Se você não antecipar, a plataforma transfere no 2º dia útil do mês seguinte às suas vendas (${TREINO.periodo.repasseMensal}).<br>Esse é o valor das vendas online, após a dedução da comissão e das taxas.`,
          countUp: true,
        },
        {
          target: 'fin-disponivel',
          title: 'Esse valor muda todos os dias',
          body: 'O Repasse disponível é <b>volátil</b>.<br>Se em um dia você tiver apenas vendas pagas em dinheiro ou maquininha, as deduções dessas vendas saem do saldo online, e ele diminui.',
        },
        {
          target: 'fin-res',
          title: 'A soma',
          calc: [
            { l: 'Recebido pela Loja', v: r.recebidoLoja },
            { op: '+', l: 'Repasses recebidos', v: r.repassesRecebidos },
            { op: '+', l: 'Repasse disponível', v: r.repasseDisponivel },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
        },
        {
          target: 'fin-botoes',
          title: 'Boletos e Repasses',
          body: 'Em <b>Repasses</b>, ficam as transferências feitas para você.<br>Em <b>Boletos</b>, pode aparecer um boleto quando o saldo online não cobre a comissão e as taxas. Nesse caso, basta acessá-lo e pagar.',
        },
        {
          target: 'fin-faturas',
          title: 'Faturas do Período',
          body: 'A fatura mostra a conta completa do repasse.<br>Nos próximos módulos, vamos abrir e ler linha por linha.',
        },
      ],
      resumo: [
        'Resultado: tudo o que ficou com você no mês.',
        'Recebido pela Loja: dinheiro e maquininha, já no seu caixa.',
        'Repasse disponível: transferido no 2º dia útil do mês seguinte, se você não antecipar.',
        'Repasses recebidos: o que já foi transferido.',
      ],
    };

    /* 5 ------------------------------------------------------------------ */
    const m5 = {
      n: 5,
      titulo: 'Fatura: o que entrou de pagamento online',
      icone: 'faturaEntra',
      desc: 'As vendas online e os valores devolvidos.',
      intro: 'A fatura mostra todo o cálculo para repasse, linha por linha. Primeiro, o que entrou de pagamento online.',
      aprender: ['Como ler a fatura', 'As vendas online', 'Os valores devolvidos para você'],
      steps: [
        {
          state: S('financeiro'),
          target: 'fatura-item',
          mode: 'click',
          title: 'Abra a fatura',
          body: 'Clique na fatura para ver a conta.',
          hint: 'Clique na fatura destacada',
        },
        {
          state: S('financeiro', ['fatura']),
          target: 'fa-titulo',
          title: 'A fatura do período',
          body: `Ela junta as vendas de <b>${f.inicio}</b> até <b>${f.fim}</b>.`,
        },
        {
          target: 'fa-status',
          pad: 6,
          title: 'VIGENTE',
          body: 'A fatura está aberta. O valor ainda não foi transferido para você.',
        },
        {
          target: 'fl-liquido-online',
          title: 'Vendas online',
          body: `O que os clientes pagaram pelos produtos nas ${pl(on.n, 'venda feita e paga', 'vendas feitas e pagas')} diretamente pelo aplicativo: ${b(f.liquidoOnline)}.`,
          countUp: true,
        },
        {
          target: 'fl-incentivos',
          title: 'Reembolso dos incentivos',
          body: `Em algumas vendas, foram utilizados cupons do Bigou. Quando o Bigou oferece o cupom para o cliente, quem paga esse desconto é a plataforma, não você. Você só paga se você criar o cupom.<br>Aqui ela devolve esse valor: ${b(f.reembolso)}.`,
          foot: 'Dica: quando chegar um pedido com cupom de desconto, aceite normalmente.',
        },
        {
          target: 'fl-taxas-online',
          title: 'Taxas de serviço online',
          body: `Em cada pedido, o cliente paga uma taxa de serviço: ${taxaTxt}. Nas vendas online, ela foi paga pelo aplicativo.<br>Ela entra aqui, mas <b>não é sua</b>: sai mais abaixo, na linha Taxa de serviço.`,
        },
        {
          target: 'fl-entradas',
          title: 'Tudo o que entrou',
          body: 'Somando as 3 linhas, você tem todo o valor online que passou pela plataforma.',
          calc: [
            { l: 'Vendas online', v: f.liquidoOnline },
            { op: '+', l: 'Reembolso dos incentivos', v: f.reembolso },
            { op: '+', l: 'Taxas de serviço online', v: f.taxasOnline },
            { op: '=', l: 'Total que passou pela plataforma', v: f.creditos, total: true },
          ],
          foot: 'É o mesmo valor do pagamento online que você viu no Relatório.',
        },
      ],
      resumo: [
        'A fatura junta as vendas de um período.',
        'VIGENTE: a fatura está aberta.',
        'Entram as vendas online, os cupons do Bigou devolvidos e as taxas de serviço online.',
      ],
    };

    /* 6 ------------------------------------------------------------------ */
    const cn = d.canc;
    const cancTxt = pl(cn.n, 'pedido foi cancelado', 'pedidos foram cancelados');
    const mensalidadeStep = {
      target: 'fl-mensalidade',
      title: 'Mensalidade',
      body: `A mensalidade é de ${b(f.mensalidade)}, cobrada apenas quando a loja atinge o faturamento mínimo de ${limite} em Total Bruto.<br>Suas vendas somaram ${b(d.totalBruto)}. É um valor fixo por mês, <b>separado</b> da comissão.`,
      countUp: true,
    };
    const debitosStep = {
      target: 'fl-debitos',
      title: 'Débitos remanescentes',
      body: `Na virada do mês passado, a mensalidade foi deduzida, mas não havia saldo online suficiente para receber, porque todos os valores online foram antecipados durante o mês.<br>O valor veio para esta fatura: ${b(f.debitoRemanescente)}.`,
      foot: 'Dica: o boleto deve ser pago caso a loja fique sem saldo online suficiente no pagamento online.',
      countUp: true,
    };
    const cobrancasCalc = [
      { l: 'Débitos remanescentes', v: f.debitoRemanescente },
      { l: 'Comissão', v: f.comissao },
      { l: 'Taxa do pagamento online', v: f.taxaOnline },
      { l: 'Taxa de transferência', v: f.transferencia },
      { l: 'Taxa de antecipação', v: f.taxaAntecipacao },
      { l: 'Taxa de serviço', v: f.taxaServico },
      { l: 'Mensalidade', v: f.mensalidade },
      { op: '=', l: 'Total das deduções', v: f.cobrancas, total: true },
    ];

    const m6 = {
      n: 6,
      titulo: 'Fatura: comissão',
      desc: 'A comissão e os pedidos cancelados por tempo.',
      icone: 'faturaSai',
      intro: 'Agora, as deduções. Todas saem do valor online que passou pela plataforma, ou seja, do pagamento online. Começamos pela comissão.',
      aprender: ['Os débitos remanescentes', 'Como a comissão é calculada', 'Pedidos cancelados por tempo', 'Onde aceitar os pedidos a tempo'],
      steps: [
        Object.assign({ state: S('financeiro', ['fatura']) }, debitosStep),
        {
          target: 'fl-comissao',
          title: 'Comissão',
          body: `É a parte da plataforma pelas vendas feitas pelo aplicativo: ${b(f.comissao)}.<br>Ela vale para <b>todas</b> as vendas: online, dinheiro e maquininha.`,
          countUp: true,
        },
        {
          target: 'fl-comissao-info',
          mode: 'click',
          pad: 6,
          title: 'Veja a conta da comissão',
          body: 'Clique no <b>ⓘ</b> ao lado de <b>Comissão</b>.',
          hint: 'Clique no ⓘ destacado',
        },
        {
          state: S('financeiro', ['fatura', 'comissao']),
          target: 'cm-vendas',
          title: 'Todas as vendas entram',
          body: `A conta começa com as <b>${d.n} vendas confirmadas</b> do mês, de todas as formas de pagamento: ${b(d.totalBruto)}.<br>É o mesmo Total Bruto do Relatório.`,
          countUp: true,
        },
        {
          target: 'cm-canceladas',
          title: 'Venda cancelada por tempo',
          body: `${cancTxt} porque não ${cn.n === 1 ? 'foi aceito nem recusado' : 'foram aceitos nem recusados'} em até <b>15 minutos</b>.<br>Você <b>não recebeu</b> esse valor, mas ele <b>entra na conta da comissão</b>: ${b(cn.bruto)}.`,
          countUp: true,
        },
        {
          target: 'cm-bruto',
          title: 'O total bruto da comissão',
          body: 'Por isso, aqui o total é maior que o Total Bruto do Relatório.',
          calc: [
            { l: 'Vendas confirmadas', v: d.totalBruto },
            { op: '+', l: pl(cn.n, 'Cancelada por tempo', 'Canceladas por tempo'), v: cn.bruto },
            { op: '=', l: 'Total bruto da comissão', v: f.brutoComissao, total: true },
          ],
          wide: true,
        },
        {
          target: 'cm-taxas',
          title: 'A taxa de serviço sai da conta',
          body: 'A comissão <b>não</b> considera a taxa de serviço, porque ela foi paga pelo cliente e é da plataforma.',
        },
        {
          target: 'cm-comissao',
          title: `A comissão é ${PCT(T.comissao)}`,
          body: 'Sobra o valor dos produtos. A comissão é uma parte desse valor.',
          calc: [
            { l: 'Base de cálculo', v: f.baseComissao },
            { op: '×', l: PCT(T.comissao), txt: PCT(T.comissao) },
            { op: '=', l: 'Comissão', v: f.comissao, total: true },
          ],
          countUp: true,
        },
        {
          state: S('financeiro', [], { sidebar: true }),
          target: 'nav-pedidos',
          mode: 'click',
          pad: 4,
          title: 'Como evitar o cancelamento por tempo',
          body: 'Os pedidos novos chegam na tela <b>Pedidos</b>.<br>Clique em <b>Pedidos</b> no menu.',
          hint: 'Clique em Pedidos',
        },
        {
          state: S('pedidos'),
          target: 'pd-aguardando',
          pad: 2,
          title: 'Pedido aguardando confirmação',
          body: 'Quando chega um pedido novo, ele aparece aqui.<br>Você tem até <b>15 minutos</b> para aceitar ou recusar.',
        },
        {
          target: 'pd-head',
          title: 'Fique de olho nesta tela',
          body: 'Se o pedido não for aceito nem recusado em 15 minutos, ele é cancelado automaticamente.<br>Você perde a venda e ainda paga a comissão sobre ela.',
          foot: 'Dica: se não puder atender um pedido, recuse dentro do prazo. Assim ele não entra na comissão.',
        },
      ],
      resumo: [
        'Débitos remanescentes: deduções que ficaram sem saldo online em uma fatura anterior.',
        `Comissão: ${PCT(T.comissao)} do valor dos produtos de todas as vendas.`,
        'Pedido não aceito nem recusado em 15 minutos é cancelado e entra na comissão.',
        'Acompanhe a tela Pedidos e aceite ou recuse cada pedido a tempo.',
      ],
    };

    /* 7 ------------------------------------------------------------------ */
    const m7 = {
      n: 7,
      titulo: 'Fatura: taxas',
      desc: 'Pagamento online, transferência e antecipação.',
      icone: 'percent',
      intro: 'Agora, as taxas da fatura.',
      aprender: ['A taxa do pagamento online', 'A taxa de transferência', 'A taxa de antecipação'],
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-taxa-online',
          title: 'Taxa do pagamento online',
          body: `É a dedução somente dos valores pagos pelo aplicativo: ${b(f.taxaOnline)}.<br>Ela vale <b>só</b> para as vendas com pagamento online.`,
          countUp: true,
        },
        {
          target: 'fl-taxa-online-info',
          mode: 'click',
          pad: 6,
          title: 'Veja a conta da taxa',
          body: 'Clique no <b>ⓘ</b> ao lado de <b>Taxa do pagamento online</b>.',
          hint: 'Clique no ⓘ destacado',
        },
        {
          state: S('financeiro', ['fatura', 'taxaOnline']),
          target: 'to-calc',
          title: `A taxa é ${PCT(T.pagamentoOnline)} das vendas online`,
          calc: [
            { l: 'Total das vendas online', v: f.brutoOnline },
            { op: '−', l: 'Taxas de serviço online', v: on.taxas },
            { op: '=', l: 'Base de cálculo', v: f.baseOnline, hl: true },
            { op: '×', l: PCT(T.pagamentoOnline), txt: PCT(T.pagamentoOnline) },
            { op: '=', l: 'Taxa do pagamento online', v: f.taxaOnline, total: true },
          ],
          wide: true,
        },
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-transferencia',
          title: 'Taxa de transferência',
          body: `${b(f.transferencia)}. É referente a despesas bancárias.<br>É cobrada uma única vez no dia do repasse mensal ou toda vez que você antecipar.`,
        },
        {
          target: 'fl-antecipacao',
          title: 'Taxa de antecipação',
          body: `É ${PCT(T.antecipacao)} do total das vendas online.<br>Ela já aparece deduzida aqui, mas <b>só é aplicada se você pedir a antecipação</b>.`,
          calc: [
            { l: 'Total das vendas online', v: on.bruto },
            { op: '×', l: PCT(T.antecipacao), txt: PCT(T.antecipacao) },
            { op: '=', l: 'Taxa de antecipação', v: f.taxaAntecipacao, total: true },
          ],
          wide: true,
        },
      ],
      resumo: [
        `Taxa do pagamento online: ${PCT(T.pagamentoOnline)}, só das vendas online.`,
        `Taxa de transferência: ${F(f.transferencia)}, de despesas bancárias.`,
        `Taxa de antecipação: ${PCT(T.antecipacao)} das vendas online, só se você antecipar.`,
      ],
    };

    /* 8 ------------------------------------------------------------------ */
    // Um pedido pago em dinheiro, para mostrar a taxa de serviço no caixa da loja
    const exDin = d.orders.find((o) => o.pag === 'dinheiro');
    const taxasCaixa = di.taxas + mq.taxas;
    const m8 = {
      n: 8,
      titulo: 'Fatura: taxa de serviço e mensalidade',
      desc: 'De quem é a taxa de serviço e quando há mensalidade.',
      icone: 'moedas',
      intro: 'Vamos entender a taxa de serviço, a mensalidade e fechar a conta das deduções.',
      aprender: ['De quem é a taxa de serviço', 'Por que ela aparece como dedução', 'A mensalidade', 'Como não absorver os custos'],
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-taxa-servico',
          title: 'Taxa de serviço: de quem é?',
          body: `Em cada pedido, o cliente paga uma taxa de serviço, além dos produtos: ${taxaTxt}.<br>Essa taxa é <b>da plataforma</b>. Não é um custo seu: quem paga é o cliente.`,
        },
        {
          target: 'fl-taxas-online',
          title: 'No pagamento online: entra e sai',
          body: `Nas vendas online, o cliente pagou a taxa pelo aplicativo. Ela entrou na fatura aqui (${b(on.taxas)}) e sai na linha Taxa de serviço.<br>Você não paga comissão nem taxas sobre o valor da taxa de serviço.`,
        },
        {
          target: 'fl-taxa-servico-info',
          mode: 'click',
          pad: 6,
          title: 'Veja a conta da taxa de serviço',
          body: 'Clique no <b>ⓘ</b> ao lado de <b>Taxa de serviço</b>.',
          hint: 'Clique no ⓘ destacado',
        },
        {
          state: S('financeiro', ['fatura', 'taxaServico']),
          target: 'ts-offline',
          title: 'No dinheiro e na maquininha: a taxa ficou com você',
          fala: exDin ? [
            `Em um pedido pago em dinheiro, o cliente pagou ${F(exDin.bruto)}: ${F(exDin.itens)} dos produtos e ${F(exDin.taxa)} de taxa de serviço.`,
            'Essa taxa é da plataforma, mas ficou no seu caixa. Por isso, ela é deduzida aqui.',
          ] : null,
          body: (exDin ? `No pedido ${exDin.cod}, pago em dinheiro, o cliente pagou ${b(exDin.bruto)}: ${F(exDin.itens)} dos produtos e ${F(exDin.taxa)} de taxa de serviço.<br>` : '') +
            'Essa taxa é da plataforma, mas <b>ficou no seu caixa</b>. Por isso, ela é deduzida aqui.',
          calc: [
            { l: 'Taxas recebidas em dinheiro', v: di.taxas },
            { op: '+', l: 'Taxas recebidas na maquininha', v: mq.taxas },
            { op: '=', l: 'Ficaram no seu caixa', v: taxasCaixa, total: true },
          ],
          wide: true,
        },
        {
          target: 'ts-devolvido',
          title: 'A taxa da maquininha volta para você',
          body: `A maquininha cobra uma taxa sobre tudo o que passa nela, inclusive sobre a taxa de serviço.<br>Para você não pagar por isso, a plataforma devolve ${PCT(T.devolucaoMaquininha)}.`,
          calc: [
            { l: 'Taxas pagas na maquininha', v: mq.taxas },
            { op: '×', l: PCT(T.devolucaoMaquininha), txt: PCT(T.devolucaoMaquininha) },
            { op: '=', l: 'Devolvido para você', v: f.devolucao, total: true },
          ],
        },
        {
          target: 'ts-total',
          title: 'Resumindo a taxa de serviço',
          body: 'Você só repassa para a plataforma a taxa que o cliente pagou. Ela <b>não sai</b> do valor dos seus produtos.',
          calc: [
            { l: 'Paga online (entrou na fatura)', v: on.taxas },
            { op: '+', l: 'Paga no seu caixa', v: taxasCaixa },
            { op: '−', l: 'Devolvido da maquininha', v: f.devolucao },
            { op: '=', l: 'Taxa de serviço', v: f.taxaServico, total: true },
          ],
          wide: true,
          countUp: true,
        },
        Object.assign({ state: S('financeiro', ['fatura']) }, mensalidadeStep),
        {
          target: 'fl-cobrancas',
          title: 'Todas as deduções',
          body: 'Todas saem do valor que passou pela plataforma, ou seja, do pagamento online.',
          calc: cobrancasCalc,
          wide: true,
        },
        {
          state: S('financeiro', [], { sidebar: true }),
          target: 'nav-cardapio',
          pad: 4,
          title: 'Você pode ajustar seus preços',
          body: 'Fique tranquilo: você pode ajustar o valor dos seus produtos para não absorver o custo da comissão e das taxas.<br>Confira se o seu cardápio já está atualizado. Se não estiver, fale com o nosso suporte para atualizar.',
        },
      ],
      resumo: [
        'Taxa de serviço: paga pelo cliente, é da plataforma.',
        'No online, ela entra e sai da fatura. No dinheiro e na maquininha, ficou no seu caixa e é deduzida.',
        `Mensalidade: ${valorMens}, só quando a loja atinge o faturamento mínimo (${limite} em Total Bruto).`,
        'Você pode ajustar os preços do seu cardápio para não absorver esses custos.',
      ],
    };

    /* 9 ------------------------------------------------------------------ */
    const pago = { antecipada: true, repassado: true };
    const m9 = {
      n: 9,
      titulo: 'Repasse e antecipação',
      icone: 'foguete',
      desc: 'Por que o repasse parece menor, como receber antes e o comprovante.',
      intro: 'Vamos fechar a conta, aprender a receber o repasse antes e onde pegar o comprovante.',
      aprender: ['Como o repasse é formado', 'Por que ele parece pequeno', 'Como pedir a antecipação', 'Onde pegar o comprovante'],
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-total',
          title: 'O repasse',
          body: 'É o que será repassado para você depois das deduções.',
          calc: [
            { l: 'Total que passou pela plataforma', v: f.creditos },
            { op: '−', l: 'Deduções', v: f.cobrancas },
            { op: '=', l: 'Repasse', v: f.total, total: true },
          ],
          countUp: true,
        },
        {
          target: 'fl-total',
          title: 'Por que o repasse parece pequeno?',
          fala: [
            `Você vendeu ${F(d.totalBruto)}, mas o repasse é ${F(f.total)}.`,
            `Isso acontece porque as deduções de todas as vendas saem só dos ${F(plataforma)} que passaram pela plataforma.`,
            `Os outros ${F(caixa)}, das vendas em dinheiro e maquininha, já estão no seu caixa.`,
          ],
          body: `Você vendeu ${b(d.totalBruto)}, mas o repasse é ${b(f.total)}.<br>Isso acontece porque as deduções de <b>todas</b> as vendas saem <b>só</b> do valor que passou pela plataforma.`,
          calc: [
            { l: 'Pagamento online (pela plataforma)', v: plataforma },
            { l: 'Dinheiro + maquininha (no seu caixa)', v: caixa },
          ],
          wide: true,
        },
        {
          target: 'fl-total',
          title: 'A plataforma não ficou com o seu dinheiro',
          body: 'O valor das vendas em dinheiro e maquininha já estava com você. Somando com o repasse, você chega ao Resultado.',
          calc: [
            { l: 'Já no seu caixa', v: caixa },
            { op: '+', l: 'Repasse', v: f.total },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
          wide: true,
        },
        {
          target: 'btn-antecipar',
          mode: 'click',
          title: 'Receba antes: antecipação',
          body: 'O sistema não faz repasses automáticos durante o mês: para receber antes, é preciso solicitar a antecipação.<br>Clique em <b>Solicitar antecipação</b>.',
          hint: 'Clique em Solicitar antecipação',
        },
        {
          state: S('financeiro', ['fatura', 'antecipacao']),
          target: 'ant-box',
          title: 'Valor a receber',
          body: `É o valor do repasse: ${b(f.total)}, das vendas de ${f.inicio} até ${f.fim}.`,
        },
        {
          target: 'ant-data',
          title: 'Quando o dinheiro cai',
          body: `A transferência acontece no próximo dia útil (${d.sc.antecipacaoData}), na sua chave PIX.<br>Confira se os seus dados bancários estão certos.`,
          foot: 'Dica: você pode antecipar seu saldo positivo sempre que quiser. Não há repasses em fins de semana nem em feriados nacionais ou municipais de Rio Pomba - MG.',
        },
        {
          target: 'ant-aviso',
          title: 'Atenção',
          body: 'Depois de confirmar, os pedidos desse período <b>não podem mais ser cancelados</b>.',
        },
        {
          target: 'btn-confirmar',
          mode: 'click',
          pad: 6,
          title: 'Confirme a antecipação',
          body: 'Clique em <b>CONFIRMAR</b>.<br>No treinamento, nenhum valor é enviado de verdade.',
          hint: 'Clique em CONFIRMAR',
        },
        {
          state: S('financeiro', ['fatura'], { antecipada: true }),
          target: 'fa-status',
          pad: 6,
          title: 'Fatura antecipada',
          body: 'A fatura mudou para <b>ANTECIPADA</b>: o repasse foi solicitado.',
        },
        {
          state: S('financeiro', ['fatura'], pago),
          target: 'fa-repasse-realizado',
          title: 'Repasse realizado',
          body: `No dia da transferência (${d.sc.antecipacaoData}), aparece aqui <b>Repasse realizado</b>, no mesmo lugar onde você pediu a antecipação.<br>No repasse mensal, é igual.`,
        },
        {
          target: 'btn-comprovante',
          mode: 'click',
          pad: 6,
          title: 'Pegue o comprovante',
          body: 'O comprovante da transferência fica aqui.<br>Clique em <b>Ver comprovante</b>.',
          hint: 'Clique em Ver comprovante',
        },
        {
          state: S('financeiro', [], pago),
          target: 'fin-repasses',
          title: 'O valor foi para Repasses recebidos',
          body: `Quando o repasse cai na sua conta, o valor sai de <b>Repasse disponível</b> e vai para <b>Repasses recebidos</b>: ${b(f.total)}.`,
          countUp: true,
        },
        {
          target: 'fin-res',
          title: 'O Resultado não muda',
          body: 'O dinheiro só mudou de lugar.',
          calc: [
            { l: 'Recebido pela Loja', v: r.recebidoLoja },
            { op: '+', l: 'Repasses recebidos', v: f.total },
            { op: '+', l: 'Repasse disponível', v: 0 },
            { op: '=', l: 'Resultado', v: r.resultado, total: true },
          ],
        },
        {
          target: 'fin-disponivel',
          title: 'Cuidado ao antecipar tudo',
          body:
            'A mensalidade é deduzida na virada do último dia do mês. Se você antecipou todas as faturas, normalmente não sobra saldo online.<br>Aí ela entra na próxima fatura como <b>Débitos remanescentes</b>.' +
            (f.debitoRemanescente ? '<br>Foi o que aconteceu no mês passado.' : ''),
        },
      ],
      resumo: [
        'Repasse = o que passou pela plataforma − as deduções.',
        'Ele parece pequeno porque o valor das vendas em dinheiro e maquininha já estava com você.',
        'Com a antecipação, você recebe o repasse antes.',
        'O comprovante fica na fatura, em Repasse realizado.',
        'Antecipar tudo pode deixar a mensalidade sem saldo: ela vira débito remanescente.',
      ],
    };

    /* Assuntos das perguntas (usados no painel admin para ver o que não foi entendido) */
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
    const perguntas = [
      {
        tema: TEMA.bruto,
        state: S('relatorio'),
        target: 'rp-bruto',
        q: 'Quanto a loja vendeu no mês, somando tudo?',
        options: [{ t: F(f.total) }, { t: F(d.totalBruto), ok: true }, { t: F(r.recebidoLoja) }],
        ok: 'O Total Bruto é a soma de todas as vendas.',
        no: 'Ainda não. Olhe o valor destacado: é o Total Bruto.',
      },
      {
        tema: TEMA.bruto,
        state: S('relatorio', ['totalBruto']),
        target: 'tb-list',
        q: 'Quantas vendas foram pagas na maquininha?',
        options: nums.map((x) => ({ t: pl(x, 'venda', 'vendas'), ok: x === mq.n })),
        ok: `${pl(mq.n, 'venda foi paga', 'vendas foram pagas')} com maquininha de cartão.`,
        no: 'Quase! Procure o bloco "Total pago com maquininha de cartão".',
      },
      {
        tema: TEMA.comissao,
        state: S('financeiro', ['fatura']),
        target: 'fl-comissao',
        q: 'A comissão é calculada sobre quais vendas?',
        options: [
          { t: 'Só as vendas online' },
          { t: 'Todas as vendas, sem a taxa de serviço', ok: true },
          { t: 'Só as vendas em dinheiro' },
        ],
        ok: 'Online, dinheiro e maquininha entram na conta.',
        no: 'Quase! Lembre: todas as vendas entram na conta da comissão.',
      },
      {
        tema: TEMA.cancelados,
        state: S('financeiro', ['fatura', 'comissao']),
        target: 'cm-canceladas',
        q: 'Por que essa venda cancelada entrou na comissão?',
        options: [
          { t: 'Porque o cliente desistiu do pedido' },
          { t: 'Porque foi paga em dinheiro' },
          { t: 'Porque o pedido não foi aceito nem recusado em 15 minutos', ok: true },
        ],
        ok: 'Aceite ou recuse cada pedido a tempo na tela Pedidos.',
        no: 'Ainda não. Lembre do prazo para aceitar ou recusar um pedido.',
      },
      {
        tema: TEMA.mensalidade,
        state: S('financeiro', ['fatura']),
        target: 'fl-cobrancas',
        q: 'Quando existe mensalidade?',
        options: [
          { t: 'Todo mês, sempre' },
          { t: `Quando a loja atinge o faturamento mínimo (${limite} em Total Bruto)`, ok: true },
          { t: 'Só quando há vendas em dinheiro' },
        ],
        ok: `A mensalidade é de ${valorMens}, separada da comissão.`,
        no: 'Ainda não. A mensalidade depende do Total Bruto do mês.',
      },
      {
        tema: TEMA.online,
        target: 'fl-total',
        q: `O repasse foi de ${F(f.total)}. Por que ele é menor que o total vendido?`,
        options: [
          { t: 'Porque a plataforma ficou com quase tudo' },
          { t: 'Porque o valor das vendas em dinheiro e maquininha já estava com você, e as deduções saem do valor online', ok: true },
          { t: 'Porque houve um erro na conta' },
        ],
        ok: `${F(caixa)} já estavam no seu caixa.`,
        no: 'Pense: por onde passou o dinheiro das vendas em dinheiro e maquininha?',
        wide: true,
      },
      {
        tema: TEMA.mensalidade,
        target: 'fl-cobrancas',
        q: 'O que acontece quando o saldo online não cobre as deduções?',
        options: [
          { t: 'Sou obrigado a pagar o boleto na hora' },
          { t: 'A diferença vai para a próxima fatura como Débitos remanescentes, mas posso pagar o boleto também', ok: true },
          { t: 'A diferença é perdoada' },
        ],
        ok: 'Ela aparece na próxima fatura, como primeira dedução.',
        no: 'Ainda não. Lembre do início das deduções na fatura.',
      },
      {
        tema: TEMA.repasse,
        state: S('financeiro'),
        target: 'fin-boxes',
        q: 'Depois de antecipar, quando o dinheiro cai, para onde vai o valor do repasse?',
        options: [{ t: 'Repasse disponível' }, { t: 'Repasses recebidos', ok: true }, { t: 'Recebido pela Loja' }],
        ok: 'Ele sai de Repasse disponível e vai para Repasses recebidos.',
        no: 'Ainda não. Lembre do que aconteceu depois do CONFIRMAR.',
      },
      {
        tema: TEMA.financeiro,
        target: 'fin-resultado',
        q: 'Qual é o Resultado da loja no mês?',
        options: [{ t: F(d.totalBruto) }, { t: F(r.resultado), ok: true }, { t: F(f.total) }],
        ok: 'Recebido pela Loja + repasses = Resultado.',
        no: 'Ainda não. O Resultado está em destaque na tela.',
      },
      {
        tema: TEMA.repasse,
        state: S('financeiro', ['fatura'], pago),
        target: 'fa-repasse-realizado',
        q: 'Onde você pega o comprovante do repasse?',
        options: [
          { t: 'Na tela Relatório' },
          { t: 'Na fatura, em Ver comprovante', ok: true },
          { t: 'Em Boletos' },
        ],
        ok: 'Fica no mesmo lugar onde você pede a antecipação.',
        no: 'Ainda não. Lembre de onde apareceu Repasse realizado.',
      },
    ];
    const m10 = {
      n: 10,
      titulo: 'Exercício final',
      icone: 'trofeu',
      desc: 'Teste o que você aprendeu.',
      intro: 'Hora de praticar. Responda olhando para a tela.',
      aprender: [`${perguntas.length} perguntas rápidas`, 'Sem pressa: você pode tentar de novo'],
      steps: perguntas.map((p, i) => Object.assign({ mode: 'quiz', title: `Pergunta ${i + 1}` }, p)),
      resumo: [
        'Você sabe onde ver o total vendido.',
        'Você sabe separar online, dinheiro e maquininha.',
        'Você sabe ler a fatura, pedir a antecipação e pegar o comprovante.',
      ],
    };

    /* Desafio rápido: uma pergunta de revisão no fim dos módulos 1 a 9 */
    const desafio = (tema, state, target, q, options, ok) => ({ tema, state, target, mode: 'quiz', desafio: true, title: 'Desafio rápido', q, options, ok, no: 'Quase! Pense no que você acabou de ver.' });
    const DESAFIOS = {
      1: desafio(TEMA.bruto, S('relatorio'), 'rp-bruto', 'O Total Bruto é…', [{ t: 'Só o que foi pago online' }, { t: 'A soma de todas as vendas do mês', ok: true }, { t: 'O valor que vai cair na sua conta' }], 'O Total Bruto junta todas as formas de pagamento.'),
      2: desafio(TEMA.online, S('relatorio', ['totalBruto']), 'tb-online', 'Do valor do pagamento online, a plataforma deduz…', [{ t: 'Só a comissão das vendas online' }, { t: 'Nada: o valor vai inteiro para você' }, { t: 'A comissão e as taxas de todas as vendas', ok: true }], 'Por isso o repasse é menor que o valor online.'),
      3: desafio(TEMA.bruto, S('relatorio', ['totalBruto']), 'tb-list', 'Uma venda paga em dinheiro…', [{ t: 'Entra direto no seu caixa', ok: true }, { t: 'Passa pela plataforma antes de chegar a você' }, { t: 'Não conta como venda' }], 'E o valor da maquininha cai direto na conta dela.'),
      4: desafio(TEMA.financeiro, S('financeiro'), 'fin-boxes', 'Antes de antecipar, onde aparece o valor que a plataforma vai transferir?', [{ t: 'Repasses recebidos' }, { t: 'Repasse disponível', ok: true }, { t: 'Recebido pela Loja' }], 'Ele vira "Repasses recebidos" quando é transferido.'),
      5: desafio(TEMA.cupons, S('financeiro', ['fatura']), 'fl-incentivos', 'Quem paga o desconto de um cupom oferecido pelo Bigou para os clientes?', [{ t: 'Você' }, { t: 'O cliente, depois' }, { t: 'A plataforma, que devolve o valor na fatura', ok: true }], 'Ele volta como "Reembolso dos incentivos".'),
      6: desafio(TEMA.cancelados, S('pedidos'), 'pd-aguardando', 'Um pedido ficou 15 minutos sem ser aceito nem recusado. O que acontece?', [{ t: 'Ele continua esperando até você abrir' }, { t: 'Ele é cancelado e entra na conta da comissão', ok: true }, { t: 'Ele é aceito automaticamente' }], 'Por isso, aceite ou recuse cada pedido a tempo.'),
      7: desafio(TEMA.taxas, S('financeiro', ['fatura']), 'fl-antecipacao', 'Quando a taxa de antecipação é aplicada?', [{ t: 'Só se você pedir a antecipação', ok: true }, { t: 'Em todas as faturas' }, { t: 'Só nas vendas em dinheiro' }], 'Sem antecipar, ela não é cobrada.'),
      8: desafio(TEMA.servico, S('financeiro', ['fatura', 'taxaServico']), 'ts-offline', 'Por que a taxa de serviço das vendas em dinheiro aparece como dedução?', [{ t: 'Porque é uma multa' }, { t: 'Porque o cliente pagou a taxa para você, e ela é da plataforma', ok: true }, { t: 'Porque a comissão foi cobrada duas vezes' }], 'Você só repassa o que o cliente pagou para a plataforma.'),
      9: desafio(TEMA.repasse, S('financeiro', [], pago), 'fin-disponivel', 'Se você não antecipar, quando a plataforma transfere o repasse?', [{ t: 'Todos os dias' }, { t: 'Só quando você pedir' }, { t: 'No 2º dia útil do mês seguinte às vendas', ok: true }], 'Antecipar é opcional: sem pedir, o repasse chega no mês seguinte.'),
    };

    const mods = [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10];
    mods.forEach((m) => { if (DESAFIOS[m.n]) m.steps.push(DESAFIOS[m.n]); });
    mods.forEach((m) => m.steps.forEach((s) => { s.kicker = s.desafio ? 'Desafio rápido' : m.titulo; }));
    return mods;
  };

  /* Revisão final: um lembrete curto por assunto, com os números da loja */
  TREINO.buildReview = function (d) {
    const f = d.f, r = d.r, p = d.pay, T = TREINO.config.taxas, MS = TREINO.config.mensalidade;
    const pc = (x) => String(Math.round(x * 10000) / 100).replace('.', ',') + '%';
    return [
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
    ];
  };
})();
