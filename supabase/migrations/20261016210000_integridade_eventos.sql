-- =========================================================================
-- Integridade do que o visitante envia (cadastro e eventos).
-- A data vem do relógio do aparelho, então qualquer um podia gravar datas
-- no passado ou no futuro (ex.: loja "cadastrada há 5 dias" para cair na
-- lista de contato do painel) e mandar eventos sem limite.
--
-- 1. criado_em fica entre (agora - 1 dia) e agora. A fila do app manda em
--    segundos; um aparelho offline por mais de 1 dia só tem a data ajustada.
-- 2. No máximo 3000 eventos por participante por hora (a fila do app guarda
--    até 2000). Não impede quem troca de id a cada envio; para isso, captcha.
-- =========================================================================

create or replace function private.normaliza_envio() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.criado_em := least(greatest(coalesce(new.criado_em, now()), now() - interval '1 day'), now());

  -- if separado: new.participante_id só existe em treino_eventos
  if tg_table_name = 'treino_eventos' then
    if (
      select count(*) from public.treino_eventos e
      where e.participante_id = new.participante_id
        and e.criado_em > now() - interval '1 hour'
    ) >= 3000 then
      raise exception 'limite de eventos por participante atingido' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;
revoke all on function private.normaliza_envio() from public, anon, authenticated;

drop trigger if exists normaliza_envio on public.treino_participantes;
create trigger normaliza_envio before insert on public.treino_participantes
  for each row execute function private.normaliza_envio();

drop trigger if exists normaliza_envio on public.treino_eventos;
create trigger normaliza_envio before insert on public.treino_eventos
  for each row execute function private.normaliza_envio();

-- Índice para a contagem do limite (cobre também a busca por participante).
create index if not exists treino_eventos_participante_criado_idx
  on public.treino_eventos (participante_id, criado_em);
drop index if exists public.treino_eventos_participante_idx;
