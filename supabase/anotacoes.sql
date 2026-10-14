-- =========================================================================
-- Anotações da equipe sobre as dúvidas de cada loja (painel admin)
-- Rode UMA VEZ no Supabase: SQL Editor → New query → cole este arquivo → Run.
-- Precisa do schema.sql já aplicado (usa a função public.treino_eh_admin()).
-- =========================================================================
create table if not exists public.treino_anotacoes (
  id              uuid primary key default gen_random_uuid(),
  participante_id uuid not null,
  assunto         text check (char_length(assunto) <= 80),
  texto           text not null check (char_length(texto) between 1 and 2000),
  autor           text check (char_length(autor) <= 60),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz
);
create index if not exists treino_anotacoes_participante_idx on public.treino_anotacoes (participante_id);

alter table public.treino_anotacoes enable row level security;

-- Só o admin (e-mail em treino_admins) lê, cria, edita e exclui. Visitantes não veem nada.
drop policy if exists "admin le anotacoes" on public.treino_anotacoes;
create policy "admin le anotacoes" on public.treino_anotacoes
  for select to authenticated using (public.treino_eh_admin());

drop policy if exists "admin cria anotacoes" on public.treino_anotacoes;
create policy "admin cria anotacoes" on public.treino_anotacoes
  for insert to authenticated with check (public.treino_eh_admin());

drop policy if exists "admin edita anotacoes" on public.treino_anotacoes;
create policy "admin edita anotacoes" on public.treino_anotacoes
  for update to authenticated using (public.treino_eh_admin()) with check (public.treino_eh_admin());

drop policy if exists "admin exclui anotacoes" on public.treino_anotacoes;
create policy "admin exclui anotacoes" on public.treino_anotacoes
  for delete to authenticated using (public.treino_eh_admin());
