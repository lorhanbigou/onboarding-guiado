/* =========================================================================
   MÓDULOS DO TREINAMENTO
   Curva: Relatório → formas de pagamento → Financeiro → fatura (entradas,
   depois deduções) → repasse e antecipação → exercício final.
   Os módulos 1 a 8 terminam com um "Desafio rápido" (uma pergunta).

   Cada passo define:
     state   → como a tela deve estar (página, modais abertos, antecipada)
     target  → elemento destacado pelo spotlight (data-tour)
     mode    → 'next' (padrão) | 'click' (o parceiro clica) | 'quiz'
   Todos os números vêm de TREINO.calc — nunca são digitados à mão.
   ========================================================================= */
(function () {
  const F = TREINO.fmt;
  const pl = TREINO.pl;
  const b = (c) => `<b class="tm">${F(c)}</b>`;
  const S = (page, modals, extra) => Object.assign({ page, modals: modals || [], antecipada: false }, extra || {});
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
          body: '<b>Todas são vendas. Mas o valor chegou por caminhos diferentes.</b>',
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
          body: `É tudo o que ficou com você no mês: ${b(r.resultado)}.<br>Ele é a soma dos 3 quadros ao lado.`,
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
          body: `É o valor disponível para repasse: ${b(r.repasseDisponivel)}. Se você não antecipar, a plataforma transfere no 2º dia útil do mês seguinte às suas vendas.<br>Esse é o valor das vendas online, após a dedução da comissão e das taxas.`,
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
          body: 'Em <b>Repasses</b>, ficam as transferências feitas para você.<br>Em <b>Boletos</b>, pode aparecer um boleto quando o saldo online não cobre a comissão e as taxas. Não se preocupe: o valor passa para o mês seguinte como Débitos remanescentes.',
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
          body: `Em algumas vendas, foram utilizados cupons do Bigou. Quando o Bigou oferece o cupom, quem paga esse desconto é a plataforma, não você.<br>Aqui ela devolve esse valor: ${b(f.reembolso)}.`,
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
      foot: 'Dica: o boleto só deve ser considerado se a loja ficar três meses seguidos sem saldo suficiente no pagamento online.',
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
      titulo: 'Fatura: comissão e taxas',
      desc: 'O que sai do pagamento online, parte 1.',
      icone: 'faturaSai',
      intro: 'Agora, as deduções. Todas saem do valor online que passou pela plataforma, ou seja, do pagamento online.',
      aprender: ['Os débitos remanescentes', 'A comissão', 'A taxa do pagamento online', 'As taxas de transferência e de antecipação'],
      steps: [
        Object.assign({ state: S('financeiro', ['fatura']) }, debitosStep),
        {
          target: 'fl-comissao',
          title: 'Comissão',
          body: `É a parte da plataforma pelas vendas feitas pelo aplicativo: ${b(f.comissao)}.<br>Ela vale para <b>todas</b> as vendas: online, dinheiro e maquininha.`,
          foot: 'Dica: aceite ou recuse cada pedido em até 15 minutos. Depois disso, ele é cancelado automaticamente e entra no cálculo da sua comissão.',
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
          body: `A conta começa com as <b>${d.n} vendas</b> do mês, de todas as formas de pagamento: ${b(d.totalBruto)}.`,
          countUp: true,
        },
        {
          target: 'cm-taxa',
          title: 'A taxa de serviço sai da conta',
          body: 'A comissão <b>não</b> considera o valor da taxa de serviço, porque ela foi paga pelo cliente e é da plataforma.',
        },
        {
          target: 'cm-comissao',
          title: `A comissão é ${PCT(T.comissao)}`,
          body: 'Sobra o valor dos produtos vendidos. A comissão é uma parte desse valor.',
          calc: [
            { l: 'Base de cálculo', v: f.baseComissao },
            { op: '×', l: PCT(T.comissao), txt: PCT(T.comissao) },
            { op: '=', l: 'Comissão', v: f.comissao, total: true },
          ],
          countUp: true,
        },
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
          body: `${b(f.transferencia)}. É referente a despesas bancárias.<br>Cobrada uma única vez no dia do repasse mensal ou toda vez que você antecipar.`,
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
        'Débitos remanescentes: deduções que ficaram sem saldo online em uma fatura anterior.',
        `Comissão: ${PCT(T.comissao)} do valor dos produtos de todas as vendas.`,
        `Taxa do pagamento online: ${PCT(T.pagamentoOnline)}, só das vendas online.`,
        `Taxa de transferência: ${F(f.transferencia)}, de despesas bancárias.`,
        `Taxa de antecipação: ${PCT(T.antecipacao)} das vendas online, só se você antecipar.`,
      ],
    };

    /* 7 ------------------------------------------------------------------ */
    const m7 = {
      n: 7,
      titulo: 'Fatura: taxa de serviço e mensalidade',
      desc: 'O que sai do pagamento online, parte 2.',
      icone: 'moedas',
      intro: 'Vamos ver as últimas deduções da fatura e fechar a conta delas.',
      aprender: ['A taxa de serviço', 'A mensalidade', 'O total das deduções', 'Como não absorver esses custos'],
      steps: [
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-taxa-servico-info',
          mode: 'click',
          pad: 6,
          title: 'Taxa de serviço',
          body: 'É a soma das taxas de serviço pagas pelos clientes. Clique no <b>ⓘ</b> para ver a conta.',
          hint: 'Clique no ⓘ destacado',
        },
        {
          state: S('financeiro', ['fatura', 'taxaServico']),
          target: 'ts-rows',
          title: 'Uma taxa em cada pedido',
          body: `O cliente paga ${taxaTxt}, em qualquer forma de pagamento. Esse valor é da plataforma.`,
        },
        {
          target: 'ts-offline',
          title: 'No dinheiro e na maquininha',
          body: 'Nessas vendas, foi <b>você</b> quem recebeu a taxa junto com o pagamento.<br>Por isso, ela é deduzida aqui, no saldo online.',
        },
        {
          target: 'ts-devolvido',
          title: 'Um valor devolvido',
          body: `A maquininha tem uma taxa sobre tudo o que passa nela, inclusive sobre a taxa de serviço. Por isso, a plataforma devolve ${PCT(T.devolucaoMaquininha)}, o mesmo percentual do pagamento online.`,
          calc: [
            { l: 'Taxas pagas na maquininha', v: mq.taxas },
            { op: '×', l: PCT(T.devolucaoMaquininha), txt: PCT(T.devolucaoMaquininha) },
            { op: '=', l: 'Valor devolvido para você', v: f.devolucao, total: true },
          ],
        },
        {
          target: 'ts-total',
          title: 'Valor repassado para a plataforma',
          body: `${b(f.taxaServico)}. Foi pago pelos <b>clientes</b>. Não sai do valor dos seus produtos.`,
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
        'Taxa de serviço: paga pelos clientes, vai para a plataforma.',
        `Mensalidade: ${valorMens}, só quando a loja atinge o faturamento mínimo (${limite} em Total Bruto).`,
        'Você pode ajustar os preços do seu cardápio para não absorver esses custos.',
      ],
    };

    /* 8 ------------------------------------------------------------------ */
    const m8 = {
      n: 8,
      titulo: 'Repasse e antecipação',
      icone: 'foguete',
      desc: 'Por que o repasse parece menor e como receber antes.',
      intro: 'Vamos fechar a conta e aprender a receber o repasse antes.',
      aprender: ['Como o repasse é formado', 'Por que ele parece pequeno', 'Como pedir a antecipação'],
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
          state: S('financeiro', [], { antecipada: true }),
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
        'Depois que cai, o valor aparece em Repasses recebidos.',
        'Antecipar tudo pode deixar a mensalidade sem saldo: ela vira débito remanescente.',
      ],
    };

    /* 8 ------------------------------------------------------------------ */
    const nums = [mq.n, on.n, d.n].sort((a, c) => a - c);
    const m9 = {
      n: 9,
      titulo: 'Exercício final',
      icone: 'trofeu',
      desc: 'Teste o que você aprendeu.',
      intro: 'Hora de praticar. Responda olhando para a tela.',
      aprender: ['9 perguntas rápidas', 'Sem pressa: você pode tentar de novo'],
      steps: [
        {
          state: S('relatorio'),
          target: 'rp-bruto',
          mode: 'quiz',
          title: 'Pergunta 1',
          q: 'Quanto a loja vendeu no mês, somando tudo?',
          options: [{ t: F(f.total) }, { t: F(d.totalBruto), ok: true }, { t: F(r.recebidoLoja) }],
          ok: 'O Total Bruto é a soma de todas as vendas.',
          no: 'Ainda não. Olhe o valor destacado: é o Total Bruto.',
        },
        {
          state: S('relatorio', ['totalBruto']),
          target: 'tb-list',
          mode: 'quiz',
          title: 'Pergunta 2',
          q: 'Quantas vendas foram pagas na maquininha?',
          options: nums.map((x) => ({ t: pl(x, 'venda', 'vendas'), ok: x === mq.n })),
          ok: `${pl(mq.n, 'venda foi paga', 'vendas foram pagas')} com maquininha de cartão.`,
          no: 'Quase! Procure o bloco "Total pago com maquininha de cartão".',
        },
        {
          state: S('financeiro'),
          target: 'fin-recebido',
          mode: 'quiz',
          title: 'Pergunta 3',
          q: 'O que é o valor "Recebido pela Loja"?',
          options: [
            { t: 'O que a plataforma transferiu para você' },
            { t: 'O dinheiro das vendas em dinheiro e maquininha, que já está no seu caixa', ok: true },
            { t: 'Uma dedução da plataforma' },
          ],
          ok: 'Esse dinheiro entrou direto no seu caixa.',
          no: 'Ainda não. Pense: quem pagou esse valor e para quem?',
        },
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-comissao',
          mode: 'quiz',
          title: 'Pergunta 4',
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
          target: 'fl-cobrancas',
          mode: 'quiz',
          title: 'Pergunta 5',
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
          target: 'fl-total',
          mode: 'quiz',
          title: 'Pergunta 6',
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
          state: S('financeiro'),
          target: 'fin-boxes',
          mode: 'quiz',
          title: 'Pergunta 7',
          q: 'Depois de antecipar, quando o dinheiro cai, para onde vai o valor do repasse?',
          options: [{ t: 'Repasse disponível' }, { t: 'Repasses recebidos', ok: true }, { t: 'Recebido pela Loja' }],
          ok: 'Ele sai de Repasse disponível e vai para Repasses recebidos.',
          no: 'Ainda não. Lembre do que aconteceu depois do CONFIRMAR.',
        },
        {
          target: 'fin-resultado',
          mode: 'quiz',
          title: 'Pergunta 8',
          q: 'Qual é o Resultado da loja no mês?',
          options: [{ t: F(d.totalBruto) }, { t: F(r.resultado), ok: true }, { t: F(f.total) }],
          ok: 'Recebido pela Loja + repasses = Resultado.',
          no: 'Ainda não. O Resultado está em destaque na tela.',
        },
        {
          state: S('financeiro', ['fatura']),
          target: 'fl-cobrancas',
          mode: 'quiz',
          title: 'Pergunta 9',
          q: 'O que acontece quando o saldo online não cobre as deduções?',
          options: [
            { t: 'Você precisa pagar um boleto na hora' },
            { t: 'A diferença vai para a próxima fatura como Débitos remanescentes', ok: true },
            { t: 'A diferença é perdoada' },
          ],
          ok: 'Ela aparece na próxima fatura, como primeira dedução.',
          no: 'Ainda não. Lembre do início das deduções na fatura.',
        },
      ],
      resumo: [
        'Você sabe onde ver o total vendido.',
        'Você sabe separar online, dinheiro e maquininha.',
        'Você sabe ler a fatura e pedir a antecipação.',
      ],
    };

    /* Desafio rápido: uma pergunta de revisão no fim dos módulos 1 a 8 */
    const desafio = (state, target, q, options, ok) => ({ state, target, mode: 'quiz', desafio: true, title: 'Desafio rápido', q, options, ok, no: 'Quase! Pense no que você acabou de ver.' });
    const DESAFIOS = {
      1: desafio(S('relatorio'), 'rp-bruto', 'O Total Bruto é…', [{ t: 'Só o que foi pago online' }, { t: 'A soma de todas as vendas do mês', ok: true }, { t: 'O valor que vai cair na sua conta' }], 'O Total Bruto junta todas as formas de pagamento.'),
      2: desafio(S('relatorio', ['totalBruto']), 'tb-online', 'Do valor do pagamento online, a plataforma deduz…', [{ t: 'Só a comissão das vendas online' }, { t: 'Nada: o valor vai inteiro para você' }, { t: 'A comissão e as taxas de todas as vendas', ok: true }], 'Por isso o repasse é menor que o valor online.'),
      3: desafio(S('relatorio', ['totalBruto']), 'tb-list', 'Uma venda paga em dinheiro…', [{ t: 'Entra direto no seu caixa', ok: true }, { t: 'Passa pela plataforma antes de chegar a você' }, { t: 'Não conta como venda' }], 'E a maquininha cai direto na conta da sua maquininha.'),
      4: desafio(S('financeiro'), 'fin-boxes', 'Antes de antecipar, onde aparece o valor que a plataforma vai transferir?', [{ t: 'Repasses recebidos' }, { t: 'Repasse disponível', ok: true }, { t: 'Recebido pela Loja' }], 'Ele vira "Repasses recebidos" quando é transferido.'),
      5: desafio(S('financeiro', ['fatura']), 'fl-incentivos', 'Quem paga o desconto de um cupom do Bigou?', [{ t: 'Você' }, { t: 'O cliente, depois' }, { t: 'A plataforma, que devolve o valor na fatura', ok: true }], 'Ele volta como "Reembolso dos incentivos".'),
      6: desafio(S('financeiro', ['fatura']), 'fl-antecipacao', 'Quando a taxa de antecipação é aplicada?', [{ t: 'Só se você pedir a antecipação', ok: true }, { t: 'Em todas as faturas' }, { t: 'Só nas vendas em dinheiro' }], 'Sem antecipar, ela não é cobrada.'),
      7: desafio(S('financeiro', ['fatura']), 'fl-taxa-servico', 'Quem paga a taxa de serviço?', [{ t: 'Você, com o valor dos seus produtos' }, { t: 'O cliente, em cada pedido', ok: true }, { t: 'Ninguém: é só um valor informativo' }], 'Por isso ela não sai do valor dos seus produtos.'),
      8: desafio(S('financeiro', [], { antecipada: true }), 'fin-disponivel', 'Se você não antecipar, quando a plataforma transfere o repasse?', [{ t: 'Todos os dias' }, { t: 'Só quando você pedir' }, { t: 'No 2º dia útil do mês seguinte às vendas', ok: true }], 'Antecipar é opcional: sem pedir, o repasse chega no mês seguinte.'),
    };

    const mods = [m1, m2, m3, m4, m5, m6, m7, m8, m9];
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
      ['Mensalidade', f.mensalidade ? `${F(f.mensalidade)}, porque a loja atingiu o faturamento mínimo (${F(MS.acimaDeBruto * 100)} em Total Bruto).` : `Não houve: a loja não atingiu o faturamento mínimo (${F(MS.acimaDeBruto * 100)} em Total Bruto).`],
      ['Débitos remanescentes', 'Deduções sem saldo online vão para a próxima fatura, sem boleto.'],
      ['Antecipação', `${F(f.total)} de repasse, que vai para Repasses recebidos quando cai.`],
      ['Resultado final', `${F(r.resultado)} = Recebido pela Loja + repasses.`],
    ];
  };
})();
