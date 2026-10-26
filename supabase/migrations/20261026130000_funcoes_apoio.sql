-- Funções de apoio da Fase 1 (aditivo).

-- Encontra uma tag pelo nome ou sinônimo, para não criar "drone" e "Drone" duas vezes.
create or replace function public.buscar_tag_por_nome(p_nome text)
returns uuid
language sql stable
set search_path = ''
as $$
  select id from public.tags
   where public.normalizar(nome_pt) = public.normalizar(p_nome)
      or public.normalizar(coalesce(nome_en, '')) = public.normalizar(p_nome)
      or public.normalizar(p_nome) = any (select public.normalizar(s) from unnest(sinonimos) s)
   order by status = 'aprovada' desc
   limit 1
$$;
grant execute on function public.buscar_tag_por_nome to authenticated;

-- Totais do painel de administração.
create or replace function public.estatisticas_admin()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Acesso restrito ao administrador'; end if;
  return jsonb_build_object(
    'total', (select count(*) from public.resources where deleted_at is null),
    'exemplos', (select count(*) from public.resources where deleted_at is null and is_sample),
    'rascunhos', (select count(*) from public.resources where deleted_at is null and aprovacao <> 'aprovado'),
    'lixeira', (select count(*) from public.resources where deleted_at is not null),
    'tags_sugeridas', (select count(*) from public.tags where status = 'sugerida'),
    'sem_fonte', (select count(*) from public.resource_compatibility where resultado = 'nao_verificada'),
    'por_categoria', (
      select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'nome', c.nome, 'total', n) order by c.ordem), '[]'::jsonb)
        from public.categories c
        cross join lateral (
          select count(distinct rc.resource_id) as n
            from public.resource_categories rc
            join public.categories cc on cc.id = rc.category_id
            join public.resources r on r.id = rc.resource_id and r.deleted_at is null and not r.is_sample
           where cc.id = c.id or cc.parent_id = c.id
        ) x
       where c.parent_id is null and c.status = 'ativa'),
    'por_plataforma', (
      select coalesce(jsonb_agg(jsonb_build_object('nome', p.nome, 'total', n)), '[]'::jsonb)
        from public.platforms p
        cross join lateral (
          select count(distinct rc.resource_id) as n
            from public.resource_compatibility rc
            join public.platform_environments pe on pe.id = rc.environment_id
            join public.resources r on r.id = rc.resource_id and r.deleted_at is null and not r.is_sample
           where pe.platform_id = p.id and rc.resultado not in ('incompativel', 'nao_se_aplica')
        ) x),
    'duplicidades', (
      select count(*) from (
        select content_hash from public.resources
         where deleted_at is null and content_hash is not null
         group by content_hash having count(*) > 1) d),
    'links_sem_verificacao', (
      select count(*) from public.resources where deleted_at is null and link_oficial is not null and verificado_em is null)
  );
end $$;
grant execute on function public.estatisticas_admin to authenticated;

-- Hash do conteúdo para detectar duplicidade exata (ignora espaços e maiúsculas).
create or replace function public.trg_content_hash()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.content_hash := case
    when length(trim(new.conteudo)) < 20 then null
    else md5(regexp_replace(public.normalizar(new.conteudo), '\s+', ' ', 'g'))
  end;
  return new;
end $$;

create trigger resources_content_hash
  before insert or update of conteudo on public.resources
  for each row execute function public.trg_content_hash();
