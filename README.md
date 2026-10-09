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
- **Avaliação** (`#/avaliacao`): ao concluir os 10 módulos, antes do certificado, a loja responde "Esse treinamento te ajudou?" (Sim/Não), dá de 1 a 5 estrelas e pode deixar um comentário. Aparece uma vez e vai para o painel (seção Uso).
- **Certificado** (`#/certificado`): liberado com **100% do conteúdo visto** e **mais de 70% de acertos** (19 perguntas; vale a 1ª tentativa de cada uma). Enquanto não libera, a tela mostra o que falta e quais módulos refazer; refazer um módulo substitui as respostas dele. Mostra o nome da loja, a cidade, a data e "Bigou Delivery" (a nota não aparece no certificado). "Baixar ou imprimir" abre a impressão do navegador (dá para salvar em PDF).

## Cadastro da loja e painel admin (analytics)

Antes de começar, o parceiro digita o **nome da loja** e escolhe a **cidade** (lista fixa em `js/cidades.js`). Isso identifica o parceiro no painel; a tela do treinamento continua com "Loja de Treinamento". O link "Trocar loja" na tela inicial permite cadastrar outra loja no mesmo aparelho.

O treinamento registra eventos (acesso, início e fim de módulo, cada passo e o tempo nele, saídas no meio, etapas puladas, respostas dos desafios e do exercício, narração, dicas abertas, certificado). Eles ficam numa fila no aparelho e são enviados em lote para o Supabase; sem internet, são reenviados depois.

