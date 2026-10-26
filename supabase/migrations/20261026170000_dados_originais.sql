-- Guarda o registro exatamente como veio de um arquivo importado, separado dos campos
-- que a biblioteca usa e edita. Migração aditiva: só acrescenta colunas.
alter table public.resources
  add column if not exists dados_originais jsonb,
  add column if not exists lote_importacao text;

create index if not exists resources_lote_importacao on public.resources (lote_importacao)
  where lote_importacao is not null;

comment on column public.resources.dados_originais is 'Registro original do arquivo importado, sem alteração.';
comment on column public.resources.lote_importacao is 'Nome do arquivo ou lote de onde o recurso veio.';
