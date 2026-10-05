/* =========================================================================
   DADOS DO TREINAMENTO
   Tudo aqui é fictício e ilustrativo. Os VALORES são fixos; as DATAS
   acompanham o dia de hoje (mês atual, do dia 1 até ontem).
   Para testar outro dia: ?data=AAAA-MM-DD na URL.
   ========================================================================= */
window.TREINO = {};

/* ------------------------------ Datas ------------------------------ */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const pad2 = (n) => String(n).padStart(2, '0');
const fmtData = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

TREINO.hoje = (function () {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('data') : null;
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
    const [y, m, d] = q.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
})();

TREINO.periodo = (function (hoje) {
  const ano = hoje.getFullYear(), mes = hoje.getMonth();
  const fimDia = Math.max(1, hoje.getDate() - 1);              // do dia 1 até ontem
  const prox = new Date(ano, mes, hoje.getDate() + 1);          // próximo dia útil (sem sábado e domingo)
  while (prox.getDay() === 0 || prox.getDay() === 6) prox.setDate(prox.getDate() + 1);
  return {
    ano, mes, fimDia,
    inicio: fmtData(new Date(ano, mes, 1)),
    fim: fmtData(new Date(ano, mes, fimDia)),
    proximoDiaUtil: fmtData(prox),
    nomeMes: MESES[mes],
  };
})(TREINO.hoje);

TREINO.config = {
  loja: { nome: 'Loja de Treinamento', cidade: 'Rio Pomba - MG' },
  mes: `${TREINO.periodo.nomeMes.toUpperCase()} ${TREINO.periodo.ano}`,
  mesExtenso: `${TREINO.periodo.nomeMes} de ${TREINO.periodo.ano}`,

  /* Regras (estrutura da conta extraída da tela de referência):
     - Comissão: 12% sobre (total bruto − taxas de serviço)
     - Taxa do pagamento online: 4% sobre (bruto online − taxas de serviço online)
     - Taxa de antecipação: 1,99% sobre o total bruto das vendas online
       (já aparece descontada na fatura; só é cobrada se o parceiro antecipar)
     - Taxa de serviço (paga pelo cliente): R$ 0,99 por pedido; R$ 1,99 em pedidos acima de R$ 100,00
     - Taxa de serviço devolvida da maquininha: 4% das taxas de serviço pagas na maquininha
     - Taxa de transferência: R$ 2,50 por repasse (despesas bancárias)
     - Mensalidade: R$ 59,90 quando o Total Bruto do mês passa de R$ 500,00
       (deduzida na virada do último dia do mês)
     - Débitos remanescentes: quando o saldo online não cobre as deduções, a
       diferença vai para a próxima fatura (não gera boleto) */
  taxas: {
    comissao: 0.12,
    pagamentoOnline: 0.04,
    antecipacao: 0.0199,
    devolucaoMaquininha: 0.04,
    transferencia: 2.5,
  },
  mensalidade: { valor: 59.9, acimaDeBruto: 500 },
  taxaServico: { normal: 0.99, maior: 1.99, acimaDe: 100 },
};

const CLIENTES = [
  'Ana Paula Souza', 'Bruno Henrique Lima', 'Carla Mendes', 'Diego Ramos', 'Elaine Costa',
  'Fábio Nunes', 'Gabriela Rocha', 'Heitor Alves', 'Isabela Martins', 'João Pedro Silva',
  'Karina Duarte', 'Lucas Ferreira', 'Mariana Teixeira', 'Nathan Oliveira', 'Olívia Barros',
  'Paulo César Dias', 'Queila Moura', 'Rafael Pinto', 'Sabrina Lopes', 'Tiago Cardoso',
];

/* Pedido: código, cliente, forma de pagamento, valor dos produtos, cupom do Bigou,
   dia de referência (1 a 27) e horário. O dia é espalhado de forma proporcional
   dentro do período real da fatura (dia 1 até ontem).
   A taxa de serviço (paga pelo cliente) depende do valor do pedido. */
const DIA_REF_MAX = 27;
function O(cod, cli, pag, itens, cupom, diaRef, hora) {
  const ts = TREINO.config.taxaServico;
  const taxa = itens > ts.acimaDe ? ts.maior : ts.normal;
  const P = TREINO.periodo;
  const dia = Math.min(P.fimDia, 1 + Math.round(((diaRef - 1) * (P.fimDia - 1)) / (DIA_REF_MAX - 1)));
  const data = `${fmtData(new Date(P.ano, P.mes, dia))} ${hora}`;
  return { cod, cliente: CLIENTES[cli % CLIENTES.length], pag, itens, cupom: cupom || 0, taxa, data };
}
const FATURA = () => ({ inicio: TREINO.periodo.inicio, fim: TREINO.periodo.fim, status: 'VIGENTE' });

/* Dados únicos do treinamento: uns R$730 vendidos, com mensalidade (passou de R$500),
   débito remanescente do mês anterior e alguns pedidos acima de R$100. */
TREINO.dados = {
  // Mensalidade do mês anterior: deduzida na virada do mês, sem saldo online (faturas antecipadas)
  debitoRemanescente: 59.9,
  fatura: FATURA(),
  antecipacaoData: TREINO.periodo.proximoDiaUtil,
  orders: [
    O(9200101, 5, 'online', 42.9, 0, 2, '19:05'),
    O(9200102, 6, 'dinheiro', 49.0, 0, 4, '20:14'),
    O(9200103, 7, 'online', 118.0, 8.0, 6, '19:37'),
    O(9200104, 8, 'maquininha', 39.0, 0, 9, '20:51'),
    O(9200105, 9, 'online', 38.5, 0, 11, '18:58'),
    O(9200106, 10, 'dinheiro', 33.0, 0, 13, '21:10'),
    O(9200107, 11, 'online', 61.0, 5.0, 16, '19:22'),
    O(9200108, 12, 'maquininha', 25.5, 0, 18, '20:03'),
    O(9200109, 13, 'online', 105.0, 0, 20, '19:44'),
    O(9200110, 14, 'dinheiro', 104.0, 0, 23, '20:30'),
    O(9200111, 15, 'maquininha', 14.5, 0, 25, '18:47'),
    O(9200112, 16, 'online', 35.6, 0, 26, '19:15'),
    O(9200113, 17, 'online', 47.0, 0, 27, '20:02'),
  ],
};
