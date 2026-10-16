# Treinamento Financeiro — onboarding guiado para parceiros

Treinamento interativo (Product Tour com spotlight) feito sobre um clone das telas **Pedidos**, **Relatório** e **Financeiro** do painel do parceiro.

## Como abrir

```bash
npm run dev        # usa o Supabase de stage (.env.stage)
npm run dev:main   # usa o Supabase de produção (.env.main) — grava dados reais
npm start          # sem Supabase (treinamento funciona; eventos ficam na fila do aparelho)
```

Depois acesse <http://localhost:5178>. Também funciona abrindo o `index.html` direto no navegador (sem Supabase). Os arquivos `.env.stage` e `.env.main` não vão para o git: copie o `.env.example` e preencha.

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

O painel tem uma **sidebar** com uma página para cada assunto (o endereço muda: `#lojas`, `#perguntas`…). Tabelas com mais de 25 linhas são paginadas.
- **Visão geral:** 4 números com comparação ao período anterior, saúde do treinamento, avaliação média, tempo para concluir, "O que fazer agora" e a jornada em cartões.
- **Jornada:** os 5 marcos, a tabela dos 10 módulos (iniciaram, concluíram, pararam, tempo, passo onde mais saem) e "Onde param".
- **Passo a passo:** todos os passos de todos os módulos: quantas lojas viram, saíram, pularam e o tempo mediano (filtro por módulo).
- **Assuntos:** acerto de primeira por tema, com nível e "poucos dados".
- **Perguntas:** as 19 perguntas com a distribuição completa por alternativa (atual e antes da mudança) e as tentativas até acertar.
- **Lojas:** situação de cada loja, com busca, ordenação e a ficha (erros, avaliação e anotações).
- **Anotações:** todas as anotações da equipe, com filtro por assunto e autor, busca, editar e excluir.
- **Avaliações:** resumo e todas as avaliações das lojas.
- **Cidades:** desempenho e contatos pendentes por cidade.
- **Uso:** acessos por dia, mapa de calor, aparelho, navegador, narração e dicas mais abertas.
- **Exportar:** todos os CSVs num só lugar (dúvidas e anotações, lojas, perguntas, passos, módulos, avaliações e cidades).

O filtro de período considera a data de cadastro da loja (7, 14 ou 28 dias, ou todo o período). Os limites de 7 e 3 dias ficam em `PARADA_DIAS` e `SEM_INICIO_DIAS` (`js/admin.js`).

Sem o Supabase configurado, o painel mostra um aviso em vez dos dados (não há mais modo de demonstração).

### Perguntas: versões e rastreabilidade

Cada pergunta tem um id fixo (`d1`…`d9` nos desafios, `f1`…`f10` no exercício final) e uma versão (`versao`, hoje **2**, reescritas em 10/2026 para não induzir ao erro). O evento `quiz` envia `id`, `versao`, o enunciado e a alternativa escolhida. Respostas antigas (versão 1, sem id) são ligadas à pergunta pela posição (módulo e passo), que não muda; os textos da versão 1 ficam em `QUIZ_V1` (`js/admin.js`). No painel, o acerto atual conta só a versão nova e cada pergunta mostra "Antes da mudança". Se reescrever as perguntas de novo, suba `QV` em `js/modules.js` e guarde os textos antigos.

### Anotações da equipe (ficha da loja)

Em **Lojas para acompanhar**, toque em uma loja para abrir a ficha: progresso, perguntas que ela errou (com a resposta escolhida), avaliação e **anotações da equipe** (criar, editar e excluir; cada anotação tem assunto, texto, autor e data). As anotações ficam na tabela `treino_anotacoes`, que só o admin lê e escreve. Sem a tabela, a ficha mostra um aviso.

**Exportações:** "Lojas (CSV)" e "Dúvidas e anotações (CSV)", com uma linha por erro em pergunta, comentário da avaliação e anotação da equipe — a base para o plano de ação de melhorias.

