-- =========================================================================
-- Perguntas editáveis pelo painel admin.
-- Cada linha substitui uma pergunta do treinamento (id fixo: d1…d9, f1…f10):
-- enunciado, alternativas (na mesma posição), a correta e as mensagens de
-- acerto e erro. Sem linha, vale o texto do código (js/modules.js).
-- As respostas são contadas pela posição da alternativa, então as respostas
-- antigas passam a contar na alternativa nova da mesma posição.
--   visitante (anon): SELECT (o treinamento lê as perguntas atuais)
--   admin (logado):   SELECT, INSERT, UPDATE e DELETE
-- =========================================================================

create table if not exists public.treino_perguntas (
  id            text primary key check (id ~ '^[df][0-9]{1,2}$'),
  q             text not null check (char_length(q) between 3 and 300),
  opcoes        jsonb not null check (jsonb_typeof(opcoes) = 'array' and jsonb_array_length(opcoes) between 2 and 6),
  correta       smallint not null check (correta between 0 and 5),
  ok            text check (char_length(ok) <= 400),
  no            text check (char_length(no) <= 400),
  autor         text check (char_length(autor) <= 60),
  atualizado_em timestamptz not null default now(),
  check (correta < jsonb_array_length(opcoes)),
  check (octet_length(opcoes::text) <= 2000)
);

alter table public.treino_perguntas enable row level security;

drop policy if exists "todos leem perguntas" on public.treino_perguntas;
create policy "todos leem perguntas" on public.treino_perguntas
  for select to anon, authenticated using (true);

drop policy if exists "admin cria perguntas" on public.treino_perguntas;
create policy "admin cria perguntas" on public.treino_perguntas
  for insert to authenticated with check ((select private.eh_admin()));

drop policy if exists "admin edita perguntas" on public.treino_perguntas;
create policy "admin edita perguntas" on public.treino_perguntas
  for update to authenticated
  using ((select private.eh_admin())) with check ((select private.eh_admin()));

drop policy if exists "admin exclui perguntas" on public.treino_perguntas;
create policy "admin exclui perguntas" on public.treino_perguntas
  for delete to authenticated using ((select private.eh_admin()));

revoke all on public.treino_perguntas from anon, authenticated;
grant select on public.treino_perguntas to anon, authenticated;
grant insert, update, delete on public.treino_perguntas to authenticated;
