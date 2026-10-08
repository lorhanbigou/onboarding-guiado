/* =========================================================================
   LÓGICA DE CÁLCULO — reproduz exatamente a tela Financeiro / Relatório.
   Todos os valores são calculados em centavos (inteiros) para não haver
   erro de arredondamento.
   ========================================================================= */
(function () {
  const C = (v) => Math.round(v * 100);
  const pct = (base, p) => Math.round(base * p + 1e-9);

  TREINO.fmt = function (c) {
    const neg = c < 0;
    c = Math.abs(Math.round(c));
    const reais = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + 'R$' + reais + ',' + String(c % 100).padStart(2, '0');
  };

  TREINO.pl = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  function soma(lista) {
    return lista.reduce(
      (a, o) => {
        a.n++;
        a.itens += o.itens;
        a.taxas += o.taxa;
        a.nTaxas += o.taxa > 0 ? 1 : 0;
        a.cupons += o.cupom;
        a.nCupons += o.cupom > 0 ? 1 : 0;
        a.bruto += o.bruto;
        a.liquido += o.liquido;
        return a;
      },
      { n: 0, itens: 0, taxas: 0, nTaxas: 0, cupons: 0, nCupons: 0, bruto: 0, liquido: 0 }
    );
  }

  TREINO.calc = function (sc, opts) {
    const T = TREINO.config.taxas;
    const antecipada = !!(opts && opts.antecipada);

    // Pedido: Valor Bruto = produtos + taxa de serviço; Valor Líquido = Bruto − cupom do Bigou
    const norm = (o) => {
      const itens = C(o.itens), taxa = C(o.taxa), cupom = C(o.cupom);
      return Object.assign({}, o, { itens, taxa, cupom, bruto: itens + taxa, liquido: itens + taxa - cupom });
    };
    const orders = sc.orders.map(norm);
    // Cancelados por tempo: fora das vendas (a loja não recebe), mas dentro da comissão
    const cancelados = (sc.canceladosPorTempo || []).map(norm);
    const canc = soma(cancelados);

    const pay = {
      online: soma(orders.filter((o) => o.pag === 'online')),
      dinheiro: soma(orders.filter((o) => o.pag === 'dinheiro')),
      maquininha: soma(orders.filter((o) => o.pag === 'maquininha')),
    };
    const all = soma(orders);
    const on = pay.online, mq = pay.maquininha;

    /* ---------- Fatura: "Cálculo do Repasse ou Boleto" ---------- */
    const f = {};
    f.inicio = sc.fatura.inicio;
    f.fim = sc.fatura.fim;
    f.status = antecipada ? 'ANTECIPADA' : sc.fatura.status;
    f.antecipada = antecipada;

    // Créditos
    f.nOnline = on.n;
    f.liquidoOnline = on.itens - on.cupons;          // Valor líquido das vendas online (sem a taxa de serviço)
    f.reembolso = all.cupons;                         // Reembolso dos incentivos (cupons de todas as vendas)
    f.nReembolso = all.nCupons;
    f.taxasOnline = on.taxas;                         // Taxas de serviço pagas online pelo cliente
    f.nTaxasOnline = on.nTaxas;

    // Cobranças
    f.brutoTotal = all.bruto;
    f.brutoComissao = all.bruto + canc.bruto;
    f.nComissao = all.n + canc.n;
    f.baseComissao = all.bruto - all.taxas + canc.bruto - canc.taxas;
    f.comissao = pct(f.baseComissao, T.comissao);

    f.brutoOnline = on.bruto;
    f.baseOnline = on.bruto - on.taxas;
    f.taxaOnline = pct(f.baseOnline, T.pagamentoOnline);

    f.transferencia = C(T.transferencia);

    // Taxa de antecipação: 1,99% do total bruto das vendas online (já descontada no valor exibido)
    f.taxaAntecipacao = pct(on.bruto, T.antecipacao);

    f.taxasTotal = all.taxas;
    f.devolucao = pct(mq.taxas, T.devolucaoMaquininha);
    f.taxaServico = all.taxas - f.devolucao;          // Valor repassado para a plataforma

    // Mensalidade: só quando o Total Bruto do mês passa do limite
    const MS = TREINO.config.mensalidade;
    f.mensalidade = all.bruto > C(MS.acimaDeBruto) ? C(MS.valor) : 0;

    // Débitos remanescentes: deduções de faturas anteriores que o saldo online não cobriu
    f.debitoRemanescente = C(sc.debitoRemanescente || 0);

    f.creditos = f.liquidoOnline + f.reembolso + f.taxasOnline;
    f.cobrancas = f.debitoRemanescente + f.comissao + f.taxaOnline + f.transferencia + f.taxaAntecipacao + f.taxaServico + f.mensalidade;
    f.total = f.creditos - f.cobrancas;
    f.tipo = f.total >= 0 ? 'Repasse' : 'Boleto';

    /* ---------- Faturamento do Mês ---------- */
    const r = {};
    r.recebidoLoja = pay.dinheiro.liquido + pay.maquininha.liquido;
    r.repassesRecebidos = f.status === 'ANTECIPADA' && f.total > 0 ? f.total : 0;
    r.repasseDisponivel = f.status === 'VIGENTE' && f.total > 0 ? f.total : 0;
    // Saldo online insuficiente: não gera boleto, vai para a próxima fatura como débito remanescente
    r.debitoProximoMes = f.total < 0 ? -f.total : 0;
    r.resultado = r.recebidoLoja + r.repassesRecebidos + r.repasseDisponivel - r.debitoProximoMes;
    r.plataforma = all.bruto - r.recebidoLoja;      // o que passou pela plataforma (online + cupons do Bigou)

    if (r.resultado !== all.bruto - f.cobrancas) {
      console.warn('[treinamento] conferência da conta falhou');
    }

    return {
      sc, orders, pay, all, f, r, cancelados, canc,
      n: all.n,
      totalBruto: all.bruto,
      totalLiquido: all.liquido,
      incentivos: all.cupons,
      nIncentivos: all.nCupons,
    };
  };
})();
