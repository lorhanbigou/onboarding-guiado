-- =========================================================================
-- Valida no banco o formato dos eventos que o painel exibe.
-- Qualquer visitante pode inserir eventos com a chave anon, então o banco
-- recusa o que o app nunca envia (defesa além do escape feito no painel).
-- =========================================================================

-- detalhe é sempre um objeto JSON (ou vazio)
alter table public.treino_eventos drop constraint if exists treino_eventos_detalhe_objeto;
alter table public.treino_eventos
  add constraint treino_eventos_detalhe_objeto
  check (detalhe is null or jsonb_typeof(detalhe) = 'object');

-- avaliação: estrelas inteiras de 1 a 5, ajudou sim/não, comentário texto curto ou vazio
alter table public.treino_eventos drop constraint if exists treino_eventos_avaliacao_formato;
alter table public.treino_eventos
  add constraint treino_eventos_avaliacao_formato
  check (
    tipo <> 'avaliacao' or (
      detalhe ->> 'estrelas' in ('1', '2', '3', '4', '5')
      and jsonb_typeof(detalhe -> 'estrelas') = 'number'
      and jsonb_typeof(detalhe -> 'ajudou') = 'boolean'
      and coalesce(jsonb_typeof(detalhe -> 'comentario'), 'null') in ('string', 'null')
      and coalesce(char_length(detalhe ->> 'comentario'), 0) <= 500
    )
  );