### Como ligar o Supabase (uma vez)

1. Crie um projeto em <https://supabase.com> (plano grátis).
2. Em **SQL Editor → New query**, rode as migrações de `supabase/migrations` em ordem (nome do arquivo = data). Na primeira, troque `admin@bigou.app` pelo e-mail do admin se for outro.
3. Em **Authentication → Users → Add user**, crie esse usuário com e-mail e senha e marque "Auto Confirm User". Essa é a senha única do painel.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** para as variáveis do site na Netlify e para o `.env` local (veja "Ambientes").
5. Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up** (só o admin entra) e, em **URL Configuration**, ponha o endereço do site em **Site URL**.
6. Em **Project Settings → JWT Keys**, use as chaves de assinatura novas (ES256) e revogue a legada (HS256); no site use a chave **publishable** (`sb_publishable_…`), não a `anon` legada.
7. Publique o site. No painel, entre com a senha.

### Acesso ao painel

Hoje o painel entra só com a senha do admin. A verificação em duas etapas (código de um app autenticador, com QR code no primeiro acesso) está pronta no código, mas **desligada**: `EXIGIR_MFA = false` em `js/admin.js`, e a migração `20261016230000_admin_sem_mfa.sql` tirou a exigência no banco. Para religar: `EXIGIR_MFA = true` e uma migração nova com a regra `aal2` de `20261016220000_admin_exige_mfa.sql`. Com ela ligada, se o admin perder o celular: **Authentication → Users → admin → MFA factors**, remova o fator; no próximo login aparece um QR code novo.

### Ambientes (produção e stage)

| Ambiente | Branch | Site na Netlify | Supabase |
|---|---|---|---|
| Produção | `main` | `treinamentofinanceirobigou` | `onboarding-guiado` (`pfgkzdrbluelvphtveiq`) |
| Stage | `stage` | `ondoarding-guiado-stage` | `onboard-guiado-stage` (`orftxacyupbdacwcfvzk`) |

