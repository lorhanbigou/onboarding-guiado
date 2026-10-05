# Treinamento Financeiro — onboarding guiado para parceiros

Treinamento interativo (Product Tour com spotlight) feito sobre um clone das telas **Relatório** e **Financeiro** do painel do parceiro.

## Como abrir

```bash
node serve.js
```

Depois acesse <http://localhost:5178>. Também funciona abrindo o `index.html` direto no navegador.

### Cenário de cada parceiro (pela URL)

| Cenário | Link | Total Bruto | Mensalidade |
|---|---|---|---|
| 1 — Parceiro começando | `index.html?cenario=1` | R$229,95 | não |
| 2 — Passou de R$500 e antecipa muito | `index.html?cenario=2` | R$728,87 | sim, e débito remanescente de R$59,90 |
| 3 — Muito dinheiro e maquininha | `index.html?cenario=3` | R$1.386,80 | sim |

**Datas:** os valores são fixos, mas as datas acompanham o dia de hoje. A fatura mostra sempre o mês atual, do dia 1 até ontem; os pedidos são distribuídos nesse período e a antecipação cai no próximo dia útil. Para testar outro dia, use `?data=AAAA-MM-DD` (ex.: `index.html?cenario=2&data=2026-10-15`).

**Dicas importantes:** a tela inicial tem 6 orientações recolhidas (cupons, pagamento online, antecipação, repasse mensal, boleto e pedidos com tempo expirado), em `js/dicas.js`. Versões curtas aparecem como "Dica" no rodapé dos balões relacionados.

**Aviso:** a tela inicial e a abertura do Módulo 1 deixam claro que tudo é fictício e ilustrativo, inclusive comissão e taxas, e que os valores reais estão no contrato.

O parceiro não vê nem escolhe o cenário: ele vem do link. A sequência dos módulos é a mesma nos 3; só mudam os números. O progresso fica salvo no navegador, separado por cenário.

## Módulos (mesma ordem para todos)

1. Suas vendas: Relatório e Total Bruto
2. Pagamento online
3. Dinheiro e maquininha
4. Tela Financeiro: resultado e quadros
5. Fatura: o que entrou de pagamento online
6. Fatura: o que saiu do pagamento online (deduções, mensalidade e ajuste de preços no cardápio)
7. Repasse e antecipação
8. Exercício prático

Só aparecem telas que existem no sistema: Relatório, Total Bruto, Financeiro, fatura, Comissão, Taxa de Pagamento Online, Taxa de Serviço, Antecipação, Boletos e Repasses.

## Cadastro da loja e painel admin (analytics)

Antes de começar, o parceiro digita o **nome da loja** e escolhe a **cidade** (lista fixa em `js/cidades.js`). Isso identifica o parceiro no painel; a tela do treinamento continua com "Loja de Treinamento". O link "trocar" na tela inicial permite cadastrar outra loja no mesmo aparelho.

O treinamento registra eventos (acesso, início e fim de módulo, cada passo e o tempo nele, saídas no meio, etapas puladas, respostas do exercício, narração, dicas abertas). Eles ficam numa fila no aparelho e são enviados em lote para o Supabase; sem internet, são reenviados depois.

