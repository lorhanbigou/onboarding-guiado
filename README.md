# Treinamento Financeiro — onboarding guiado para parceiros

Treinamento interativo (Product Tour com spotlight) feito sobre um clone das telas **Pedidos**, **Relatório** e **Financeiro** do painel do parceiro.

## Como abrir

```bash
node serve.js
```

Depois acesse <http://localhost:5178>. Também funciona abrindo o `index.html` direto no navegador.

Painel admin: <http://admin.localhost:5178> (ou <http://localhost:5178/admin>).

### Dados do treinamento

Há um único conjunto de dados fictícios, igual para todos os parceiros (`TREINO.dados` em `js/data.js`): cerca de R$729 em vendas no mês, com mensalidade (passou de R$500), um débito remanescente do mês anterior, pedidos acima de R$100 e **1 pedido cancelado por tempo** (entra na comissão). A tela Pedidos mostra 3 pedidos de hoje, um deles aguardando confirmação. Assim, todos os assuntos aparecem na tela.

**Datas:** os valores são fixos, mas as datas acompanham o dia de hoje. A fatura mostra sempre o mês atual, do dia 1 até ontem; os pedidos são distribuídos nesse período e a antecipação cai no próximo dia útil. Para testar outro dia, use `?data=AAAA-MM-DD` (ex.: `index.html?data=2026-10-15`).

**Tela inicial:** o mais simples possível. Uma ação principal grande (Começar, Continuar ou Ver meu certificado) e 4 botões quadrados: Módulos, Dicas, Explorar a tela e Certificado.

**Dicas importantes** (`#/dicas`): 6 orientações recolhidas (cupons, pagamento online, antecipação, repasse mensal, boleto e pedidos com tempo expirado), em `js/dicas.js`. Versões curtas aparecem como "Dica" no rodapé dos balões relacionados.

**Aviso:** a tela inicial, a abertura do Módulo 1 e o certificado deixam claro que tudo é fictício e ilustrativo, inclusive comissão e taxas, e que os valores reais estão no contrato.

## Módulos (10, em 4 fases)

| Fase | Módulos |
|---|---|
| Vendas e pagamentos | 1. Suas vendas · 2. Pagamento online · 3. Dinheiro e maquininha |
| Tela Financeiro | 4. Tela Financeiro |
| A fatura | 5. O que entrou de pagamento online · 6. Comissão (com pedidos cancelados por tempo e a tela Pedidos) · 7. Taxas · 8. Taxa de serviço e mensalidade |
| Repasse e prática | 9. Repasse e antecipação (com o comprovante) · 10. Exercício final |

Só aparecem telas que existem no sistema: Pedidos, Relatório, Total Bruto, Financeiro, fatura, Comissão, Taxa de Pagamento Online, Taxa de Serviço, Antecipação, Repasse realizado, Boletos e Repasses.

### Para deixar o treinamento mais leve

- **Desafio rápido:** os módulos 1 a 9 terminam com uma pergunta curta de revisão; o módulo 10 é o exercício final.
- **Retomar de onde parou:** o último passo de cada módulo fica salvo. Ao voltar, o módulo continua ali (com a opção "Recomeçar"), e a tela inicial mostra "Continuar · Módulo X, passo Y".
- **Tempo estimado:** cada módulo mostra quanto leva (≈ 12 s por passo de leitura e 25 s por passo de clique ou pergunta), na lista de módulos.
- **Ícones, medalhas e celebração:** cada módulo tem um ícone. Ao fechar uma fase, aparece a medalha "Fase concluída". Confete curto ao concluir um módulo, maior ao terminar tudo (desligado para quem prefere menos movimento).
- **Nome da loja:** saudação na tela inicial e "Mandou bem, {loja}!" no fim de cada módulo.
- **Certificado** (`#/certificado`): liberado com **100% do conteúdo visto** e **mais de 70% de acertos** (19 perguntas; vale a 1ª tentativa de cada uma). Enquanto não libera, a tela mostra o que falta e quais módulos refazer; refazer um módulo substitui as respostas dele. Mostra o nome da loja, a cidade, a data e a % de acertos. "Baixar ou imprimir" abre a impressão do navegador (dá para salvar em PDF).

## Cadastro da loja e painel admin (analytics)