No deploy, a Netlify roda `scripts/build.js` (configurado em `netlify.toml`): copia para `dist/` só o que o navegador usa (`index.html`, `admin/`, `css/`, `js/`, `assets/`) e grava ali o `js/registro-config.js` com as variáveis de ambiente do site: `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `ADMIN_EMAIL`. README, SQL e scripts não são publicados. O `netlify.toml` também define os cabeçalhos de segurança (CSP, bloqueio de iframe etc.), que o `serve.js` repete localmente; por causa da CSP, não use `onclick=`/`<script>` inline nem scripts de outros domínios. Sem elas o build falha, para o stage nunca publicar apontando para o banco de produção. O `js/registro-config.js` versionado fica vazio (sem Supabase); localmente o `serve.js` entrega a configuração do `.env` escolhido.

**Mudanças no banco:** toda alteração vira um arquivo novo em `supabase/migrations` (`AAAAMMDDHHMMSS_descricao.sql`), aplicado **primeiro no stage**, testado, e só depois na produção. Não edite migrações já aplicadas. Tabelas novas não ficam liberadas para a API automaticamente: a migração precisa conceder (`grant`) o mínimo e criar as políticas RLS.

Segurança: a chave `anon` é pública por natureza. As regras (RLS) e permissões das migrações deixam o público **apenas inserir** participantes e eventos, e só o usuário cujo e-mail está em `treino_admins` consegue **ler** (e gerenciar anotações). A checagem de admin fica no schema `private`, fora da API. O painel trata tudo que vem do banco como texto não confiável (escape no HTML, campos do `detalhe` validados, fórmulas neutralizadas nos CSVs), e o banco recusa avaliações fora do formato. O banco também corrige datas enviadas pelo aparelho (entre 1 dia atrás e agora) e limita cada participante a 3000 eventos por hora.

## Assistente de dúvidas (chat)

**Ligado por ambiente:** hoje só no **stage**. A variável `RECURSO_ASSISTENTE=true` no site da Netlify (e no `.env.stage` local) liga o assistente; sem ela vale o padrão desligado de `js/data.js` (produção). Desligado, o botão não aparece e o painel esconde a seção "Dúvidas do chat". Para ligar na produção, defina `RECURSO_ASSISTENTE=true` no site de produção e faça um novo deploy.

Botão flutuante no canto da tela, liberado quando a loja **conclui os 10 módulos** (antes disso aparece com cadeado e mostra quantos módulos faltam). Não aparece dentro dos módulos guiados nem no cadastro.

- **Sem IA e sem custo:** as respostas ficam em `js/bot.js` (lista `INTENCOES`), escritas a partir do conteúdo do treinamento. Cada intenção tem palavras-chave com peso (`k3`, `k2`, `k1`), a resposta, o módulo para "Rever no treinamento" e perguntas relacionadas.
- **Entendimento:** ignora acentos, maiúsculas, plural e palavras comuns, aceita erros de digitação ("comição") e abreviações ("qnd", "pq"). Se houver dúvida entre assuntos, mostra "Você quis dizer…". Perguntas fora do treinamento (cardápio, horário, nota fiscal…) são encaminhadas ao suporte.
- **No chat:** perguntas prontas, "digitando…", 👍/👎 em cada resposta, nova conversa e histórico salvo no aparelho. Lê a resposta em voz alta se a narração estiver ligada.
- **Coleta** (tabela `treino_eventos`, sem mudar o banco): `duvida` (texto, assunto, resultado: respondida, sugestão, sem resposta ou fora do treinamento), `duvida_escolha`, `duvida_feedback` e `bot_aberto`. CPF, telefone, e-mail e números longos são trocados por `[removido]` antes de enviar.
- **Painel → Dúvidas do chat:** perguntas, % respondidas de primeira, % que ajudou, assuntos mais perguntados, perguntas sem resposta ou fora do treinamento, respostas que não ajudaram e exportação em CSV.

Para melhorar o bot: veja no painel as perguntas sem resposta e as respostas com 👎, e ajuste ou crie intenções em `js/bot.js`.

## Narração por voz (opcional)

**Narração gravada (mp3).** Se `js/narracao.js` lista áudios, cada balão do tour toca o seu mp3 de `assets/audio/` uma vez e para; o próximo só toca quando o parceiro avança. Balão sem áudio fica em silêncio (a voz do aparelho não é usada, para não misturar vozes), e o botão "Ouvir de novo" só aparece onde há áudio. Os áudios foram cortados da narração completa (ElevenLabs, voz "Will") por `scripts/narracao/cortar.js`, a partir de `scripts/narracao/cortes.json` (balão → trechos em segundos do arquivo original):

```bash
node scripts/narracao/cortar.js "<narração completa>.mp3"   # precisa do ffmpeg
```

A gravação é um resumo por tópico, não o texto exato da tela: desafios, contas com valores e resumos de módulo ficam sem áudio. Se o texto de um balão mudar, ajuste o trecho em `cortes.json` (ou grave de novo) e rode o comando. Sem `js/narracao.js`, vale a voz do aparelho descrita abaixo.

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
| `js/narracao.js`, `assets/audio/`, `scripts/narracao/` | Narração gravada: índice balão → mp3, os áudios e o cortador |
| `js/registro-config.js` | URL/chave do Supabase e e-mail do admin (gerado no deploy) |
| `scripts/build.js`, `scripts/gerar-config.js`, `netlify.toml` | Build da Netlify (`dist/`), config do Supabase por ambiente e cabeçalhos de segurança |
| `js/registro.js` | Fila e envio dos eventos do treinamento |
| `admin/index.html`, `js/admin.js`, `css/admin.css` | Painel admin com analytics |
| `supabase/migrations/` | Tabelas, regras de segurança e permissões do banco, em ordem |
| `.env.example` | Modelo do `.env.stage` / `.env.main` para rodar local |
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
