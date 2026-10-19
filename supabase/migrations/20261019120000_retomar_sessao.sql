-- =========================================================================
-- Retomar o treinamento em outro aparelho.
-- No cadastro, o app chama /rest/v1/rpc/treino_retomar com o nome da loja e
-- a cidade. Se existir uma loja na mesma cidade com nome igual ou pelo menos
-- 90% parecido, devolve o id dela e os eventos de progresso, e o app
-- reconstrói de onde o parceiro parou. Sem correspondência: devolve null.
--
-- Nome comparado depois de normalizar: minúsculas, sem acento, sem
-- pontuação/espaços e sem palavras de ligação (de, da, do, das, dos, e).
-- Semelhança = 1 - distância de Levenshtein / tamanho do maior nome.
--   "Loja de Teste" x "loja de testes" → "lojateste" x "lojatestes" = 90%
--
-- A função é security definer (o visitante não lê as tabelas) e devolve só
-- o necessário para o progresso: nada de comentários, dispositivo etc.
-- O aviso do Supabase sobre "security definer executável por anon" para
-- esta função é esperado.
-- =========================================================================

create extension if not exists unaccent with schema extensions;
create extension if not exists fuzzystrmatch with schema extensions;

create or replace function private.normaliza_nome(t text) returns text
language sql stable set search_path = '' as $$
  select regexp_replace(
           regexp_replace(lower(extensions.unaccent(coalesce(t, ''))), '\m(de|da|do|das|dos|e)\M', ' ', 'g'),
           '[^a-z0-9]', '', 'g');
$$;
revoke all on function private.normaliza_nome(text) from public, anon, authenticated;

create or replace function public.treino_retomar(p_loja text, p_cidade text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  nl text := private.normaliza_nome(p_loja);
  nc text := private.normaliza_nome(p_cidade);
  achado record;
begin
  if char_length(coalesce(p_loja, '')) not between 2 and 60
     or char_length(coalesce(p_cidade, '')) not between 2 and 80
     or char_length(nl) < 2 then
    return null;
  end if;

  select p.id, p.loja, p.cidade, s.semelhanca
    into achado
    from public.treino_participantes p
    cross join lateral (
      select 1 - extensions.levenshtein(private.normaliza_nome(p.loja), nl)::numeric
               / greatest(char_length(private.normaliza_nome(p.loja)), char_length(nl), 1) as semelhanca
    ) s
   where private.normaliza_nome(p.cidade) = nc
     and s.semelhanca >= 0.9
   order by s.semelhanca desc,
            (select count(*) from public.treino_eventos e where e.participante_id = p.id and e.tipo = 'modulo_fim') desc,
            (select max(e.criado_em) from public.treino_eventos e where e.participante_id = p.id) desc nulls last
   limit 1;

  if achado.id is null then
    return null;
  end if;

  return jsonb_build_object(
    'id', achado.id,
    'loja', achado.loja,
    'cidade', achado.cidade,
    'semelhanca', round(achado.semelhanca, 3),
    'eventos', coalesce((
      select jsonb_agg(jsonb_build_object(
               't', e.tipo, 'm', e.modulo, 'p', e.passo, 'c', e.criado_em,
               'acertou', e.detalhe -> 'acertou', 'tentativa', e.detalhe -> 'tentativa',
               'ajudou', e.detalhe -> 'ajudou', 'estrelas', e.detalhe -> 'estrelas')
             order by e.criado_em, e.id)
        from public.treino_eventos e
       where e.participante_id = achado.id
         and e.tipo in ('modulo_inicio', 'modulo_fim', 'passo', 'quiz', 'avaliacao', 'certificado')
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.treino_retomar(text, text) from public;
grant execute on function public.treino_retomar(text, text) to anon, authenticated;
