-- =========================================================================
-- Endurece a segurança do banco (RLS + permissões mínimas).
-- Aplicar primeiro no stage, testar, depois na produção.
--
-- 1. A checagem de admin sai do schema public (exposto na API como
--    /rest/v1/rpc/treino_eh_admin) para o schema private, que a API não expõe.
-- 2. As políticas chamam a checagem via (select ...), que o Postgres avalia
--    uma vez por consulta em vez de uma vez por linha.
-- 3. anon/authenticated passam a ter só as permissões que o app usa:
--      visitante (anon):  INSERT em treino_participantes e treino_eventos
--      admin (logado):    SELECT nas tabelas + CRUD em treino_anotacoes
--    (antes tinham ALL, incluindo TRUNCATE, que não passa pelo RLS).
-- 4. Tabelas novas em public deixam de ser liberadas automaticamente para
--    anon/authenticated: cada migração concede o que precisar.
-- 5. Limites de tamanho nos campos livres que o visitante envia.
-- =========================================================================

-- 1. Checagem de admin fora da API --------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.treino_admins a
    where a.email = (select auth.jwt() ->> 'email')
  );
$$;
revoke all on function private.eh_admin() from public, anon;
grant execute on function private.eh_admin() to authenticated;

-- 2. Políticas (mesmas regras, nova função) ------------------------------------
alter table public.treino_participantes enable row level security;
alter table public.treino_eventos       enable row level security;
alter table public.treino_admins        enable row level security;
alter table public.treino_anotacoes     enable row level security;

drop policy if exists "inserir participante" on public.treino_participantes;
create policy "inserir participante" on public.treino_participantes
  for insert to anon, authenticated with check (true);

drop policy if exists "admin le participantes" on public.treino_participantes;
create policy "admin le participantes" on public.treino_participantes
  for select to authenticated using ((select private.eh_admin()));

drop policy if exists "inserir evento" on public.treino_eventos;
create policy "inserir evento" on public.treino_eventos
  for insert to anon, authenticated with check (true);

drop policy if exists "admin le eventos" on public.treino_eventos;
create policy "admin le eventos" on public.treino_eventos
  for select to authenticated using ((select private.eh_admin()));

drop policy if exists "admin le admins" on public.treino_admins;
create policy "admin le admins" on public.treino_admins
  for select to authenticated using ((select private.eh_admin()));

drop policy if exists "admin le anotacoes" on public.treino_anotacoes;
create policy "admin le anotacoes" on public.treino_anotacoes
  for select to authenticated using ((select private.eh_admin()));

drop policy if exists "admin cria anotacoes" on public.treino_anotacoes;
create policy "admin cria anotacoes" on public.treino_anotacoes
  for insert to authenticated with check ((select private.eh_admin()));

drop policy if exists "admin edita anotacoes" on public.treino_anotacoes;
create policy "admin edita anotacoes" on public.treino_anotacoes
  for update to authenticated
  using ((select private.eh_admin())) with check ((select private.eh_admin()));

drop policy if exists "admin exclui anotacoes" on public.treino_anotacoes;
create policy "admin exclui anotacoes" on public.treino_anotacoes
  for delete to authenticated using ((select private.eh_admin()));

drop function if exists public.treino_eh_admin();

-- 3. Permissões mínimas ---------------------------------------------------------
revoke all on public.treino_participantes, public.treino_eventos,
              public.treino_admins, public.treino_anotacoes
  from anon, authenticated;
revoke all on sequence public.treino_eventos_id_seq from anon, authenticated;

grant insert on public.treino_participantes, public.treino_eventos to anon, authenticated;
grant usage on sequence public.treino_eventos_id_seq to anon, authenticated;
grant select on public.treino_participantes, public.treino_eventos, public.treino_admins to authenticated;
grant select, insert, update, delete on public.treino_anotacoes to authenticated;

-- 4. Nada novo liberado por padrão ---------------------------------------------
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

-- 5. Limites de tamanho do que o visitante envia --------------------------------
alter table public.treino_eventos
  drop constraint if exists treino_eventos_alvo_tam,
  drop constraint if exists treino_eventos_detalhe_tam;
alter table public.treino_eventos
  add constraint treino_eventos_alvo_tam    check (char_length(alvo) <= 200),
  add constraint treino_eventos_detalhe_tam check (octet_length(detalhe::text) <= 8192);

alter table public.treino_participantes
  drop constraint if exists treino_participantes_dispositivo_tam,
  drop constraint if exists treino_participantes_navegador_tam;
alter table public.treino_participantes
  add constraint treino_participantes_dispositivo_tam check (char_length(dispositivo) <= 120),
  add constraint treino_participantes_navegador_tam   check (char_length(navegador) <= 120);
