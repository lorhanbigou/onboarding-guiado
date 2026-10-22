/* =========================================================================
   ASSISTENTE DE DÚVIDAS — mini chat disponível a qualquer momento
   - Quando não consegue ajudar (sem resposta, assunto fora do treinamento,
     resposta marcada como "não ajudou" ou pedido de atendimento), indica o
     WhatsApp do Financeiro (CONTATO_FINANCEIRO).
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
  // Para onde o assistente encaminha quando não consegue ajudar
  const CONTATO_FINANCEIRO = { numero: '(32) 99819-6024', whatsapp: 'https://wa.me/5532998196024' };
  const contatoFinanceiro = () => `<a class="bt-contato" href="${CONTATO_FINANCEIRO.whatsapp}" target="_blank" rel="noopener noreferrer">${L('WhatsApp do Financeiro', 'WhatsApp de Finanzas')}: ${CONTATO_FINANCEIRO.numero}</a>`;
  const PCT = (p) => String(Math.round(p * 10000) / 100).replace('.', ',') + '%';
  const R$ = (v) => F(Math.round(v * 100));
  const T = CFG.taxas, MS = CFG.mensalidade, TS = CFG.taxaServico;
  const OBS = `<small class="bt-obs">${L('Valores do treinamento. Os da sua loja estão no seu contrato.', 'Valores de la capacitación. Los de tu tienda están en tu contrato.')}</small>`;

  /* ------------------------------ Base de conhecimento ------------------------------ */
  // k3: expressões bem específicas (peso 3) · k2: (peso 2) · k1: palavras gerais (peso 1)
  // Uma expressão conta quando todas as palavras dela aparecem na pergunta.
  // Em espanhol, cada lista usa as suas próprias palavras: L([português], [espanhol]).
  // id e tema ficam sempre em português (o painel agrupa as dúvidas por eles).
  const INTENCOES = [
    {
      id: 'comissao', tema: 'Comissão', rever: 6, exemplo: L('Como funciona a comissão?', '¿Cómo funciona la comisión?'),
      k3: L(['comissao', 'comicao', 'comisao'], ['comision', 'comisiones', 'comicion']), k2: L(['parte da plataforma', 'porcentagem', 'percentual'], ['parte de la plataforma', 'porcentaje']), k1: L(['cobrada', 'cobram', 'quanto'], ['cobrada', 'cobran', 'cuanto']),
      r: () => L(
        `A <b>comissão</b> é a parte da plataforma pelas vendas feitas pelo aplicativo. Ela vale para <b>todas</b> as vendas: online, dinheiro e maquininha.<br>É calculada sobre o valor dos produtos, sem a taxa de serviço. No treinamento usamos <b>${PCT(T.comissao)}</b>.${OBS}`,
        `La <b>comisión</b> es la parte de la plataforma por las ventas hechas por la aplicación. Vale para <b>todas</b> las ventas: online, efectivo y POS.<br>Se calcula sobre el valor de los productos, sin la tasa de servicio. En la capacitación usamos <b>${PCT(T.comissao)}</b>.${OBS}`),
      seguintes: ['comissao_conta', 'cancelado', 'repasse_menor'],
    },
    {
      id: 'comissao_conta', tema: 'Comissão', rever: 6, exemplo: L('Onde vejo a conta da comissão?', '¿Dónde veo la cuenta de la comisión?'),
      k3: L(['conta comissao', 'calculo comissao', 'calcula comissao', 'base calculo', 'calculada comissao'], ['cuenta comision', 'calculo comision', 'calcula comision', 'base calculo', 'calculada comision']), k2: L(['calculo', 'calculada', 'calcula'], ['calculo', 'calculada', 'calcula']), k1: L(['comissao', 'onde'], ['comision', 'donde']),
      r: () => L(
        'Abra <b>Financeiro</b>, toque na fatura e depois no <b>ⓘ</b> ao lado de <b>Comissão</b>.<br>Lá aparecem as vendas confirmadas, as canceladas por tempo, a taxa de serviço que sai da conta e a base de cálculo.',
        'Abre <b>Finanzas</b>, toca la factura y luego el <b>ⓘ</b> al lado de <b>Comisión</b>.<br>Ahí aparecen las ventas confirmadas, las canceladas por tiempo, la tasa de servicio que sale de la cuenta y la base de cálculo.'),
      seguintes: ['cancelado', 'taxa_servico'],
    },
    {
      id: 'cancelado', tema: 'Pedidos cancelados por tempo', rever: 6, exemplo: L('Por que paguei comissão de pedido cancelado?', '¿Por qué pagué comisión por un pedido cancelado?'),
      k3: L(['cancelado tempo', 'cancelada tempo', 'tempo expirado', '15 minuto', 'quinze minuto', 'expirou', 'cancelou sozinho', 'cancelado automaticamente', 'cancelado sozinho', 'nao aceitei', 'nao aceitar', 'nao aceito', 'esqueci aceitar', 'comissao cancelado', 'comissao cancelada', 'comissao pedido nao entreguei'],
        ['cancelado tiempo', 'cancelada tiempo', 'tiempo expirado', '15 minuto', 'quince minuto', 'expiro', 'cancelo solo', 'cancelado automaticamente', 'cancelado solo', 'no acepte', 'no aceptar', 'no aceptado', 'olvide aceptar', 'no acepte tiempo', 'comision cancelado', 'comision cancelada', 'comision pedido no entregue']),
      k2: L(['cancelado', 'cancelada', 'cancelamento', 'expirado', 'cancelou'], ['cancelado', 'cancelada', 'cancelacion', 'expirado', 'cancelo']), k1: L(['pedido', 'tempo', 'comissao'], ['pedido', 'tiempo', 'comision']),
      r: () => L(
        'Quando um pedido <b>não é aceito nem recusado em até 15 minutos</b>, ele é cancelado automaticamente.<br>Você não recebe o valor, mas ele <b>entra no cálculo da comissão</b>.<br>Acompanhe a tela <b>Pedidos</b>. Se não puder atender, <b>recuse dentro do prazo</b>: assim ele não entra na comissão.',
        'Cuando un pedido <b>no se acepta ni se rechaza en hasta 15 minutos</b>, se cancela automáticamente.<br>No recibes el valor, pero <b>entra en el cálculo de la comisión</b>.<br>Sigue la pantalla <b>Pedidos</b>. Si no puedes atender, <b>recházalo dentro del plazo</b>: así no entra en la comisión.'),
      seguintes: ['aceitar', 'comissao'],
    },
    {
      id: 'aceitar', tema: 'Pedidos cancelados por tempo', rever: 6, exemplo: L('Onde aceito os pedidos?', '¿Dónde acepto los pedidos?'),
      k3: L(['aceitar pedido', 'aceito pedido', 'recusar pedido', 'aguardando confirmacao', 'tela pedido', 'pedido novo', 'novo pedido'], ['aceptar pedido', 'acepto pedido', 'rechazar pedido', 'esperando confirmacion', 'pantalla pedido', 'pedido nuevo', 'nuevo pedido']), k2: L(['aceitar', 'recusar', 'recuso', 'aceito'], ['aceptar', 'rechazar', 'rechazo', 'acepto']), k1: ['pedido'],
      r: () => L(
        'Os pedidos novos chegam na tela <b>Pedidos</b>, com a etiqueta <b>AGUARDANDO CONFIRMAÇÃO</b>.<br>Abra o pedido para aceitar ou recusar. Você tem até <b>15 minutos</b>.',
        'Los pedidos nuevos llegan a la pantalla <b>Pedidos</b>, con la etiqueta <b>ESPERANDO CONFIRMACIÓN</b>.<br>Abre el pedido para aceptarlo o rechazarlo. Tienes hasta <b>15 minutos</b>.'),
      seguintes: ['cancelado', 'pagamento_online'],
    },
    {
      id: 'taxa_servico', tema: 'Taxa de serviço', rever: 8, exemplo: L('O que é a taxa de serviço?', '¿Qué es la tasa de servicio?'),
      k3: L(['taxa servico', '0 99', '1 99 pedido'], ['tasa servicio', 'tarifa servicio', '0 99', '1 99 pedido']), k2: L(['servico'], ['servicio']), k1: L(['taxa', 'cliente paga', 'deducao'], ['tasa', 'cliente paga', 'deduccion']),
      r: () => L(
        `A <b>taxa de serviço</b> é paga pelo <b>cliente</b> em cada pedido, além dos produtos: ${R$(TS.normal)}, ou ${R$(TS.maior)} em pedidos acima de ${R$(TS.acimaDe)}. Ela é da plataforma, <b>não é um custo seu</b>.<br>• No pagamento online, ela entra e sai da fatura: para você, fica zero.<br>• No dinheiro e na maquininha, o cliente te pagou a taxa junto com o pedido. Por isso ela é deduzida na fatura: você só repassa o que o cliente pagou.${OBS}`,
        `La <b>tasa de servicio</b> la paga el <b>cliente</b> en cada pedido, además de los productos: ${R$(TS.normal)}, o ${R$(TS.maior)} en pedidos de más de ${R$(TS.acimaDe)}. Es de la plataforma, <b>no es un costo tuyo</b>.<br>• En el pago online, entra y sale de la factura: para ti, queda en cero.<br>• En efectivo y en el POS, el cliente te pagó la tasa junto con el pedido. Por eso se deduce en la factura: solo entregas lo que el cliente pagó.${OBS}`),
      seguintes: ['devolucao', 'comissao'],
    },
    {
      id: 'devolucao', tema: 'Taxa de serviço', rever: 8, exemplo: L('O que é o valor devolvido da maquininha?', '¿Qué es el valor devuelto del POS?'),
      k3: L(['devolvido', 'devolucao', 'taxa maquininha', 'valor devolvido'], ['devuelto', 'devolucion', 'tasa pos', 'valor devuelto']), k2: L(['devolve', 'devolvem'], ['devuelve', 'devuelven']), k1: L(['maquininha', 'servico'], ['pos', 'maquinita', 'datafono', 'servicio']),
      r: () => L(
        `A maquininha cobra uma taxa sobre tudo o que passa nela, inclusive sobre a taxa de serviço.<br>Para você não pagar por isso, a plataforma <b>devolve ${PCT(T.devolucaoMaquininha)}</b> das taxas de serviço pagas na maquininha. Esse valor aparece na conta da Taxa de serviço.${OBS}`,
        `El POS cobra una tasa sobre todo lo que pasa por él, incluso sobre la tasa de servicio.<br>Para que no pagues por eso, la plataforma <b>devuelve ${PCT(T.devolucaoMaquininha)}</b> de las tasas de servicio pagadas en el POS. Ese valor aparece en la cuenta de la Tasa de servicio.${OBS}`),
      seguintes: ['taxa_servico', 'dinheiro_maquininha'],
    },
    {
      id: 'taxas', tema: 'Taxas', rever: 6, exemplo: L('Quais taxas são descontadas?', '¿Qué tasas se descuentan?'),
      k3: L(['quais taxa', 'todas taxa', 'deducoes fatura', 'descontos fatura'], ['cuales tasa', 'todas tasa', 'deducciones factura', 'descuentos factura', 'tasas descuentan']), k2: L(['taxa', 'deducao'], ['tasa', 'deduccion']),
      r: () => L(
        'Na fatura, saem do valor do pagamento online:<br>• Débitos remanescentes (se houver)<br>• <b>Comissão</b>, de todas as vendas<br>• <b>Taxa do pagamento online</b>, só das vendas online<br>• <b>Taxa de transferência</b>, despesas bancárias<br>• <b>Taxa de antecipação</b>, só se você antecipar<br>• <b>Taxa de serviço</b>, paga pelo cliente<br>• <b>Mensalidade</b>, quando atinge o faturamento mínimo<br>Pergunte sobre qualquer uma delas.',
        'En la factura, salen del valor del pago online:<br>• Débitos pendientes (si los hay)<br>• <b>Comisión</b>, de todas las ventas<br>• <b>Tasa de Pago Online</b>, solo de las ventas online<br>• <b>Tasa bancaria</b>, gastos bancarios<br>• <b>Tasa de anticipo</b>, solo si anticipas<br>• <b>Tasa de servicio</b>, pagada por el cliente<br>• <b>Mensualidad</b>, cuando se alcanza la facturación mínima<br>Pregunta sobre cualquiera de ellas.'),
      seguintes: ['comissao', 'taxa_servico', 'taxa_online'],
    },
    {
      id: 'taxa_online', tema: 'Taxas', rever: 7, exemplo: L('O que é a taxa do pagamento online?', '¿Qué es la Tasa de Pago Online?'),
      k3: L(['taxa pagamento online', 'taxa online', 'taxa app', 'taxa aplicativo'], ['tasa pago online', 'tasa online', 'tasa app', 'tasa aplicacion']), k2: L(['pagamento online'], ['pago online']), k1: L(['taxa', 'online'], ['tasa', 'online']),
      r: () => L(
        `A <b>taxa do pagamento online</b> vale <b>só</b> para as vendas pagas pelo aplicativo. No treinamento, ${PCT(T.pagamentoOnline)} sobre o valor dessas vendas, sem a taxa de serviço.<br>Para ver a conta: Financeiro → fatura → ⓘ ao lado de Taxa do pagamento online.${OBS}`,
        `La <b>Tasa de Pago Online</b> vale <b>solo</b> para las ventas pagadas por la aplicación. En la capacitación, ${PCT(T.pagamentoOnline)} sobre el valor de esas ventas, sin la tasa de servicio.<br>Para ver la cuenta: Finanzas → factura → ⓘ al lado de Tasa de Pago Online.${OBS}`),
      seguintes: ['transferencia', 'taxa_antecipacao'],
    },
    {
      id: 'transferencia', tema: 'Taxas', rever: 7, exemplo: L('O que é a taxa de transferência?', '¿Qué es la tasa bancaria?'),
      k3: L(['taxa transferencia', '2 50', 'despesa bancaria', 'tarifa bancaria'], ['tasa bancaria', 'tasa transferencia', '2 50', 'gasto bancario', 'tarifa bancaria', 'comision bancaria']), k2: L(['transferencia', 'tarifa'], ['bancaria', 'bancario', 'tarifa']), k1: L(['taxa', 'banco'], ['tasa', 'banco']),
      r: () => L(
        `A <b>taxa de transferência</b> (${R$(T.transferencia)} no treinamento) é referente a despesas bancárias.<br>É cobrada uma única vez no repasse mensal, ou toda vez que você antecipar.${OBS}`,
        `La <b>tasa bancaria</b> (${R$(T.transferencia)} en la capacitación) corresponde a gastos bancarios.<br>Se cobra una sola vez en la transferencia mensual, o cada vez que anticipas.${OBS}`),
      seguintes: ['taxa_antecipacao', 'antecipar'],
    },
    {
      id: 'taxa_antecipacao', tema: 'Taxas', rever: 7, exemplo: L('Quanto custa antecipar?', '¿Cuánto cuesta anticipar?'),
      k3: L(['taxa antecipacao', 'custa antecipar', 'custo antecipacao', 'custa antecipacao', 'cobra antecipar', 'taxa antecipar'], ['tasa anticipo', 'cuesta anticipar', 'costo anticipo', 'costo anticipar', 'cuesta anticipo', 'cobran anticipar', 'tasa anticipar']), k1: L(['antecipacao', 'antecipar', 'taxa'], ['anticipo', 'anticipar', 'tasa']),
      r: () => L(
        `A <b>taxa de antecipação</b> é ${PCT(T.antecipacao)} do total das vendas online, mais a taxa de transferência.<br>Ela já aparece deduzida na fatura, mas <b>só é aplicada se você pedir a antecipação</b>.${OBS}`,
        `La <b>tasa de anticipo</b> es ${PCT(T.antecipacao)} del total de las ventas online, más la tasa bancaria.<br>Ya aparece deducida en la factura, pero <b>solo se aplica si pides el anticipo</b>.${OBS}`),
      seguintes: ['antecipar', 'quando_cai'],
    },
    {
      id: 'antecipar', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: L('Como peço a antecipação?', '¿Cómo pido el anticipo?'),
      k3: L(['como antecipar', 'solicitar antecipacao', 'pedir antecipacao', 'adiantar', 'receber antes', 'adiantamento', 'antecipar valor'], ['como anticipar', 'solicitar anticipo', 'pedir anticipo', 'adelantar', 'recibir antes', 'adelanto', 'anticipar valor', 'quiero anticipar']), k2: L(['antecipar', 'antecipacao', 'antecipo'], ['anticipar', 'anticipo', 'anticipacion']), k1: L(['como', 'pedir', 'solicitar'], ['como', 'pedir', 'solicitar']),
      r: () => L(
        'Para receber antes:<ol class="bt-ol"><li>Abra <b>Financeiro</b></li><li>Toque na fatura do mês</li><li>Confira os valores</li><li>Toque em <b>Solicitar antecipação</b> e depois em <b>CONFIRMAR</b></li></ol>O valor cai no <b>próximo dia útil</b>, na sua chave PIX. Depois de confirmar, os pedidos daquele período não podem mais ser cancelados.',
        'Para recibir antes:<ol class="bt-ol"><li>Abre <b>Finanzas</b></li><li>Toca la factura del mes</li><li>Revisa los valores</li><li>Toca <b>Solicitar anticipo</b> y luego <b>CONFIRMAR</b></li></ol>El valor llega el <b>próximo día hábil</b>, a tu llave PIX. Después de confirmar, los pedidos de ese período ya no se pueden cancelar.'),
      seguintes: ['taxa_antecipacao', 'quando_cai', 'antecipar_tudo'],
    },
    {
      id: 'antecipar_tudo', tema: 'Mensalidade e débitos', rever: 9, exemplo: L('Posso antecipar tudo?', '¿Puedo anticipar todo?'),
      k3: L(['antecipar tudo', 'antecipei tudo', 'antecipo tudo', 'todo dia antecipar', 'sempre antecipar'], ['anticipar todo', 'anticipe todo', 'anticipo todo', 'todo dia anticipar', 'siempre anticipar']), k1: L(['tudo', 'sempre'], ['todo', 'siempre']),
      r: () => L(
        'Pode, sempre que tiver saldo positivo. Só lembre: a <b>mensalidade</b> é deduzida na virada do último dia do mês. Se você antecipou tudo, normalmente não sobra saldo online, e ela vai para a próxima fatura como <b>Débitos remanescentes</b>.',
        'Puedes, siempre que tengas saldo positivo. Solo recuerda: la <b>mensualidad</b> se deduce al cierre del último día del mes. Si anticipaste todo, normalmente no queda saldo online, y pasa a la próxima factura como <b>Débitos pendientes</b>.'),
      seguintes: ['debitos', 'mensalidade'],
    },
    {
      id: 'quando_cai', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: L('Quando cai o meu repasse?', '¿Cuándo llega mi transferencia?'),
      k3: L(['quando cai', 'quando recebo', 'quando vou receber', 'quando caiu', 'nao caiu', 'dia repasse', 'data repasse', 'dia cai', 'dia pagamento', 'repasse mensal', 'segundo dia util', '2 dia util', 'dia util', 'quanto tempo demora', 'prazo repasse'],
        ['cuando llega', 'cuando recibo', 'cuando voy recibir', 'cuando cae', 'cuando pagan', 'no llego', 'no cayo', 'dia transferencia', 'fecha transferencia', 'dia llega', 'dia pago', 'fecha pago', 'transferencia mensual', 'segundo dia habil', '2 dia habil', 'dia habil', 'cuanto tarda', 'plazo transferencia']),
      k2: L(['cai', 'caiu', 'demora', 'receber', 'recebo', 'prazo'], ['llega', 'llego', 'cae', 'cayo', 'tarda', 'recibir', 'recibo', 'plazo']), k1: L(['repasse', 'quando', 'dinheiro'], ['transferencia', 'cuando', 'dinero']),
      r: () => L(
        '• <b>Sem antecipar:</b> o repasse mensal é transferido no <b>2º dia útil do mês seguinte</b> às vendas.<br>• <b>Com antecipação:</b> cai no <b>próximo dia útil</b> depois do pedido.<br>Não há repasses em fins de semana nem em feriados nacionais ou municipais de Rio Pomba - MG. Quando cair, a fatura mostra <b>Repasse realizado</b>.',
        '• <b>Sin anticipar:</b> la transferencia mensual se hace el <b>2º día hábil del mes siguiente</b> a las ventas.<br>• <b>Con anticipo:</b> llega el <b>próximo día hábil</b> después del pedido.<br>No hay transferencias los fines de semana ni en feriados nacionales o municipales de Rio Pomba - MG. Cuando llegue, la factura muestra <b>Transferencia realizada</b>.'),
      seguintes: ['comprovante', 'antecipar', 'pix'],
    },
    {
      id: 'repasse_menor', tema: 'Pagamento online', rever: 9, exemplo: L('Por que o repasse veio menor?', '¿Por qué la transferencia llegó menor?'),
      k3: L(['repasse menor', 'repasse pequeno', 'veio pouco', 'veio menos', 'veio menor', 'recebi pouco', 'recebi menos', 'valor baixo', 'nao bate', 'menor que vendi', 'menos que vendi', 'sumiu dinheiro', 'ficou com dinheiro'],
        ['transferencia menor', 'transferencia pequena', 'llego poco', 'llego menos', 'llego menor', 'vino poco', 'vino menos', 'recibi poco', 'recibi menos', 'valor bajo', 'no cuadra', 'no coincide', 'menor que vendi', 'menos que vendi', 'falta dinero', 'quedo con dinero']),
      k2: L(['menor', 'menos', 'pouco', 'pequeno', 'baixo', 'errado', 'errada', 'erro'], ['menor', 'menos', 'poco', 'pequena', 'bajo', 'equivocado', 'equivocada', 'error', 'incorrecto']), k1: L(['repasse', 'vendi', 'valor'], ['transferencia', 'vendi', 'valor']),
      r: () => L(
        'Porque as deduções de <b>todas</b> as vendas (comissão e taxas) saem <b>só</b> do valor que passou pela plataforma, o pagamento online.<br>O valor das vendas em dinheiro e maquininha <b>já estava com você</b>. Somando esse valor com o repasse, você chega ao <b>Resultado</b> do mês.',
        'Porque las deducciones de <b>todas</b> las ventas (comisión y tasas) salen <b>solo</b> del valor que pasó por la plataforma, el pago online.<br>El valor de las ventas en efectivo y POS <b>ya estaba contigo</b>. Sumando ese valor con la transferencia, llegas al <b>Resultado</b> del mes.'),
      seguintes: ['resultado', 'comissao', 'cardapio'],
    },
    {
      id: 'repasse', tema: 'Pagamento online', rever: 2, exemplo: L('O que é o repasse?', '¿Qué es la transferencia?'),
      k3: L(['significa repasse'], ['significa transferencia']), k2: L(['repasse'], ['transferencia']),
      r: () => L(
        'O <b>repasse</b> é o valor das vendas com pagamento online que fica depois das deduções (comissão e taxas). A plataforma envia esse valor para você.',
        'La <b>transferencia</b> es el valor de las ventas con pago online que queda después de las deducciones (comisión y tasas). La plataforma te envía ese valor.'),
      seguintes: ['quando_cai', 'repasse_menor'],
    },
    {
      id: 'comprovante', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: L('Onde pego o comprovante?', '¿Dónde consigo el comprobante?'),
      k3: L(['comprovante', 'recibo', 'comprovacao', 'prova pagamento', 'comprovante pix', 'baixar comprovante', 'comprovante transferencia'], ['comprobante', 'recibo', 'constancia', 'prueba pago', 'comprobante pix', 'descargar comprobante', 'comprobante transferencia']), k1: L(['repasse', 'transferencia'], ['transferencia']),
      r: () => L(
        'Quando a transferência cai, abra <b>Financeiro</b> e toque na fatura. No mesmo lugar onde fica "Solicitar antecipação", aparece <b>Repasse realizado</b>. Toque em <b>Ver comprovante</b>.',
        'Cuando llega la transferencia, abre <b>Finanzas</b> y toca la factura. En el mismo lugar donde está "Solicitar anticipo", aparece <b>Transferencia realizada</b>. Toca <b>Ver comprobante</b>.'),
      seguintes: ['quando_cai', 'pix'],
    },
    {
      id: 'status_fatura', tema: 'Tela Financeiro', rever: 5, exemplo: L('O que é fatura VIGENTE?', '¿Qué es factura VIGENTE?'),
      k3: L(['vigente', 'antecipada', 'status fatura', 'fatura aberta'], ['vigente', 'anticipada', 'estado factura', 'status factura', 'factura abierta']), k1: L(['fatura', 'status'], ['factura', 'estado', 'status']),
      r: () => L(
        '<b>VIGENTE</b>: a fatura está aberta e o valor ainda não foi transferido.<br><b>ANTECIPADA</b>: você pediu a antecipação e o repasse foi solicitado.',
        '<b>VIGENTE</b>: la factura está abierta y el valor todavía no fue transferido.<br><b>ANTICIPADA</b>: pediste el anticipo y la transferencia fue solicitada.'),
      seguintes: ['antecipar', 'fatura'],
    },
    {
      id: 'fatura', tema: 'Tela Financeiro', rever: 5, exemplo: L('Onde vejo a fatura?', '¿Dónde veo la factura?'),
      k3: L(['onde fatura', 'ver fatura', 'abrir fatura', 'achar fatura'], ['donde factura', 'ver factura', 'abrir factura', 'encontrar factura']), k2: L(['fatura'], ['factura']), k1: L(['onde', 'ver'], ['donde', 'ver']),
      r: () => L(
        'Abra <b>Financeiro</b> no menu. Em <b>Faturas do Período</b>, toque na fatura para ver a conta completa, linha por linha: o que entrou de pagamento online e todas as deduções.',
        'Abre <b>Finanzas</b> en el menú. En <b>Facturas del Período</b>, toca la factura para ver la cuenta completa, línea por línea: lo que entró de pago online y todas las deducciones.'),
      seguintes: ['status_fatura', 'comissao'],
    },
    {
      id: 'debitos', tema: 'Mensalidade e débitos', rever: 6, exemplo: L('O que são débitos remanescentes?', '¿Qué son los débitos pendientes?'),
      k3: L(['debito remanescente', 'remanescente', 'debitos remanescentes'], ['debito pendiente', 'debitos pendientes', 'pendiente']), k2: L(['debito', 'divida', 'devendo', 'saldo negativo', 'negativo'], ['debito', 'deuda', 'debo', 'saldo negativo', 'negativo']),
      r: () => L(
        'São deduções que o saldo online não cobriu em uma fatura anterior. Esse valor <b>não gera boleto na hora</b>: ele aparece na próxima fatura como a primeira dedução.',
        'Son deducciones que el saldo online no cubrió en una factura anterior. Ese valor <b>no genera boleto en el momento</b>: aparece en la próxima factura como la primera deducción.'),
      seguintes: ['boleto', 'antecipar_tudo'],
    },
    {
      id: 'boleto', tema: 'Mensalidade e débitos', rever: 4, exemplo: L('Vou ter que pagar boleto?', '¿Voy a tener que pagar un boleto?'),
      k3: ['boleto', 'boletos', 'pagar boleto'], k1: ['pagar'],
      r: () => L(
        'Pode aparecer um boleto quando o saldo online não cobre a comissão e as taxas. O valor também passa para o mês seguinte como <b>Débitos remanescentes</b>.<br>O boleto deve ser pago caso a loja fique sem saldo online suficiente no pagamento online. Para pagar, acesse Financeiro → <b>Boletos</b>.',
        'Puede aparecer un boleto cuando el saldo online no cubre la comisión y las tasas. El valor también pasa al mes siguiente como <b>Débitos pendientes</b>.<br>El boleto se debe pagar si la tienda se queda sin saldo online suficiente en el pago online. Para pagar, entra en Finanzas → <b>Boletos</b>.'),
      seguintes: ['debitos', 'pagamento_online'],
    },
    {
      id: 'mensalidade', tema: 'Mensalidade e débitos', rever: 8, exemplo: L('Quando tem mensalidade?', '¿Cuándo se cobra la mensualidad?'),
      k3: L(['mensalidade', '59 90', 'faturamento minimo', 'plano mensal'], ['mensualidad', '59 90', 'facturacion minima', 'plan mensual']), k2: L(['mensal', 'plano'], ['mensual', 'plan', 'cuota']),
      r: () => L(
        `A <b>mensalidade</b> (${R$(MS.valor)} no treinamento) só é cobrada quando a loja atinge o <b>faturamento mínimo</b> de ${R$(MS.acimaDeBruto)} em Total Bruto no mês. É um valor fixo, separado da comissão, deduzido na virada do último dia do mês.${OBS}`,
        `La <b>mensualidad</b> (${R$(MS.valor)} en la capacitación) solo se cobra cuando la tienda alcanza la <b>facturación mínima</b> de ${R$(MS.acimaDeBruto)} en Total Bruto en el mes. Es un valor fijo, separado de la comisión, deducido al cierre del último día del mes.${OBS}`),
      seguintes: ['debitos', 'antecipar_tudo'],
    },
    {
      id: 'total_bruto', tema: 'Total Bruto e formas de pagamento', rever: 1, exemplo: L('O que é o Total Bruto?', '¿Qué es el Total Bruto?'),
      k3: L(['total bruto', 'quanto vendi', 'total vendido', 'vendas mes', 'total vendas'], ['total bruto', 'cuanto vendi', 'total vendido', 'ventas mes', 'total ventas']), k2: L(['bruto', 'vendi'], ['bruto', 'vendi']), k1: L(['total', 'relatorio'], ['total', 'informe']),
      r: () => L(
        'O <b>Total Bruto</b> é a soma de tudo o que você vendeu no mês: online, dinheiro e maquininha, com as taxas de serviço. Ele fica na tela <b>Relatório</b>. Toque no ⓘ para ver como é formado.',
        'El <b>Total Bruto</b> es la suma de todo lo que vendiste en el mes: online, efectivo y POS, con las tasas de servicio. Está en la pantalla <b>Informe</b>. Toca el ⓘ para ver cómo se forma.'),
      seguintes: ['resultado', 'dinheiro_maquininha'],
    },
    {
      id: 'resultado', tema: 'Tela Financeiro', rever: 4, exemplo: L('O que é o Resultado?', '¿Qué es el Resultado?'),
      k3: L(['resultado', 'quanto ficou', 'quanto sobrou', 'lucro', 'ficou comigo'], ['resultado', 'cuanto quedo', 'cuanto sobro', 'ganancia', 'lucro', 'quedo conmigo']), k1: L(['financeiro'], ['finanzas']),
      r: () => L(
        'O <b>Resultado</b> é tudo o que ficou com você no mês. É a soma de:<br>• <b>Recebido pela Loja</b> (dinheiro e maquininha, já no seu caixa)<br>• <b>Repasses recebidos</b> (o que já foi transferido)<br>• <b>Repasse disponível</b> (o que ainda vai ser transferido)',
        'El <b>Resultado</b> es todo lo que quedó contigo en el mes. Es la suma de:<br>• <b>Recibido por la Tienda</b> (efectivo y POS, ya en tu caja)<br>• <b>Transferencias recibidas</b> (lo que ya fue transferido)<br>• <b>Transferencia disponible</b> (lo que todavía se va a transferir)'),
      seguintes: ['disponivel', 'repasse_menor'],
    },
    {
      id: 'recebido', tema: 'Tela Financeiro', rever: 4, exemplo: L('O que é Recebido pela Loja?', '¿Qué es Recibido por la Tienda?'),
      k3: L(['recebido loja', 'recebido pela loja'], ['recibido tienda']), k2: L(['recebido'], ['recibido']),
      r: () => L(
        '<b>Recebido pela Loja</b> é o valor das vendas em dinheiro e maquininha. O cliente pagou direto para você, então esse dinheiro <b>já entrou no seu caixa</b>.',
        '<b>Recibido por la Tienda</b> es el valor de las ventas en efectivo y POS. El cliente te pagó directo a ti, así que ese dinero <b>ya entró en tu caja</b>.'),
      seguintes: ['resultado', 'dinheiro_maquininha'],
    },
    {
      id: 'disponivel', tema: 'Tela Financeiro', rever: 4, exemplo: L('Por que o Repasse disponível mudou?', '¿Por qué cambió la Transferencia disponible?'),
      k3: L(['repasse disponivel', 'repasses recebidos', 'repasse recebido', 'disponivel', 'saldo diminuiu', 'saldo caiu', 'saldo mudou', 'volatil'], ['transferencia disponible', 'transferencias recibidas', 'transferencia recibida', 'disponible', 'saldo disminuyo', 'saldo bajo', 'saldo cambio', 'volatil']), k2: L(['saldo', 'diminuiu', 'mudou'], ['saldo', 'disminuyo', 'cambio']), k1: L(['repasse'], ['transferencia']),
      r: () => L(
        '<b>Repasse disponível</b> é o que ainda vai ser transferido. Ele muda todos os dias: se em um dia você tiver só vendas em dinheiro ou maquininha, as deduções dessas vendas saem do saldo online, e ele diminui.<br>Quando o dinheiro cai, o valor sai de Repasse disponível e vai para <b>Repasses recebidos</b>. O Resultado não muda.',
        'La <b>Transferencia disponible</b> es lo que todavía se va a transferir. Cambia todos los días: si en un día solo tienes ventas en efectivo o POS, las deducciones de esas ventas salen del saldo online, y disminuye.<br>Cuando llega el dinero, el valor sale de Transferencia disponible y pasa a <b>Transferencias recibidas</b>. El Resultado no cambia.'),
      seguintes: ['quando_cai', 'resultado'],
    },
    {
      id: 'cupons', tema: 'Cupons', rever: 5, exemplo: L('Quem paga o cupom de desconto?', '¿Quién paga el cupón de descuento?'),
      k3: L(['cupom', 'cupons', 'cupon', 'reembolso', 'incentivo', 'incentivos', 'desconto'], ['cupon', 'cupones', 'reembolso', 'incentivo', 'incentivos', 'descuento']), k1: L(['cliente', 'paga'], ['cliente', 'paga']),
      r: () => L(
        'Quando o Bigou oferece o cupom para o cliente, quem paga o desconto é a <b>plataforma</b>, não você. Você só paga se você criar o cupom. Aceite o pedido normalmente: o valor volta na sua fatura como <b>Reembolso dos incentivos</b>.',
        'Cuando Bigou le ofrece el cupón al cliente, quien paga el descuento es la <b>plataforma</b>, no tú. Solo pagas si tú creas el cupón. Acepta el pedido normalmente: el valor vuelve en tu factura como <b>Reembolso de los incentivos</b>.'),
      seguintes: ['pagamento_online', 'fatura'],
    },
    {
      id: 'pagamento_online', tema: 'Pagamento online', rever: 2, exemplo: L('Preciso cobrar o cliente no pagamento online?', '¿Tengo que cobrarle al cliente en el pago online?'),
      k3: L(['pagamento online', 'pago pelo app', 'pago app', 'pagou aplicativo', 'pago aplicativo', 'cobrar cliente', 'cliente ja pagou', 'pagou online'], ['pago online', 'pagado app', 'pago app', 'pago aplicacion', 'pagado aplicacion', 'cobrar cliente', 'cobrarle cliente', 'cliente ya pago', 'pago en linea']), k2: L(['online', 'aplicativo', 'app'], ['online', 'aplicacion', 'app']), k1: L(['cliente', 'cobrar'], ['cliente', 'cobrar']),
      r: () => L(
        'Nos pedidos com <b>pagamento online</b>, o cliente já pagou pelo aplicativo. Você só precisa aceitar e entregar, <b>sem cobrar o cliente</b>.<br>Esse valor passa primeiro pela plataforma: é dele que saem as deduções, e o que sobra vira o seu repasse.',
        'En los pedidos con <b>pago online</b>, el cliente ya pagó por la aplicación. Solo tienes que aceptar y entregar, <b>sin cobrarle al cliente</b>.<br>Ese valor pasa primero por la plataforma: de él salen las deducciones, y lo que queda se convierte en tu transferencia.'),
      seguintes: ['repasse', 'taxa_online'],
    },
    {
      id: 'dinheiro_maquininha', tema: 'Total Bruto e formas de pagamento', rever: 3, exemplo: L('E as vendas em dinheiro e maquininha?', '¿Y las ventas en efectivo y POS?'),
      k3: L(['maquininha', 'cartao', 'maquina', 'especie', 'venda dinheiro', 'pago dinheiro', 'pagou dinheiro'], ['pos', 'tarjeta', 'maquinita', 'datafono', 'posnet', 'venta efectivo', 'pago efectivo', 'pagado efectivo']), k2: L(['dinheiro'], ['efectivo']), k1: L(['venda', 'pagou'], ['venta', 'pago']),
      r: () => L(
        'Nas vendas em <b>dinheiro</b> e na <b>maquininha</b>, o cliente paga direto para você. O dinheiro já entra no seu caixa (ou na conta da sua maquininha) e <b>não passa pela plataforma</b>.<br>A comissão e as taxas dessas vendas são deduzidas do saldo do pagamento online.',
        'En las ventas en <b>efectivo</b> y con <b>POS</b>, el cliente te paga directo a ti. El dinero ya entra en tu caja (o en la cuenta de tu POS) y <b>no pasa por la plataforma</b>.<br>La comisión y las tasas de esas ventas se deducen del saldo del pago online.'),
      seguintes: ['taxa_servico', 'repasse_menor'],
    },
    {
      id: 'feriado', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: L('Tem repasse no feriado?', '¿Hay transferencia en feriado?'),
      k3: L(['feriado', 'fim semana', 'final semana', 'sabado', 'domingo'], ['feriado', 'fin semana', 'fines semana', 'sabado', 'domingo', 'dia festivo']), k1: L(['repasse', 'cai'], ['transferencia', 'llega']),
      r: () => L(
        'Não há repasses em <b>fins de semana</b> nem em <b>feriados nacionais ou municipais</b> de Rio Pomba - MG (sede da empresa). Nesses casos, o valor cai no próximo dia útil.',
        'No hay transferencias los <b>fines de semana</b> ni en <b>feriados nacionales o municipales</b> de Rio Pomba - MG (sede de la empresa). En esos casos, el valor llega el próximo día hábil.'),
      seguintes: ['quando_cai', 'antecipar'],
    },
    {
      id: 'pix', tema: 'Repasse, antecipação e comprovante', rever: 9, exemplo: L('Em qual conta cai o dinheiro?', '¿A qué cuenta llega el dinero?'),
      k3: L(['pix', 'chave pix', 'dado bancario', 'dados bancario', 'conta bancaria', 'mudar conta', 'trocar conta', 'qual conta'], ['pix', 'llave pix', 'clave pix', 'dato bancario', 'datos bancario', 'cuenta bancaria', 'cambiar cuenta', 'cual cuenta']), k2: L(['banco', 'conta'], ['banco', 'cuenta']),
      r: () => L(
        'A transferência vai para a <b>chave PIX</b> cadastrada. Para evitar atrasos, os dados bancários precisam estar corretos e no nome da pessoa física ou jurídica titular do contrato. Para mudar, fale com o suporte.',
        'La transferencia va a la <b>llave PIX</b> registrada. Para evitar retrasos, los datos bancarios deben estar correctos y a nombre de la persona física o jurídica titular del contrato. Para cambiarlos, habla con soporte.'),
      seguintes: ['quando_cai', 'suporte'],
    },
    {
      id: 'cardapio', tema: 'Taxas', rever: 8, exemplo: L('Posso ajustar meus preços?', '¿Puedo ajustar mis precios?'),
      k3: L(['cardapio', 'ajustar preco', 'aumentar preco', 'mudar preco', 'repassar custo', 'nao absorver'], ['menu', 'carta', 'ajustar precio', 'aumentar precio', 'cambiar precio', 'trasladar costo', 'no absorber']), k2: L(['preco', 'precos'], ['precio', 'precios']),
      r: () => L(
        'Pode. Você pode ajustar o valor dos seus produtos para <b>não absorver o custo da comissão e das taxas</b>. Confira se o seu cardápio está atualizado. Se não estiver, fale com o nosso suporte para atualizar.',
        'Sí. Puedes ajustar el valor de tus productos para <b>no absorber el costo de la comisión y las tasas</b>. Revisa si tu menú está actualizado. Si no lo está, habla con nuestro soporte para actualizarlo.'),
      seguintes: ['comissao', 'suporte'],
    },
    {
      id: 'fora', tema: 'Outros assuntos do painel', exemplo: L('Outros assuntos', 'Otros temas'),
      k3: L(['taxa entrega', 'horario funcionamento', 'cadastrar produto', 'cadastro produto', 'produto novo', 'nota fiscal', 'marketing', 'foto', 'senha', 'imprimir', 'impressora', 'travando', 'travou', 'nao abre', 'cancelar contrato', 'contrato', 'avaliacao', 'avaliacoes', 'entregador', 'motoboy'],
        ['tasa envio', 'costo envio', 'horario', 'registrar producto', 'cargar producto', 'producto nuevo', 'nuevo producto', 'factura fiscal', 'nota fiscal', 'marketing', 'foto', 'contrasena', 'imprimir', 'impresora', 'se traba', 'trabado', 'no abre', 'cancelar contrato', 'contrato', 'calificacion', 'calificaciones', 'resena', 'repartidor', 'motoboy']),
      r: () => L(
        `Esse assunto não faz parte deste treinamento, que fala sobre <b>vendas, taxas e repasses</b>. Fale com o <b>Financeiro Bigou</b>, que vai te ajudar ou encaminhar:<br>${contatoFinanceiro()}<br>Anotamos sua pergunta para melhorar nossos materiais.`,
        `Este tema no forma parte de esta capacitación, que trata de <b>ventas, tasas y transferencias</b>. Habla con <b>Finanzas Bigou</b>, que te va a ayudar o derivar:<br>${contatoFinanceiro()}<br>Anotamos tu pregunta para mejorar nuestros materiales.`),
      seguintes: [],
    },
    {
      id: 'suporte', tema: 'Suporte', exemplo: L('Como falo com o suporte?', '¿Cómo hablo con soporte?'),
      k3: L(['suporte', 'atendente', 'falar alguem', 'falar pessoa', 'humano', 'whatsapp', 'telefone', 'atendimento'], ['soporte', 'agente', 'hablar alguien', 'hablar persona', 'humano', 'whatsapp', 'telefono', 'atencion']), k2: L(['contato', 'ajuda', 'reclamar'], ['contacto', 'ayuda', 'reclamar', 'reclamo']),
      r: () => L(
        `Para falar com uma pessoa, chame o <b>Financeiro Bigou</b>:<br>${contatoFinanceiro()}`,
        `Para hablar con una persona, contacta a <b>Finanzas Bigou</b>:<br>${contatoFinanceiro()}`),
      seguintes: [],
    },
  ];
  const POR_ID = new Map(INTENCOES.map((x) => [x.id, x]));
  const POPULARES = ['quando_cai', 'cancelado', 'taxa_servico', 'repasse_menor', 'antecipar', 'comprovante'];

  /* ------------------------------ Entendimento ------------------------------ */
  // Em espanhol, "no" é negação (em português é "em + o") e fica na pergunta
  const PARADAS = new Set(L('a o as os e de da do das dos um uma uns umas no na nos nas em ao aos pra pro para pelo pela pelos pelas por que q pq porque meu minha meus minhas eu me mim voce vc se com sem isso esse essa este esta ta tá ja e é eh qual quais ou mas tem ter foi sao sua seu',
    'a o y e u el la los las lo un una unos unas de del al en para por que q pq xq porque mi mis tu tus su sus yo me te se le les con sin eso esa ese este esta esto es son fue hay ya pero cuales mas').split(' '));
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const raiz = (w) => (w.length <= 3 ? w : w.replace(/(oes|aes)$/, 'ao').replace(/ais$/, 'al').replace(/eis$/, 'el').replace(/s$/, ''));
  const ABREV = L({ qnd: 'quando', qdo: 'quando', qd: 'quando', vcs: 'voces', tb: 'tambem', tbm: 'tambem', msg: 'mensagem', hj: 'hoje', dps: 'depois', n: 'nao' },
    { cdo: 'cuando', qdo: 'cuando', dnd: 'donde', tb: 'tambien', tmb: 'tambien', msj: 'mensaje', x: 'por', n: 'no' });
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

  const RX_OI = L(/^(oi+|ola|opa|bom dia|boa tarde|boa noite|e ai|eai|hey|ei)\b/, /^(hola+|ola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|que tal|hey|ey|oi+)\b/);
  const RX_OBG = L(/^(obrigad[oa]|brigad[oa]|valeu|vlw|agradeco|show|beleza|blz|ok|certo|entendi|perfeito|top)\b/, /^(gracias|muchas gracias|mil gracias|genial|perfecto|ok|okay|vale|dale|listo|entendido|entendi|claro|excelente|buenisimo|obrigad[oa])\b/);

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
          <div class="bt-h-t"><b id="bt-titulo">${L('Assistente Bigou', 'Asistente Bigou')}</b><small><i></i>${L('Online · responde na hora', 'En línea · responde al instante')}</small></div>
          <button type="button" class="bt-ib" data-bt="novo" title="${L('Nova conversa', 'Nueva conversación')}" aria-label="${L('Nova conversa', 'Nueva conversación')}">${IC.novo}</button>
          <button type="button" class="bt-ib" data-bt="fechar" title="${L('Fechar', 'Cerrar')}" aria-label="${L('Fechar', 'Cerrar')}">${IC.x}</button>
        </header>
        <div class="bt-msgs" aria-live="polite"></div>
        <form class="bt-form" autocomplete="off">
          <input type="text" maxlength="300" placeholder="${L('Escreva sua dúvida…', 'Escribe tu duda…')}" aria-label="${L('Sua dúvida', 'Tu duda')}" enterkeyhint="send">
          <button type="submit" class="bt-send" aria-label="${L('Enviar', 'Enviar')}" disabled>${IC.enviar}</button>
        </form>
        <p class="bt-priv">${L('Suas perguntas ajudam a melhorar o sistema. Não envie dados pessoais nem bancários.', 'Tus preguntas ayudan a mejorar el sistema. No envíes datos personales ni bancarios.')}</p>
      </section>`;
    document.body.append(fab, pop, wrap);
    el = { fab, pop, wrap, msgs: wrap.querySelector('.bt-msgs'), form: wrap.querySelector('.bt-form'), input: wrap.querySelector('input'), send: wrap.querySelector('.bt-send'), panel: wrap.querySelector('.bt-panel') };

    fab.addEventListener('click', () => {
      if (!st.liberado) return mostrarPop(L(
        `<b>Conclua o treinamento para liberar o assistente.</b><span>Falta${st.restantes === 1 ? '' : 'm'} ${st.restantes} ${st.restantes === 1 ? 'módulo' : 'módulos'}.</span><a href="#/comecar" class="bt-pop-a">Continuar ${IC.seta}</a>`,
        `<b>Completa la capacitación para habilitar el asistente.</b><span>Falta${st.restantes === 1 ? '' : 'n'} ${st.restantes} ${st.restantes === 1 ? 'módulo' : 'módulos'}.</span><a href="#/comecar" class="bt-pop-a">Continuar ${IC.seta}</a>`), true);
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
    el.fab.setAttribute('aria-label', st.liberado ? L('Abrir assistente de dúvidas', 'Abrir asistente de dudas') : L('Assistente de dúvidas (bloqueado)', 'Asistente de dudas (bloqueado)'));
    el.fab.hidden = !st.visivel;
    if (!st.visivel) { fecharPop(); if (st.aberto) fechar(true); }
    // Anúncio na primeira vez que aparece liberado
    if (st.liberado && st.visivel && !ler(chaveAnuncio(), false)) {
      gravar(chaveAnuncio(), true);
      el.fab.classList.add('novo');
      setTimeout(() => mostrarPop(L('<b>Tem dúvidas? 💬</b><span>Pergunte aqui sobre vendas, taxas e repasses, a qualquer momento.</span>', '<b>¿Tienes dudas? 💬</b><span>Pregunta aquí sobre ventas, tasas y transferencias, en cualquier momento.</span>')), antes ? 0 : 600);
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

  const feedbackOk = (util) => (util ? L('Que bom! 👍', '¡Qué bien! 👍') : L('Obrigado! Vamos melhorar essa resposta.', '¡Gracias! Vamos a mejorar esta respuesta.'));
  const chips = (ids, origem) => (ids.length ? `<div class="bt-chips">${ids.map((id) => POR_ID.get(id)).filter(Boolean).map((x) => `<button type="button" class="bt-chip" data-bt="q" data-id="${x.id}" data-or="${origem}">${esc(x.exemplo)}</button>`).join('')}</div>` : '');

  function htmlBot(m) {
    const loja = st.loja ? `, <b>${esc(st.loja)}</b>` : '';
    if (m.k === 'oi') return `<div class="bt-b">${L(`Olá${loja}! 👋 Sou o assistente do treinamento.<br>Pergunte com suas palavras ou toque em uma dúvida comum:`, `¡Hola${loja}! 👋 Soy el asistente de la capacitación.<br>Pregunta con tus palabras o toca una duda común:`)}</div>${chips(POPULARES, 'inicio')}`;
    if (m.k === 'obrigado') return `<div class="bt-b">${L('Por nada! Se surgir outra dúvida, é só perguntar. 😊', '¡De nada! Si te surge otra duda, solo pregunta. 😊')}</div>`;
    if (m.k === 'sem') return `<div class="bt-b">${L('Ainda não sei responder essa. 😕 Tente com outras palavras ou escolha um assunto:', 'Todavía no sé responder eso. 😕 Intenta con otras palabras o elige un tema:')}</div>${chips(POPULARES.slice(0, 4), 'sem')}<div class="bt-b">${L('Se preferir, fale com o <b>Financeiro Bigou</b>:', 'Si prefieres, habla con <b>Finanzas Bigou</b>:')}<br>${contatoFinanceiro()}</div>`;
    if (m.k === 'contato') return `<div class="bt-b">${L('Sentimos muito. 😕 Para resolver com uma pessoa, fale com o <b>Financeiro Bigou</b>:', 'Lo sentimos. 😕 Para resolverlo con una persona, habla con <b>Finanzas Bigou</b>:')}<br>${contatoFinanceiro()}</div>`;
    if (m.k === 'sug') return `<div class="bt-b">${L('Você quis dizer:', '¿Quisiste decir…?')}</div>${chips(m.ids, 'sugestao')}`;
    const x = POR_ID.get(m.id);
    if (!x) return '';
    let r = x.r();
    if (r.includes('bt-obs')) { if (m.obs) r = r.replace(OBS, '') + OBS; else r = r.replace(OBS, ''); }
    return `<div class="bt-b">${r}</div>
      <div class="bt-acts">
        ${x.rever ? `<a class="bt-rever" href="#/modulo/${x.rever}">${L('Rever no treinamento', 'Repasar en la capacitación')} ${IC.seta}</a>` : ''}
        ${x.id === 'fora' ? '' : m.fb == null ? `<span class="bt-fb" data-msg="${m.n}"><small>${L('Ajudou?', '¿Te ayudó?')}</small><button type="button" data-bt="fb" data-v="1" aria-label="${L('Ajudou', 'Me ayudó')}">${IC.up}</button><button type="button" data-bt="fb" data-v="0" aria-label="${L('Não ajudou', 'No me ayudó')}">${IC.down}</button></span>`
          : `<span class="bt-fb-ok">${feedbackOk(m.fb)}</span>`}
      </div>
      ${x.seguintes && x.seguintes.length ? `<small class="bt-mais">${L('Talvez você queira saber:', 'Quizás quieras saber:')}</small>${chips(x.seguintes, 'seguinte')}` : ''}`;
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
    d.innerHTML = `<div class="bt-b bt-typing" aria-label="${L('Digitando', 'Escribiendo')}"><i></i><i></i><i></i></div>`;
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
      box.outerHTML = `<span class="bt-fb-ok">${feedbackOk(util)}</span>`;
      if (!util) digitando(() => adicionar({ de: 'bot', k: 'contato' }));   // não ajudou: oferece falar com uma pessoa
    }
  }

  TREINO.Bot = Bot;
})();