Antes de começar, o parceiro digita o **nome da loja** e escolhe a **cidade** (lista fixa em `js/cidades.js`). Isso identifica o parceiro no painel; a tela do treinamento continua com "Loja de Treinamento". O link "Trocar loja" na tela inicial permite cadastrar outra loja no mesmo aparelho.

O treinamento registra eventos (acesso, início e fim de módulo, cada passo e o tempo nele, saídas no meio, etapas puladas, respostas dos desafios e do exercício, narração, dicas abertas, certificado). Eles ficam numa fila no aparelho e são enviados em lote para o Supabase; sem internet, são reenviados depois.

**Painel:** fica em `admin/index.html` e abre em dois endereços:
- na raiz de qualquer endereço que comece com `admin.`: localmente <http://admin.localhost:5178>; publicado, aponte o subdomínio (ex.: `admin.seudominio`) para o mesmo site. O `serve.js` já faz isso; em outra hospedagem, configure o subdomínio para servir a pasta `admin/`;
- em `/admin` do próprio site (ex.: <http://localhost:5178/admin>).

Tem navegação por seções e mostra:
- saúde do treinamento: taxa de conclusão em anel, com status (saudável, atenção, crítico) e a frase "De cada 10 lojas que começam, X terminam";
- KPIs com explicação e comparação com o período anterior (cadastradas, começaram, concluíram, em andamento, não começaram, tempo para concluir, acessos, ativas em 7 dias);
- destaques automáticos;
- funil visual do cadastro até o último módulo, com o gargalo destacado (e o detalhe iniciaram × concluíram por módulo);
- gargalos em ranking: onde param, passos mais demorados e etapas puladas;
- perguntas: acerto na 1ª tentativa dos desafios rápidos e do exercício final;
- cidades (ranking, top 10, cidades sem cadastro);
- acessos por dia e mapa de calor por dia/hora;
- perfil de uso;
- tabela de lojas com filtro por status, busca, ordenação, último acesso relativo e exportação em CSV.

Tudo responde aos filtros de período e cidade. Os indicadores principais comparam com o período anterior de mesmo tamanho.

Enquanto o Supabase não estiver configurado, o painel abre com **dados de demonstração** (ou force com `?demo=1`).

### Como ligar o Supabase (uma vez)

1. Crie um projeto em <https://supabase.com> (plano grátis).
2. Em **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql`. Antes de rodar, troque `admin@bigou.app` (no fim do arquivo) pelo e-mail do admin. Depois, clique em **Run**.
3. Em **Authentication → Users → Add user**, crie esse usuário com e-mail e senha e marque "Auto Confirm User". Essa é a senha única do painel.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** para `js/analytics-config.js`, junto com o e-mail do admin.
5. Publique o site. No painel, entre com a senha.

Segurança: a chave `anon` é pública por natureza. As regras (RLS) do `schema.sql` deixam o público **apenas inserir** dados, e só o usuário cujo e-mail está em `treino_admins` consegue **ler**.

## Narração por voz (opcional)

O parceiro liga a narração pelo botão de alto-falante no topo da tela inicial ou pelo botão **Narração** na barra do módulo. A escolha fica salva no navegador. Com a narração ligada:

- cada balão é lido em voz alta;
- o botão de alto-falante no balão lê de novo;
- no exercício, a resposta também é lida.

Ela usa a voz em português do Brasil do próprio aparelho (Web Speech API): não precisa de internet, arquivos de áudio nem serviço pago. A voz é lida direto do texto do balão, então sempre bate com os números da tela.

Regras de fluidez:

- cada balão é falado **uma vez** e a fala para no fim; só repete pelo botão de alto-falante;
- a fala para ao avançar, voltar, clicar no item destacado, sair do módulo ou trocar de aba;
- o texto falado é montado para conversa: contas viram frase corrida ("…menos as deduções, 250 reais e 62 centavos. Assim, o repasse fica em 206 reais…"), o título não é repetido, e a abertura e o fim do módulo são curtos;
- valores, percentuais e datas são ditos por extenso, e palavras em maiúsculas (VIGENTE, PIX) não são soletradas;
- um passo pode ter o campo `fala` em `js/modules.js` para trocar o texto falado sem mudar o balão.

Vozes, em ordem de preferência: vozes neurais do Edge/Windows ("Francisca" ou "Thalita", as mais naturais); vozes "Premium/Aprimorada" do Mac/iPhone; "Google português do Brasil" no Chrome; "Luciana" no Mac. As vozes robóticas do macOS (Eddy, Grandma etc.) nunca são usadas. Dica: no Mac, instalar a "Luciana (Aprimorada)" em Ajustes > Acessibilidade > Conteúdo Falado deixa a voz bem mais natural. Se o aparelho não tiver voz em português, o botão aparece desativado.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `js/data.js` | Dados fixos: loja, pedidos, taxas e mensalidade |
| `js/calc.js` | Lógica de cálculo |
| `js/clone.js` | Tela clonada: Pedidos, Relatório, Financeiro, fatura e modais |
| `js/modules.js` | Conteúdo dos 10 módulos (textos, passos, desafios e exercício final) |
| `js/dicas.js` | Dicas importantes da tela inicial |
| `js/cidades.js` | Lista de cidades do cadastro |
| `js/analytics-config.js` | URL/chave do Supabase e e-mail do admin |
| `js/analytics.js` | Fila e envio dos eventos do treinamento |
| `admin/index.html`, `js/admin.js`, `css/admin.css` | Painel admin com analytics |
| `supabase/schema.sql` | Tabelas e regras de segurança do banco |
| `js/voz.js` | Narração: escolhe a voz pt-BR, transforma valores e datas em fala e lê o balão |
| `js/tour.js` | Motor do spotlight / balões / passos de clique / quiz |
| `js/app.js` | Tela inicial, dicas, lista de módulos, modo livre, revisão, certificado e progresso |

## Regras de cálculo

Estas taxas ficam em `TREINO.config` (`js/data.js`):

- **Valor Bruto do pedido** = produtos + taxa de serviço. **Valor Líquido** = Bruto − incentivo.
- **Comissão** = 12% × (total bruto das vendas confirmadas e das canceladas por tempo − taxas de serviço).
- **Pedido cancelado por tempo** = não foi aceito nem recusado em 15 minutos. A loja não recebe o valor (não entra no Relatório nem nas entradas da fatura), mas ele entra na comissão.
- **Taxa do pagamento online** = 4% × (bruto das vendas online − taxas de serviço online).
- **Taxa de antecipação** = 1,99% × total bruto das vendas online. Aparece na fatura já descontada.
- **Taxa de serviço do pedido** (paga pelo cliente) = R$0,99; R$1,99 em pedidos acima de R$100,00.
- **Taxa de serviço (fatura)** = todas as taxas de serviço − 4% das taxas pagas na maquininha. Online, a taxa entra e sai da fatura; em dinheiro e maquininha, ela ficou no caixa da loja e é deduzida aqui.
- **Taxa de transferência** = R$2,50 (despesas bancárias do envio).
- **Mensalidade** = R$59,90, cobrada apenas quando a loja atinge o faturamento mínimo (R$500,00 em Total Bruto). É deduzida na virada do último dia do mês.
- **Débitos remanescentes** = deduções que o saldo online não cobriu. Passam para a próxima fatura como primeira dedução (`debitoRemanescente` em `TREINO.dados`). Pode aparecer um boleto, mas ele só deve ser considerado se a loja ficar três meses seguidos sem saldo online suficiente.
- **Repasse mensal** = sem antecipação, o saldo positivo é enviado no 2º dia útil do mês seguinte às vendas. Não há repasse automático durante o mês, nem em fins de semana e feriados (nacionais ou de Rio Pomba - MG).
- **Repasse** = líquido online + reembolso dos incentivos + taxas de serviço online − todas as deduções. Se der negativo, a diferença vai para a próxima fatura como débito remanescente.
- **Resultado** = Recebido pela Loja (dinheiro + maquininha) + Repasses recebidos + Repasse disponível.
- **Antecipação**: todas as faturas começam VIGENTE (valor em "Repasse disponível"). Ao CONFIRMAR, a fatura vira ANTECIPADA e o valor vai para "Repasses recebidos". O Resultado não muda.
- **Comprovante**: quando a transferência cai, a fatura mostra "Repasse realizado" com o link "Ver comprovante", no mesmo lugar de "Solicitar antecipação".

Todo número mostrado nos textos vem desse cálculo. Mudou um pedido em `data.js`, a tela e as explicações se atualizam juntas.