**Painel:** fica em `admin/index.html` e abre em dois endereços:
- na raiz de qualquer endereço que comece com `admin.`: localmente <http://admin.localhost:5178>; publicado, aponte o subdomínio (ex.: `admin.seudominio`) para o mesmo site. O `serve.js` já faz isso; em outra hospedagem, configure o subdomínio para servir a pasta `admin/`;
- em `/admin` do próprio site (ex.: <http://localhost:5178/admin>).

O painel responde a três perguntas: o treinamento está funcionando, o que os parceiros não entenderam e quem precisa de contato. Seções:
- **Resumo:** 4 números (cadastradas, começaram, concluíram, certificadas) com comparação com o período anterior, a frase "De cada 10 lojas que começam, X terminam" e até 3 ações em "O que fazer agora";
- **Jornada:** 5 marcos (cadastrou → começou → metade → concluiu → certificou) com a maior perda destacada, e os módulos onde as lojas param, com o passo de saída e o mais demorado;
- **Assuntos:** acerto de primeira por assunto (campo `tema` das perguntas em `js/modules.js`), do pior para o melhor. Ao abrir, mostra as perguntas e a resposta errada mais escolhida;
- **Lojas para acompanhar:** situação de cada loja com o motivo. "Precisam de contato" junta as paradas (começaram e estão há 7 dias sem atividade), as que não começaram (cadastradas há 3 dias ou mais) e as que concluíram sem certificado (até 70% de acerto). Tem busca, ordenação e CSV com situação, motivo, acerto e assunto com mais erro;
- **Cidades:** lojas, conclusão, certificadas e contatos pendentes por cidade;
- **Uso:** tempo para concluir, % no celular, % que usou a narração, a avaliação do treinamento (ajudou, estrelas e comentários) e o gráfico diário de acessos e conclusões.

O filtro de período considera a data de cadastro da loja (7, 14 ou 28 dias, ou todo o período). Os limites de 7 e 3 dias ficam em `PARADA_DIAS` e `SEM_INICIO_DIAS` (`js/admin.js`).

Enquanto o Supabase não estiver configurado, o painel abre com **dados de demonstração** (ou force com `?demo=1`).

### Como ligar o Supabase (uma vez)

1. Crie um projeto em <https://supabase.com> (plano grátis).
2. Em **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql`. Antes de rodar, troque `admin@bigou.app` (no fim do arquivo) pelo e-mail do admin. Depois, clique em **Run**.
3. Em **Authentication → Users → Add user**, crie esse usuário com e-mail e senha e marque "Auto Confirm User". Essa é a senha única do painel.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** para `js/analytics-config.js`, junto com o e-mail do admin.
5. Publique o site. No painel, entre com a senha.

Segurança: a chave `anon` é pública por natureza. As regras (RLS) do `schema.sql` deixam o público **apenas inserir** dados, e só o usuário cujo e-mail está em `treino_admins` consegue **ler**.

## Assistente de dúvidas (chat)

**Desligado no momento** (`TREINO.config.recursos.assistente = false` em `js/data.js`). Com ele desligado, o botão não aparece e o painel esconde a seção "Dúvidas do chat". Para religar, troque para `true`.

Botão flutuante no canto da tela, liberado quando a loja **conclui os 10 módulos** (antes disso aparece com cadeado e mostra quantos módulos faltam). Não aparece dentro dos módulos guiados nem no cadastro.

- **Sem IA e sem custo:** as respostas ficam em `js/bot.js` (lista `INTENCOES`), escritas a partir do conteúdo do treinamento. Cada intenção tem palavras-chave com peso (`k3`, `k2`, `k1`), a resposta, o módulo para "Rever no treinamento" e perguntas relacionadas.
- **Entendimento:** ignora acentos, maiúsculas, plural e palavras comuns, aceita erros de digitação ("comição") e abreviações ("qnd", "pq"). Se houver dúvida entre assuntos, mostra "Você quis dizer…". Perguntas fora do treinamento (cardápio, horário, nota fiscal…) são encaminhadas ao suporte.
- **No chat:** perguntas prontas, "digitando…", 👍/👎 em cada resposta, nova conversa e histórico salvo no aparelho. Lê a resposta em voz alta se a narração estiver ligada.
- **Coleta** (tabela `treino_eventos`, sem mudar o banco): `duvida` (texto, assunto, resultado: respondida, sugestão, sem resposta ou fora do treinamento), `duvida_escolha`, `duvida_feedback` e `bot_aberto`. CPF, telefone, e-mail e números longos são trocados por `[removido]` antes de enviar.
- **Painel → Dúvidas do chat:** perguntas, % respondidas de primeira, % que ajudou, assuntos mais perguntados, perguntas sem resposta ou fora do treinamento, respostas que não ajudaram e exportação em CSV.

Para melhorar o bot: veja no painel as perguntas sem resposta e as respostas com 👎, e ajuste ou crie intenções em `js/bot.js`.

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
| `js/bot.js` | Assistente de dúvidas: respostas, entendimento e chat |
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
- **Débitos remanescentes** = deduções que o saldo online não cobriu. Passam para a próxima fatura como primeira dedução (`debitoRemanescente` em `TREINO.dados`). Também pode aparecer um boleto em Financeiro → Boletos: ele deve ser pago caso a loja fique sem saldo online suficiente no pagamento online.
- **Repasse mensal** = sem antecipação, o saldo positivo é enviado no 2º dia útil do mês seguinte às vendas. Não há repasse automático durante o mês, nem em fins de semana e feriados (nacionais ou de Rio Pomba - MG).
- **Feriados** ficam em `TREINO.feriados` (`js/data.js`): os fixos valem todo ano (MM-DD) e os móveis são informados por ano (AAAA-MM-DD; em 2026, Paixão de Cristo e Corpus Christi). A data da antecipação (próximo dia útil) e do repasse mensal (2º dia útil do mês seguinte) já pulam fins de semana e feriados. Para 2027, inclua os feriados móveis do ano.
- **Repasse** = líquido online + reembolso dos incentivos + taxas de serviço online − todas as deduções. Se der negativo, a diferença vai para a próxima fatura como débito remanescente.
- **Resultado** = Recebido pela Loja (dinheiro + maquininha) + Repasses recebidos + Repasse disponível.
- **Antecipação**: todas as faturas começam VIGENTE (valor em "Repasse disponível"). Ao CONFIRMAR, a fatura vira ANTECIPADA e o valor vai para "Repasses recebidos". O Resultado não muda.
- **Comprovante**: quando a transferência cai, a fatura mostra "Repasse realizado" com o link "Ver comprovante", no mesmo lugar de "Solicitar antecipação".

Todo número mostrado nos textos vem desse cálculo. Mudou um pedido em `data.js`, a tela e as explicações se atualizam juntas.
