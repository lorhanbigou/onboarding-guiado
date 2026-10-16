-- =========================================================================
-- Verificação em duas etapas do admin desligada por enquanto.
-- Volta a exigir só o e-mail em treino_admins (sessão com senha).
-- Para religar: no painel, EXIGIR_MFA = true (js/admin.js) e uma migração
-- nova com a regra aal2 de 20261016220000_admin_exige_mfa.sql.
-- =========================================================================

create or replace function private.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.treino_admins a
    where a.email = (select auth.jwt() ->> 'email')
  );
$$;