**Painel:** `admin.html` (ex.: <http://localhost:5178/admin.html>). Mostra:
- KPIs (cadastradas, começaram, concluíram, taxa de conclusão, em andamento, não começaram, tempo para concluir, acessos, ativas em 7 dias);
- destaques automáticos;
- funil por módulo com a maior queda;
- passos onde as lojas param, passos mais demorados e etapas puladas;
- acerto do exercício por pergunta;
- cidades (ranking, top 10, cidades sem cadastro);
- acessos por dia e mapa de calor por dia/hora;
- perfil de uso;
- tabela de lojas com busca e exportação em CSV.

Tudo responde aos filtros de período, cidade e cenário.

Enquanto o Supabase não estiver configurado, o painel abre com **dados de demonstração** (ou force com `admin.html?demo=1`).

### Como ligar o Supabase (uma vez)

1. Crie um projeto em <https://supabase.com> (plano grátis).
2. Em **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql`. Antes de rodar, troque `admin@bigou.app` (no fim do arquivo) pelo e-mail do admin. Depois, clique em **Run**.
3. Em **Authentication → Users → Add user**, crie esse usuário com e-mail e senha e marque "Auto Confirm User". Essa é a senha única do painel.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** para `js/analytics-config.js`, junto com o e-mail do admin.
5. Publique o site. No painel, entre com a senha.

Segurança: a chave `anon` é pública por natureza. As regras (RLS) do `schema.sql` deixam o público **apenas inserir** dados, e só o usuário cujo e-mail está em `treino_admins` consegue **ler**.

## Narração por voz (opcional)

O parceiro liga a narração pelo botão **Narração por voz** na tela inicial ou pelo botão **Narração** na barra do módulo. A escolha fica salva no navegador. Com a narração ligada:

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
| `js/data.js` | Dados fixos: loja, pedidos de cada cenário, taxas e mensalidade |
| `js/calc.js` | Lógica de cálculo |
| `js/clone.js` | Tela clonada: Relatório, Financeiro, fatura e modais |
| `js/modules.js` | Conteúdo dos 8 módulos (textos, passos, perguntas) |
| `js/dicas.js` | Dicas importantes da tela inicial |
| `js/cidades.js` | Lista de cidades do cadastro |
| `js/analytics-config.js` | URL/chave do Supabase e e-mail do admin |
| `js/analytics.js` | Fila e envio dos eventos do treinamento |
| `admin.html`, `js/admin.js`, `css/admin.css` | Painel admin com analytics |
| `supabase/schema.sql` | Tabelas e regras de segurança do banco |
| `js/voz.js` | Narração: escolhe a voz pt-BR, transforma valores e datas em fala e lê o balão |
| `js/tour.js` | Motor do spotlight / balões / passos de clique / quiz |
| `js/app.js` | Tela inicial, lista de módulos, modo livre, revisão e progresso |

## Regras de cálculo

Estas taxas ficam em `TREINO.config` (`js/data.js`):

- **Valor Bruto do pedido** = produtos + taxa de serviço. **Valor Líquido** = Bruto − incentivo.
- **Comissão** = 12% × (total bruto de todas as vendas − taxas de serviço).
- **Taxa do pagamento online** = 4% × (bruto das vendas online − taxas de serviço online).
- **Taxa de antecipação** = 1,99% × total bruto das vendas online. Aparece na fatura já descontada.
- **Taxa de serviço do pedido** (paga pelo cliente) = R$0,99; R$1,99 em pedidos acima de R$100,00.
- **Taxa de serviço (fatura)** = todas as taxas de serviço − 4% das taxas pagas na maquininha.
- **Taxa de transferência** = R$2,50 (despesas bancárias do envio).
- **Mensalidade** = R$59,90, cobrada apenas quando a loja atinge o faturamento mínimo (R$500,00 em Total Bruto). É deduzida na virada do último dia do mês.
- **Débitos remanescentes** = deduções que o saldo online não cobriu. Passam para a próxima fatura como primeira dedução (`debitoRemanescente` no cenário). Pode aparecer um boleto, mas ele só deve ser considerado se a loja ficar três meses seguidos sem saldo online suficiente.
- **Repasse mensal** = sem antecipação, o saldo positivo é enviado no 2º dia útil do mês seguinte às vendas. Não há repasse automático durante o mês, nem em fins de semana e feriados (nacionais ou de Rio Pomba - MG).
- **Repasse** = líquido online + reembolso dos incentivos + taxas de serviço online − todas as deduções. Se der negativo, a diferença vai para a próxima fatura como débito remanescente.
- **Resultado** = Recebido pela Loja (dinheiro + maquininha) + Repasses recebidos + Repasse disponível.
- **Antecipação**: todas as faturas começam VIGENTE (valor em "Repasse disponível"). Ao CONFIRMAR, a fatura vira ANTECIPADA e o valor vai para "Repasses recebidos". O Resultado não muda.

Todo número mostrado nos textos vem desse cálculo. Mudou um pedido em `data.js`, a tela e as explicações se atualizam juntas.
