-- =========================================================================
-- Admin só lê/escreve com verificação em duas etapas (TOTP).
-- A sessão só com senha (aal1) passa a não ver nada; o painel pede o código
-- do app autenticador e usa a sessão verificada (aal2).
-- Perdeu o celular: no Supabase, Authentication → Users → admin → remova o
-- fator MFA; no próximo login o painel mostra um QR code novo.
-- =========================================================================

create or replace function private.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.jwt() ->> 'aal') = 'aal2'
     and exists (
       select 1 from public.treino_admins a
       where a.email = (select auth.jwt() ->> 'email')
     );
$$;
