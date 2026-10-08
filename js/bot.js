/* =========================================================================
   ASSISTENTE DE DÚVIDAS — mini chat liberado ao concluir o treinamento
   - Sem IA: as respostas são escritas a partir do conteúdo do treinamento e
     escolhidas por palavras-chave (com sinônimos e tolerância a erros de
     digitação). Nunca inventa valores.
   - Cada pergunta vira um evento "duvida" no analytics, para a equipe
     melhorar as telas e as respostas.
   Para criar ou ajustar uma resposta, edite a lista INTENCOES abaixo.
   ========================================================================= */
(function () {
  const F = TREINO.fmt;
  const CFG = TREINO.config;
  const PCT = (p) => String(Math.round(p * 10000) / 100).replace('.', ',') + '%';
  const R$ = (v) => F(Math.round(v * 100));
  const T = CFG.taxas, MS = CFG.mensalidade, TS = CFG.taxaServico;
  const OBS = '<small class="bt-obs">Valores do treinamento. Os da sua loja estão no seu contrato.</small>';

  /* ------------------------------ Base de conhecimento ------------------------------ */
  // k3: expressões bem específicas (peso 3) · k2: (peso 2) · k1: palavras gerais (peso 1)
  // Uma expressão conta quando todas as palavras dela aparecem na pergunta.
  const INTENCOES = [
    {
      id: 'comissao', tema: 'Comissão', rever: 6, exemplo: 'Como funciona a comissão?',
      k3: ['comissao', 'comicao', 'comisao'], k2: ['parte da plataforma', 'porcentagem', 'percentual'], k1: ['cobrada', 'cobram', 'quanto'],
      r: () => `A <b>comissão</b> é a parte da plataforma pelas vendas feitas pelo aplicativo. Ela vale para <b>todas</b> as vendas: online, dinheiro e maquininha.<br>É calculada sobre o valor dos produtos, sem a taxa de serviço. No treinamento usamos <b>${PCT(T.comissao)}</b>.${OBS}`,
      seguintes: ['comissao_conta', 'cancelado', 'repasse_menor'],
    },
    {
      id: 'comissao_conta', tema: 'Comissão', rever: 6, exemplo: 'Onde vejo a conta da comissão?',
      k3: ['conta comissao', 'calculo comissao', 'calcula comissao', 'base calculo', 'calculada comissao'], k2: ['calculo', 'calculada', 'calcula'], k1: ['comissao', 'onde'],
      r: () => 'Abra <b>Financeiro</b>, toque na fatura e depois no <b>ⓘ</b> ao lado de <b>Comissão</b>.<br>Lá aparecem as vendas confirmadas, as canceladas por tempo, a taxa de serviço que sai da conta e a base de cálculo.',
      seguintes: ['cancelado', 'taxa_servico'],
    },
    {
      id: 'cancelado', tema: 'Pedidos cancelados por tempo', rever: 6, exemplo: 'Por que paguei comissão de pedido cancelado?',
      k3: ['cancelado tempo', 'cancelada tempo', 'tempo expirado', '15 minuto', 'quinze minuto', 'expirou', 'cancelou sozinho', 'cancelado automaticamente', 'cancelado sozinho', 'nao aceitei', 'nao aceitar', 'nao aceito', 'esqueci aceitar', 'comissao cancelado', 'comissao cancelada', 'comissao pedido nao entreguei'],
      k2: ['cancelado', 'cancelada', 'cancelamento', 'expirado', 'cancelou'], k1: ['pedido', 'tempo', 'comissao'],
      r: () => 'Quando um pedido <b>não é aceito nem recusado em até 15 minutos</b>, ele é cancelado automaticamente.<br>Você não recebe o valor, mas ele <b>entra no cálculo da comissão</b>.<br>Acompanhe a tela <b>Pedidos</b>. Se não puder atender, <b>recuse dentro do prazo</b>: assim ele não entra na comissão.',
      seguintes: ['aceitar', 'comissao'],
    },
    {
      id: 'aceitar', tema: 'Pedidos cancelados por tempo', rever: 6, exemplo: 'Onde aceito os pedidos?',
      k3: ['aceitar pedido', 'aceito pedido', 'recusar pedido', 'aguardando confirmacao', 'tela pedido', 'pedido novo', 'novo pedido'], k2: ['aceitar', 'recusar', 'recuso', 'aceito'], k1: ['pedido'],
      r: () => 'Os pedidos novos chegam na tela <b>Pedidos</b>, com a etiqueta <b>AGUARDANDO CONFIRMAÇÃO</b>.<br>Abra o pedido para aceitar ou recusar. Você tem até <b>15 minutos</b>.',
      seguintes: ['cancelado', 'pagamento_online'],
    },
    {
      id: 'taxa_servico', tema: 'Taxa de serviço', rever: 8, exemplo: 'O que é a taxa de serviço?',
      k3: ['taxa servico', '0 99', '1 99 pedido'], k2: ['servico'], k1: ['taxa', 'cliente paga', 'deducao'],
      r: () => `A <b>taxa de serviço</b> é paga pelo <b>cliente</b> em cada pedido, além dos produtos: ${R$(TS.normal)}, ou ${R$(TS.maior)} em pedidos acima de ${R$(TS.acimaDe)}. Ela é da plataforma, <b>não é um custo seu</b>.<br>• No pagamento online, ela entra e sai da fatura: para você, fica zero.<br>• No dinheiro e na maquininha, o cliente te pagou a taxa junto com o pedido. Por isso ela é deduzida na fatura: você só repassa o que o cliente pagou.${OBS}`,
      seguintes: ['devolucao', 'comissao'],
    },
    {
      id: 'devolucao', tema: 'Taxa de serviço', rever: 8, exemplo: 'O que é o valor devolvido da maquininha?',
      k3: ['devolvido', 'devolucao', 'taxa maquininha', 'valor devolvido'], k2: ['devolve', 'devolvem'], k1: ['maquininha', 'servico'],
      r: () => `A maquininha cobra uma taxa sobre tudo o que passa nela, inclusive sobre a taxa de serviço.<br>Para você não pagar por isso, a plataforma <b>devolve ${PCT(T.devolucaoMaquininha)}</b> das taxas de serviço pagas na maquininha. Esse valor aparece na conta da Taxa de serviço.${OBS}`,
      seguintes: ['taxa_servico', 'dinheiro_maquininha'],
    },
    {
      id: 'taxas', tema: 'Taxas', rever: 6, exemplo: 'Quais taxas são descontadas?',
      k3: ['quais taxa', 'todas taxa', 'deducoes fatura', 'descontos fatura'], k2: ['taxa', 'deducao'],
      r: () => 'Na fatura, saem do valor do pagamento online:<br>• Débitos remanescentes (se houver)<br>• <b>Comissão</b>, de todas as vendas<br>• <b>Taxa do pagamento online</b>, só das vendas online<br>• <b>Taxa de transferência</b>, despesas bancárias<br>• <b>Taxa de antecipação</b>, só se você antecipar<br>• <b>Taxa de serviço</b>, paga pelo cliente<br>• <b>Mensalidade</b>, quando atinge o faturamento mínimo<br>Pergunte sobre qualquer uma delas.',
      seguintes: ['comissao', 'taxa_servico', 'taxa_online'],
    },
    {
      id: 'taxa_online', tema: 'Taxas', rever: 7, exemplo: 'O que é a taxa do pagamento online?',
      k3: ['taxa pagamento online', 'taxa online', 'taxa app', 'taxa aplicativo'], k2: ['pagamento online'], k1: ['taxa', 'online'],
      r: () => `A <b>taxa do pagamento online</b> vale <b>só</b> para as vendas pagas pelo aplicativo. No treinamento, ${PCT(T.pagamentoOnline)} sobre o valor dessas vendas, sem a taxa de serviço.<br>Para ver a conta: Financeiro → fatura → ⓘ ao lado de Taxa do pagamento online.${OBS}`,
      seguintes: ['transferencia', 'taxa_antecipacao'],
    },
    {
      id: 'transferencia', tema: 'Taxas', rever: 7, exemplo: 'O que é a taxa de transferência?',
      k3: ['taxa transferencia', '2 50', 'despesa bancaria', 'tarifa bancaria'], k2: ['transferencia', 'tarifa'], k1: ['taxa', 'banco'],
      r: () => `A <b>taxa de transferência</b> (${R$(T.transferencia)} no treinamento) é referente a despesas bancárias.<br>É cobrada uma única vez no repasse mensal, ou toda vez que você antecipar.${OBS}`,
      seguintes: ['taxa_antecipacao', 'antecipar'],
    },
    {
      id: 'taxa_antecipacao', tema: 'Taxas', rever: 7, exemplo: 'Quanto custa antecipar?',
      k3: ['taxa antecipacao', 'custa antecipar', 'custo antecipacao', 'custa antecipacao', 'cobra antecipar', 'taxa antecipar'], k1: ['antecipacao', 'antecipar', 'taxa'],
      r: () => `A <b>taxa de antecipação</b> é ${PCT(T.antecipacao)} do total das vendas online, mais a taxa de transferência.<br>Ela já aparece deduzida na fatura, mas <b>só é aplicada se você pedir a antecipação</b>.${OBS}`,
      seguintes: ['antecipar', 'quando_cai'],
    },
    {
      id: 'antecipar', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: 'Como peço a antecipação?',
      k3: ['como antecipar', 'solicitar antecipacao', 'pedir antecipacao', 'adiantar', 'receber antes', 'adiantamento', 'antecipar valor'], k2: ['antecipar', 'antecipacao', 'antecipo'], k1: ['como', 'pedir', 'solicitar'],
      r: () => 'Para receber antes:<ol class="bt-ol"><li>Abra <b>Financeiro</b></li><li>Toque na fatura do mês</li><li>Confira os valores</li><li>Toque em <b>Solicitar antecipação</b> e depois em <b>CONFIRMAR</b></li></ol>O valor cai no <b>próximo dia útil</b>, na sua chave PIX. Depois de confirmar, os pedidos daquele período não podem mais ser cancelados.',
      seguintes: ['taxa_antecipacao', 'quando_cai', 'antecipar_tudo'],
    },
    {
      id: 'antecipar_tudo', tema: 'Mensalidade e débitos', rever: 9, exemplo: 'Posso antecipar tudo?',
      k3: ['antecipar tudo', 'antecipei tudo', 'antecipo tudo', 'todo dia antecipar', 'sempre antecipar'], k1: ['tudo', 'sempre'],
      r: () => 'Pode, sempre que tiver saldo positivo. Só lembre: a <b>mensalidade</b> é deduzida na virada do último dia do mês. Se você antecipou tudo, normalmente não sobra saldo online, e ela vai para a próxima fatura como <b>Débitos remanescentes</b>.',
      seguintes: ['debitos', 'mensalidade'],
    },
    {
      id: 'quando_cai', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: 'Quando cai o meu repasse?',
      k3: ['quando cai', 'quando recebo', 'quando vou receber', 'quando caiu', 'nao caiu', 'dia repasse', 'data repasse', 'dia cai', 'dia pagamento', 'repasse mensal', 'segundo dia util', '2 dia util', 'dia util', 'quanto tempo demora', 'prazo repasse'],
      k2: ['cai', 'caiu', 'demora', 'receber', 'recebo', 'prazo'], k1: ['repasse', 'quando', 'dinheiro'],
      r: () => '• <b>Sem antecipar:</b> o repasse mensal é transferido no <b>2º dia útil do mês seguinte</b> às vendas.<br>• <b>Com antecipação:</b> cai no <b>próximo dia útil</b> depois do pedido.<br>Não há repasses em fins de semana nem em feriados nacionais ou municipais de Rio Pomba - MG. Quando cair, a fatura mostra <b>Repasse realizado</b>.',
      seguintes: ['comprovante', 'antecipar', 'pix'],
    },
    {
      id: 'repasse_menor', tema: 'Pagamento online', rever: 9, exemplo: 'Por que o repasse veio menor?',
      k3: ['repasse menor', 'repasse pequeno', 'veio pouco', 'veio menos', 'veio menor', 'recebi pouco', 'recebi menos', 'valor baixo', 'nao bate', 'menor que vendi', 'menos que vendi', 'sumiu dinheiro', 'ficou com dinheiro'],
      k2: ['menor', 'menos', 'pouco', 'pequeno', 'baixo', 'errado', 'errada', 'erro'], k1: ['repasse', 'vendi', 'valor'],
      r: () => 'Porque as deduções de <b>todas</b> as vendas (comissão e taxas) saem <b>só</b> do valor que passou pela plataforma, o pagamento online.<br>O dinheiro das vendas em dinheiro e maquininha <b>já estava com você</b>. Somando esse valor com o repasse, você chega ao <b>Resultado</b> do mês.',
      seguintes: ['resultado', 'comissao', 'cardapio'],
    },
    {
      id: 'repasse', tema: 'Pagamento online', rever: 2, exemplo: 'O que é o repasse?',
      k3: ['significa repasse'], k2: ['repasse'],
      r: () => 'O <b>repasse</b> é o valor das vendas com pagamento online que fica depois das deduções (comissão e taxas). A plataforma envia esse valor para você.',
      seguintes: ['quando_cai', 'repasse_menor'],
    },
    {
      id: 'comprovante', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: 'Onde pego o comprovante?',
      k3: ['comprovante', 'recibo', 'comprovacao', 'prova pagamento', 'comprovante pix', 'baixar comprovante', 'comprovante transferencia'], k1: ['repasse', 'transferencia'],
      r: () => 'Quando a transferência cai, abra <b>Financeiro</b> e toque na fatura. No mesmo lugar onde fica "Solicitar antecipação", aparece <b>Repasse realizado</b>. Toque em <b>Ver comprovante</b>.',
      seguintes: ['quando_cai', 'pix'],
    },
    {
      id: 'status_fatura', tema: 'Tela Financeiro', rever: 5, exemplo: 'O que é fatura VIGENTE?',
      k3: ['vigente', 'antecipada', 'status fatura', 'fatura aberta'], k1: ['fatura', 'status'],
      r: () => '<b>VIGENTE</b>: a fatura está aberta e o valor ainda não foi transferido.<br><b>ANTECIPADA</b>: você pediu a antecipação e o repasse foi solicitado.',
      seguintes: ['antecipar', 'fatura'],
    },
    {
      id: 'fatura', tema: 'Tela Financeiro', rever: 5, exemplo: 'Onde vejo a fatura?',
      k3: ['onde fatura', 'ver fatura', 'abrir fatura', 'achar fatura'], k2: ['fatura'], k1: ['onde', 'ver'],
      r: () => 'Abra <b>Financeiro</b> no menu. Em <b>Faturas do Período</b>, toque na fatura para ver a conta completa, linha por linha: o que entrou de pagamento online e todas as deduções.',
      seguintes: ['status_fatura', 'comissao'],
    },
    {
      id: 'debitos', tema: 'Mensalidade e débitos', rever: 6, exemplo: 'O que são débitos remanescentes?',
      k3: ['debito remanescente', 'remanescente', 'debitos remanescentes'], k2: ['debito', 'divida', 'devendo', 'saldo negativo', 'negativo'],
      r: () => 'São deduções que o saldo online não cobriu em uma fatura anterior. Esse valor <b>não gera boleto na hora</b>: ele aparece na próxima fatura como a primeira dedução.',
      seguintes: ['boleto', 'antecipar_tudo'],
    },
    {
      id: 'boleto', tema: 'Mensalidade e débitos', rever: 4, exemplo: 'Vou ter que pagar boleto?',
      k3: ['boleto', 'boletos', 'pagar boleto'], k1: ['pagar'],
      r: () => 'Pode aparecer um boleto quando o saldo online não cobre a comissão e as taxas. Mas o valor normalmente passa para o mês seguinte como <b>Débitos remanescentes</b>.<br>O boleto só deve ser considerado se a loja ficar <b>três meses seguidos</b> sem saldo suficiente no pagamento online. Os boletos ficam em Financeiro → <b>Boletos</b>.',
      seguintes: ['debitos', 'pagamento_online'],
    },
    {
      id: 'mensalidade', tema: 'Mensalidade e débitos', rever: 8, exemplo: 'Quando tem mensalidade?',
      k3: ['mensalidade', '59 90', 'faturamento minimo', 'plano mensal'], k2: ['mensal', 'plano'],
      r: () => `A <b>mensalidade</b> (${R$(MS.valor)} no treinamento) só é cobrada quando a loja atinge o <b>faturamento mínimo</b> de ${R$(MS.acimaDeBruto)} em Total Bruto no mês. É um valor fixo, separado da comissão, deduzido na virada do último dia do mês.${OBS}`,
      seguintes: ['debitos', 'antecipar_tudo'],
    },
    {
      id: 'total_bruto', tema: 'Total Bruto e formas de pagamento', rever: 1, exemplo: 'O que é o Total Bruto?',
      k3: ['total bruto', 'quanto vendi', 'total vendido', 'vendas mes', 'total vendas'], k2: ['bruto', 'vendi'], k1: ['total', 'relatorio'],
      r: () => 'O <b>Total Bruto</b> é a soma de tudo o que você vendeu no mês: online, dinheiro e maquininha, com as taxas de serviço. Ele fica na tela <b>Relatório</b>. Toque no ⓘ para ver como é formado.',
      seguintes: ['resultado', 'dinheiro_maquininha'],
    },
    {
      id: 'resultado', tema: 'Tela Financeiro', rever: 4, exemplo: 'O que é o Resultado?',
      k3: ['resultado', 'quanto ficou', 'quanto sobrou', 'lucro', 'ficou comigo'], k1: ['financeiro'],
      r: () => 'O <b>Resultado</b> é tudo o que ficou com você no mês. É a soma de:<br>• <b>Recebido pela Loja</b> (dinheiro e maquininha, já no seu caixa)<br>• <b>Repasses recebidos</b> (o que já foi transferido)<br>• <b>Repasse disponível</b> (o que ainda vai ser transferido)',
      seguintes: ['disponivel', 'repasse_menor'],
    },
    {
      id: 'recebido', tema: 'Tela Financeiro', rever: 4, exemplo: 'O que é Recebido pela Loja?',
      k3: ['recebido loja', 'recebido pela loja'], k2: ['recebido'],
      r: () => '<b>Recebido pela Loja</b> é o valor das vendas em dinheiro e maquininha. O cliente pagou direto para você, então esse dinheiro <b>já entrou no seu caixa</b>.',
      seguintes: ['resultado', 'dinheiro_maquininha'],
    },
    {
      id: 'disponivel', tema: 'Tela Financeiro', rever: 4, exemplo: 'Por que o Repasse disponível mudou?',
      k3: ['repasse disponivel', 'repasses recebidos', 'repasse recebido', 'disponivel', 'saldo diminuiu', 'saldo caiu', 'saldo mudou', 'volatil'], k2: ['saldo', 'diminuiu', 'mudou'], k1: ['repasse'],
      r: () => '<b>Repasse disponível</b> é o que ainda vai ser transferido. Ele muda todos os dias: se em um dia você tiver só vendas em dinheiro ou maquininha, as deduções dessas vendas saem do saldo online, e ele diminui.<br>Quando o dinheiro cai, o valor sai de Repasse disponível e vai para <b>Repasses recebidos</b>. O Resultado não muda.',
      seguintes: ['quando_cai', 'resultado'],
    },
    {
      id: 'cupons', tema: 'Cupons', rever: 5, exemplo: 'Quem paga o cupom de desconto?',
      k3: ['cupom', 'cupons', 'cupon', 'reembolso', 'incentivo', 'incentivos', 'desconto'], k1: ['cliente', 'paga'],
      r: () => 'Quando o cupom é do Bigou, quem paga o desconto é a <b>plataforma</b>, não você. Aceite o pedido normalmente: o valor volta na sua fatura como <b>Reembolso dos incentivos</b>.',
      seguintes: ['pagamento_online', 'fatura'],
    },
    {
      id: 'pagamento_online', tema: 'Pagamento online', rever: 2, exemplo: 'Preciso cobrar o cliente no pagamento online?',
      k3: ['pagamento online', 'pago pelo app', 'pago app', 'pagou aplicativo', 'pago aplicativo', 'cobrar cliente', 'cliente ja pagou', 'pagou online'], k2: ['online', 'aplicativo', 'app'], k1: ['cliente', 'cobrar'],
      r: () => 'Nos pedidos com <b>pagamento online</b>, o cliente já pagou pelo aplicativo. Você só precisa aceitar e entregar, <b>sem cobrar o cliente</b>.<br>Esse valor passa primeiro pela plataforma: é dele que saem as deduções, e o que sobra vira o seu repasse.',
      seguintes: ['repasse', 'taxa_online'],
    },
    {
      id: 'dinheiro_maquininha', tema: 'Total Bruto e formas de pagamento', rever: 3, exemplo: 'E as vendas em dinheiro e maquininha?',
      k3: ['maquininha', 'cartao', 'maquina', 'especie', 'venda dinheiro', 'pago dinheiro', 'pagou dinheiro'], k2: ['dinheiro'], k1: ['venda', 'pagou'],
      r: () => 'Nas vendas em <b>dinheiro</b> e na <b>maquininha</b>, o cliente paga direto para você. O dinheiro já entra no seu caixa (ou na conta da sua maquininha) e <b>não passa pela plataforma</b>.<br>A comissão e as taxas dessas vendas são deduzidas do saldo do pagamento online.',
      seguintes: ['taxa_servico', 'repasse_menor'],
    },
    {
      id: 'feriado', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: 'Tem repasse no feriado?',
      k3: ['feriado', 'fim semana', 'final semana', 'sabado', 'domingo'], k1: ['repasse', 'cai'],
      r: () => 'Não há repasses em <b>fins de semana</b> nem em <b>feriados nacionais ou municipais</b> de Rio Pomba - MG (sede da empresa). Nesses casos, o valor cai no próximo dia útil.',
      seguintes: ['quando_cai', 'antecipar'],
    },
    {
      id: 'pix', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: 'Em qual conta cai o dinheiro?',
      k3: ['pix', 'chave pix', 'dado bancario', 'dados bancario', 'conta bancaria', 'mudar conta', 'trocar conta', 'qual conta'], k2: ['banco', 'conta'],
      r: () => 'A transferência vai para a <b>chave PIX</b> cadastrada. Para evitar atrasos, os dados bancários precisam estar corretos e no nome da pessoa física ou jurídica titular do contrato. Para mudar, fale com o suporte.',
      seguintes: ['quando_cai', 'suporte'],
    },
    {
      id: 'cardapio', tema: 'Taxas', rever: 8, exemplo: 'Posso ajustar meus preços?',
      k3: ['cardapio', 'ajustar preco', 'aumentar preco', 'mudar preco', 'repassar custo', 'nao absorver'], k2: ['preco', 'precos'],
      r: () => 'Pode. Você pode ajustar o valor dos seus produtos para <b>não absorver o custo da comissão e das taxas</b>. Confira se o seu cardápio está atualizado. Se não estiver, fale com o nosso suporte para atualizar.',
      seguintes: ['comissao', 'suporte'],
    },
    {
      id: 'fora', tema: 'Outros assuntos do painel', exemplo: 'Outros assuntos',
      k3: ['taxa entrega', 'horario funcionamento', 'cadastrar produto', 'cadastro produto', 'produto novo', 'nota fiscal', 'marketing', 'foto', 'senha', 'imprimir', 'impressora', 'travando', 'travou', 'nao abre', 'cancelar contrato', 'contrato', 'avaliacao', 'avaliacoes', 'entregador', 'motoboy'],
      r: () => 'Esse assunto não faz parte deste treinamento, que fala sobre <b>vendas, taxas e repasses</b>. Para isso, fale com o suporte Bigou: o contato aparece no rodapé do seu painel, em <b>SUPORTE</b>.<br>Anotamos sua pergunta para melhorar nossos materiais.',
      seguintes: [],
    },
    {
      id: 'suporte', tema: 'Suporte', exemplo: 'Como falo com o suporte?',
      k3: ['suporte', 'atendente', 'falar alguem', 'falar pessoa', 'humano', 'whatsapp', 'telefone', 'atendimento'], k2: ['contato', 'ajuda', 'reclamar'],
      r: () => 'O contato do <b>suporte Bigou</b> aparece no rodapé do seu painel, em <b>SUPORTE</b>. Se a sua dúvida não estiver aqui, fale com a gente por lá.',
      seguintes: [],
    },
  ];
  const POR_ID = new Map(INTENCOES.map((x) => [x.id, x]));
  const POPULARES = ['quando_cai', 'cancelado', 'taxa_servico', 'repasse_menor', 'antecipar', 'comprovante'];

  /* ------------------------------ Entendimento ------------------------------ */
  const PARADAS = new Set('a o as os e de da do das dos um uma uns umas no na nos nas em ao aos pra pro para pelo pela pelos pelas por que q pq porque meu minha meus minhas eu me mim voce vc se com sem isso esse essa este esta ta tá ja e é eh qual quais ou mas tem ter foi sao sua seu'.split(' '));
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const raiz = (w) => (w.length <= 3 ? w : w.replace(/(oes|aes)$/, 'ao').replace(/ais$/, 'al').replace(/eis$/, 'el').replace(/s$/, ''));
  const ABREV = { qnd: 'quando', qdo: 'quando', qd: 'quando', vcs: 'voces', tb: 'tambem', tbm: 'tambem', msg: 'mensagem', hj: 'hoje', dps: 'depois', n: 'nao' };
  const tokens = (t) => norm(t).split(' ').map((w) => ABREV[w] || w).filter((w) => w && !PARADAS.has(w)).map(raiz);

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // Igual, com 1 erro de digitação (palavras de 5+ letras), 2 erros (8+) ou mesmo começo longo (antecipar/antecipação)
  function parecido(a, b) {
    if (a === b) return true;
    if (/^\d/.test(a) || /^\d/.test(b)) return false;
    const m = Math.min(a.length, b.length);
    if (m >= 7 && a.slice(0, 7) === b.slice(0, 7)) return true;
    if (m < 5) return false;
    return lev(a, b) <= (m >= 8 ? 2 : 1);
  }

  // Pré-processa as chaves de cada intenção
  INTENCOES.forEach((x) => {
    x.chaves = [];
    [[x.k3, 3], [x.k2, 2], [x.k1, 1]].forEach(([lista, peso]) => (lista || []).forEach((frase) => {
      const tk = tokens(frase);
      // Sem chaves repetidas (ex.: singular e plural viram a mesma raiz)
      if (tk.length && !x.chaves.some((c) => c.tk.join(' ') === tk.join(' '))) x.chaves.push({ tk, peso: peso + (tk.length > 1 ? 1 : 0) });
    }));
  });

  function pontuar(tk) {
    return INTENCOES.map((x) => {
      let s = 0;
      const porPalavra = new Map();   // palavras soltas: cada palavra da pergunta conta uma vez (o maior peso)
      x.chaves.forEach((c) => {
        const achou = c.tk.map((w) => tk.findIndex((t) => parecido(t, w)));
        if (achou.some((i) => i < 0)) return;
        if (c.tk.length > 1) { s += c.peso; return; }
        let p = c.peso;
        // A pergunta é só essa palavra ("mensalidade?", "repasse?"): resposta direta
        if (tk.length === 1 && c.peso >= 2) p += 2;
        porPalavra.set(achou[0], Math.max(porPalavra.get(achou[0]) || 0, p));
      });
      porPalavra.forEach((p) => { s += p; });
      return { x, s };
    }).filter((o) => o.s > 0).sort((a, b) => b.s - a.s);
  }

  const RX_OI = /^(oi+|ola|opa|bom dia|boa tarde|boa noite|e ai|eai|hey|ei)\b/;
  const RX_OBG = /^(obrigad[oa]|brigad[oa]|valeu|vlw|agradeco|show|beleza|blz|ok|certo|entendi|perfeito|top)\b/;

  /** Entende uma pergunta: { tipo: 'resposta' | 'sugestao' | 'sem_resposta' | 'oi' | 'obrigado', intencao, opcoes, confianca } */
  function entender(texto) {
    const n = norm(texto), tk = tokens(texto);
    const r = pontuar(tk);
    const top = r[0], seg = r[1];
    if ((!top || top.s < 3) && tk.length <= 4) {
      if (RX_OBG.test(n)) return { tipo: 'obrigado', confianca: 0 };
      if (RX_OI.test(n)) return { tipo: 'oi', confianca: 0 };
    }
    if (!top || top.s < 2) return { tipo: 'sem_resposta', confianca: top ? top.s : 0 };
    const claro = !seg || top.s - seg.s >= 2 || seg.s < top.s * 0.7;
    if (top.s >= 3 && claro) return { tipo: 'resposta', intencao: top.x, confianca: top.s };
    return { tipo: 'sugestao', opcoes: r.filter((o) => o.s >= Math.max(2, top.s * 0.6)).slice(0, 3).map((o) => o.x), intencao: top.x, confianca: top.s };
  }

  // Tira dados pessoais antes de registrar a dúvida
  const limpar = (t) => String(t || '').slice(0, 300)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[removido]')
    .replace(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g, '[removido]')
    .replace(/\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g, '[removido]')
    .replace(/\d{6,}/g, '[removido]');

  /* =====================================================================
     INTERFACE (só no treinamento; o painel admin usa apenas o entendimento)
     ===================================================================== */
  const An = () => TREINO.Analytics;
  const ev = (tipo, detalhe) => { try { An() && An().registrar(tipo, { detalhe }); } catch (e) { /* nunca trava */ } };
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const semHtml = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' ').trim(); };
  const calmo = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ler = (k, pad) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? pad : v; } catch (e) { return pad; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };

  const IC = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    novo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg>',
    enviar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.5 10H19a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17.8 20H7"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 13V4H4v9zM7 13l4 7c1.5 0 2.5-1 2.2-2.6L12.5 14H19a2 2 0 0 0 2-2.3l-1.2-6A2 2 0 0 0 17.8 4H7"/></svg>',
    seta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };

  const Bot = { entender, limpar, norm, intencoes: INTENCOES, porId: (id) => POR_ID.get(id) };
  const st = { montado: false, liberado: false, visivel: false, aberto: false, loja: '', restantes: 0, hist: [], obsMostrada: false, sessaoAberta: false };
  let el = {};
  const chaveHist = () => 'bigou-bot-hist-' + (An() ? An().id() : '');
  const chaveAnuncio = () => 'bigou-bot-anunciado-' + (An() ? An().id() : '');

  function montar() {
    if (st.montado) return;
    st.montado = true;
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'bt-fab';
    fab.innerHTML = `<span class="bt-fab-ic">${IC.chat}</span><span class="bt-fab-lock">${IC.lock}</span><i class="bt-dot" aria-hidden="true"></i>`;
    const pop = document.createElement('div');
    pop.className = 'bt-pop';
    pop.setAttribute('role', 'status');
    pop.hidden = true;
    const wrap = document.createElement('div');
    wrap.className = 'bt-wrap';
    wrap.hidden = true;
    wrap.innerHTML = `
      <div class="bt-scrim" data-bt="fechar"></div>
      <section class="bt-panel" role="dialog" aria-modal="true" aria-labelledby="bt-titulo">
        <header class="bt-h">
          <span class="bt-av"><img src="assets/bigou-logo.png" alt="" width="36" height="36"></span>
          <div class="bt-h-t"><b id="bt-titulo">Assistente Bigou</b><small><i></i>Online · responde na hora</small></div>
          <button type="button" class="bt-ib" data-bt="novo" title="Nova conversa" aria-label="Nova conversa">${IC.novo}</button>
          <button type="button" class="bt-ib" data-bt="fechar" title="Fechar" aria-label="Fechar">${IC.x}</button>
        </header>
        <div class="bt-msgs" aria-live="polite"></div>
        <form class="bt-form" autocomplete="off">
          <input type="text" maxlength="300" placeholder="Escreva sua dúvida…" aria-label="Sua dúvida" enterkeyhint="send">
          <button type="submit" class="bt-send" aria-label="Enviar" disabled>${IC.enviar}</button>
        </form>
        <p class="bt-priv">Suas perguntas ajudam a melhorar o sistema. Não envie dados pessoais nem bancários.</p>
      </section>`;
    document.body.append(fab, pop, wrap);
    el = { fab, pop, wrap, msgs: wrap.querySelector('.bt-msgs'), form: wrap.querySelector('.bt-form'), input: wrap.querySelector('input'), send: wrap.querySelector('.bt-send'), panel: wrap.querySelector('.bt-panel') };

    fab.addEventListener('click', () => {
      if (!st.liberado) return mostrarPop(`<b>Conclua o treinamento para liberar o assistente.</b><span>Falta${st.restantes === 1 ? '' : 'm'} ${st.restantes} ${st.restantes === 1 ? 'módulo' : 'módulos'}.</span><a href="#/comecar" class="bt-pop-a">Continuar ${IC.seta}</a>`, true);
      abrir();
    });
    pop.addEventListener('click', (e) => { if (e.target.closest('a')) fecharPop(); });
    document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.bt-pop, .bt-fab')) fecharPop(); }, true);
    wrap.addEventListener('click', onClick);
    el.input.addEventListener('input', () => { el.send.disabled = !el.input.value.trim(); });
    el.form.addEventListener('submit', (e) => { e.preventDefault(); const t = el.input.value.trim(); if (!t) return; el.input.value = ''; el.send.disabled = true; perguntar(t); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && st.aberto) fechar(); });
    // Teclado do celular: o painel acompanha a área visível
    if (window.visualViewport) visualViewport.addEventListener('resize', () => { if (st.aberto) el.panel.style.setProperty('--vh', visualViewport.height + 'px'); });
  }

  function mostrarPop(html, travado) {
    el.pop.innerHTML = html;
    el.pop.classList.toggle('lock', !!travado);
    el.pop.hidden = false;
    clearTimeout(mostrarPop.t);
    if (!travado) mostrarPop.t = setTimeout(fecharPop, 7000);
  }
  function fecharPop() { if (el.pop) el.pop.hidden = true; }

  /** Chamado a cada troca de tela pelo app */
  Bot.atualizar = function (o) {
    montar();
    const antes = st.liberado;
    Object.assign(st, o);
    el.fab.classList.toggle('locked', !st.liberado);
    el.fab.setAttribute('aria-label', st.liberado ? 'Abrir assistente de dúvidas' : 'Assistente de dúvidas (bloqueado)');
    el.fab.hidden = !st.visivel;
    if (!st.visivel) { fecharPop(); if (st.aberto) fechar(true); }
    // Anúncio na primeira vez que aparece liberado
    if (st.liberado && st.visivel && !ler(chaveAnuncio(), false)) {
      gravar(chaveAnuncio(), true);
      el.fab.classList.add('novo');
      setTimeout(() => mostrarPop('<b>Assistente liberado! 🎉</b><span>Tire suas dúvidas sobre vendas, taxas e repasses por aqui.</span>'), antes ? 0 : 600);
    }
  };

  function abrir() {
    fecharPop();
    el.fab.classList.remove('novo');
    st.hist = ler(chaveHist(), []);
    st.aberto = true;
    el.wrap.hidden = false;
    document.body.classList.add('bt-on');
    requestAnimationFrame(() => el.wrap.classList.add('in'));
    if (!st.sessaoAberta) { st.sessaoAberta = true; ev('bot_aberto', { mensagens: st.hist.length }); }
    renderHist();
    if (!st.hist.length) boasVindas();
    if (window.innerWidth >= 640) setTimeout(() => el.input.focus(), 250);
  }

  function fechar(rapido) {
    st.aberto = false;
    el.wrap.classList.remove('in');
    document.body.classList.remove('bt-on');
    if (TREINO.Voz) TREINO.Voz.parar();
    setTimeout(() => { if (!st.aberto) el.wrap.hidden = true; }, rapido || calmo() ? 0 : 220);
    if (!rapido) el.fab.focus({ preventScroll: true });
  }
  Bot.abrir = () => { if (st.liberado) abrir(); };

  /* ------------------------------ Mensagens ------------------------------ */
  function guardar(m) {
    st.hist.push(m);
    st.hist = st.hist.slice(-30);
    gravar(chaveHist(), st.hist);
  }

  const chips = (ids, origem) => (ids.length ? `<div class="bt-chips">${ids.map((id) => POR_ID.get(id)).filter(Boolean).map((x) => `<button type="button" class="bt-chip" data-bt="q" data-id="${x.id}" data-or="${origem}">${esc(x.exemplo)}</button>`).join('')}</div>` : '');

  function htmlBot(m) {
    if (m.k === 'oi') return `<div class="bt-b">Olá${st.loja ? `, <b>${esc(st.loja)}</b>` : ''}! 👋 Sou o assistente do treinamento.<br>Pergunte com suas palavras ou toque em uma dúvida comum:</div>${chips(POPULARES, 'inicio')}`;
    if (m.k === 'obrigado') return '<div class="bt-b">Por nada! Se surgir outra dúvida, é só perguntar. 😊</div>';
    if (m.k === 'sem') return `<div class="bt-b">Ainda não sei responder essa. 😕 Tente com outras palavras ou escolha um assunto:</div>${chips(POPULARES.slice(0, 4), 'sem')}<div class="bt-b sm">Se preferir, fale com o suporte: o contato aparece no rodapé do seu painel.</div>`;
    if (m.k === 'sug') return `<div class="bt-b">Você quis dizer:</div>${chips(m.ids, 'sugestao')}`;
    const x = POR_ID.get(m.id);
    if (!x) return '';
    let r = x.r();
    if (r.includes('bt-obs')) { if (m.obs) r = r.replace(OBS, '') + OBS; else r = r.replace(OBS, ''); }
    return `<div class="bt-b">${r}</div>
      <div class="bt-acts">
        ${x.rever ? `<a class="bt-rever" href="#/modulo/${x.rever}">Rever no treinamento ${IC.seta}</a>` : ''}
        ${x.id === 'fora' ? '' : m.fb == null ? `<span class="bt-fb" data-msg="${m.n}"><small>Ajudou?</small><button type="button" data-bt="fb" data-v="1" aria-label="Ajudou">${IC.up}</button><button type="button" data-bt="fb" data-v="0" aria-label="Não ajudou">${IC.down}</button></span>`
          : `<span class="bt-fb-ok">${m.fb ? 'Que bom! 👍' : 'Obrigado! Vamos melhorar essa resposta.'}</span>`}
      </div>
      ${x.seguintes && x.seguintes.length ? `<small class="bt-mais">Talvez você queira saber:</small>${chips(x.seguintes, 'seguinte')}` : ''}`;
  }

  function bolha(m) {
    const d = document.createElement('div');
    d.className = 'bt-m ' + (m.de === 'eu' ? 'eu' : 'bot');
    d.innerHTML = m.de === 'eu' ? `<div class="bt-b">${esc(m.t)}</div>` : htmlBot(m);
    return d;
  }

  function renderHist() {
    el.msgs.innerHTML = '';
    st.hist.forEach((m) => el.msgs.appendChild(bolha(m)));
    rolar();
  }
  const rolar = () => requestAnimationFrame(() => { el.msgs.scrollTop = el.msgs.scrollHeight; });

  function adicionar(m, falar) {
    m.n = Date.now() + Math.random();
    guardar(m);
    el.msgs.appendChild(bolha(m));
    rolar();
    if (falar && m.de === 'bot' && TREINO.Voz && TREINO.Voz.ligada) {
      const d = document.createElement('div');
      d.innerHTML = htmlBot(Object.assign({}, m, { fb: true }));
      const b = d.querySelector('.bt-b');
      if (b) TREINO.Voz.falar([semHtml(b.innerHTML.replace(/<br>|<li>/g, '. '))]);
    }
  }

  function boasVindas() { adicionar({ de: 'bot', k: 'oi' }); }

  function digitando(fn) {
    const d = document.createElement('div');
    d.className = 'bt-m bot';
    d.innerHTML = '<div class="bt-b bt-typing" aria-label="Digitando"><i></i><i></i><i></i></div>';
    el.msgs.appendChild(d);
    rolar();
    setTimeout(() => { d.remove(); fn(); }, calmo() ? 0 : 550);
  }

  function responder(x) {
    const precisaObs = !st.obsMostrada && x.r().includes('bt-obs');
    if (precisaObs) st.obsMostrada = true;
    adicionar({ de: 'bot', id: x.id, obs: precisaObs }, true);
  }

  function perguntar(texto) {
    adicionar({ de: 'eu', t: texto });
    const r = entender(texto);
    if (r.tipo !== 'oi' && r.tipo !== 'obrigado') {
      ev('duvida', {
        texto: limpar(texto),
        intencao: r.intencao ? r.intencao.id : null,
        tema: r.tipo === 'resposta' && r.intencao ? r.intencao.tema : null,
        confianca: r.confianca,
        resultado: r.tipo === 'resposta' ? (r.intencao.id === 'fora' ? 'fora' : 'respondida') : r.tipo === 'sugestao' ? 'sugestao' : 'sem_resposta',
        opcoes: r.opcoes ? r.opcoes.map((x) => x.id) : undefined,
      });
    }
    digitando(() => {
      if (r.tipo === 'resposta') responder(r.intencao);
      else if (r.tipo === 'sugestao') adicionar({ de: 'bot', k: 'sug', ids: r.opcoes.map((x) => x.id) });
      else if (r.tipo === 'oi') adicionar({ de: 'bot', k: 'oi' });
      else if (r.tipo === 'obrigado') adicionar({ de: 'bot', k: 'obrigado' });
      else adicionar({ de: 'bot', k: 'sem' });
    });
  }

  function onClick(e) {
    const b = e.target.closest('[data-bt]');
    if (e.target.closest('.bt-rever')) { fechar(true); return; }
    if (!b) return;
    const a = b.dataset.bt;
    if (a === 'fechar') fechar();
    else if (a === 'novo') { st.hist = []; gravar(chaveHist(), []); st.obsMostrada = false; el.msgs.innerHTML = ''; boasVindas(); }
    else if (a === 'q') {
      const x = POR_ID.get(b.dataset.id);
      if (!x) return;
      adicionar({ de: 'eu', t: x.exemplo });
      ev('duvida_escolha', { intencao: x.id, tema: x.tema, origem: b.dataset.or });
      digitando(() => responder(x));
    } else if (a === 'fb') {
      const box = b.closest('.bt-fb'), n = +box.dataset.msg, util = b.dataset.v === '1';
      const m = st.hist.find((h) => h.n === n);
      if (m) { m.fb = util; gravar(chaveHist(), st.hist); }
      // Pergunta que levou à resposta (a última mensagem do parceiro antes dela)
      const i = st.hist.indexOf(m), antes = st.hist.slice(0, i).reverse().find((h) => h.de === 'eu');
      ev('duvida_feedback', { intencao: m && m.id, tema: m && POR_ID.get(m.id) ? POR_ID.get(m.id).tema : null, util, texto: antes ? limpar(antes.t) : null });
      box.outerHTML = `<span class="bt-fb-ok">${util ? 'Que bom! 👍' : 'Obrigado! Vamos melhorar essa resposta.'}</span>`;
    }
  }

  TREINO.Bot = Bot;
})();
