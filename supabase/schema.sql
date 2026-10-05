-- =========================================================================
-- Treinamento Financeiro — Analytics
-- Cole este script inteiro no Supabase: SQL Editor → New query → Run.
-- Depois, troque o e-mail no final pelo e-mail do usuário admin.
-- =========================================================================

-- Lojas que se cadastraram no treinamento (uma por aparelho)
create table if not exists public.treino_participantes (
  id          uuid primary key,
  loja        text not null check (char_length(loja) between 2 and 60),
  cidade      text not null check (char_length(cidade) between 2 and 80),
  cenario     smallint,
  dispositivo text,
  navegador   text,
  criado_em   timestamptz not null default now()
);

-- Tudo o que acontece no treinamento
create table if not exists public.treino_eventos (
  id              bigserial primary key,
  participante_id uuid not null,
  tipo            text not null check (char_length(tipo) <= 40),
  modulo          smallint,
  passo           smallint,
  alvo            text,
  detalhe         jsonb,
  criado_em       timestamptz not null default now()
);
create index if not exists treino_eventos_participante_idx on public.treino_eventos (participante_id);
create index if not exists treino_eventos_tipo_idx on public.treino_eventos (tipo);
create index if not exists treino_eventos_criado_idx on public.treino_eventos (criado_em);

-- Quem pode ler os dados no painel
create table if not exists public.treino_admins (
  email text primary key
);

-- ------------------------------ Segurança (RLS) ------------------------------
alter table public.treino_participantes enable row level security;
alter table public.treino_eventos      enable row level security;
alter table public.treino_admins       enable row level security;

-- Visitantes (chave pública) só podem INSERIR. Ninguém anônimo lê nada.
drop policy if exists "inserir participante" on public.treino_participantes;
create policy "inserir participante" on public.treino_participantes
  for insert to anon, authenticated with check (true);

drop policy if exists "inserir evento" on public.treino_eventos;
create policy "inserir evento" on public.treino_eventos
  for insert to anon, authenticated with check (true);

-- Leitura só para usuários logados cujo e-mail está em treino_admins
create or replace function public.treino_eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.treino_admins a where a.email = (auth.jwt() ->> 'email'));
$$;

drop policy if exists "admin le participantes" on public.treino_participantes;
create policy "admin le participantes" on public.treino_participantes
  for select to authenticated using (public.treino_eh_admin());

drop policy if exists "admin le eventos" on public.treino_eventos;
create policy "admin le eventos" on public.treino_eventos
  for select to authenticated using (public.treino_eh_admin());

drop policy if exists "admin le admins" on public.treino_admins;
create policy "admin le admins" on public.treino_admins
  for select to authenticated using (public.treino_eh_admin());

-- ------------------------------ Admin ------------------------------
-- Troque pelo e-mail do usuário criado em Authentication → Users
insert into public.treino_admins (email) values ('admin@bigou.app')
  on conflict do nothing;
