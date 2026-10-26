-- MindMapper · Fase 1 · fundação do banco
-- Regra do projeto: migrações só acrescentam. Nunca DROP de tabela com dados nem recriação do banco.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- unaccent não é IMMUTABLE; este invólucro permite usá-lo em índices e colunas geradas.
create or replace function public.f_unaccent(text)
returns text
language sql immutable parallel safe strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

create or replace function public.normalizar(text)
returns text
language sql immutable parallel safe strict
set search_path = ''
as $$ select lower(public.f_unaccent(trim($1))) $$;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.papel_usuario as enum ('admin', 'convidado');
create type public.status_categoria as enum ('ativa', 'unida', 'arquivada');
create type public.status_vocabulario as enum ('sugerida', 'aprovada', 'rejeitada');
create type public.status_aprovacao as enum ('rascunho', 'em_revisao', 'aprovado');
create type public.papel_categoria as enum ('principal', 'secundaria');
create type public.origem_dado as enum ('manual', 'importado', 'regras', 'ia');
create type public.resultado_compatibilidade as enum
  ('comprovada', 'declarada_na_fonte', 'nao_verificada', 'incompativel', 'nao_se_aplica');
create type public.status_instalacao_conhecido as enum ('instalado', 'requer_configuracao', 'desconhecido');
create type public.tipo_acionamento as enum
  ('mencao_app', 'comando_barra', 'cli', 'link_instalacao', 'manual');
create type public.verificacao_comando as enum ('verificado', 'encontrado_na_doc', 'nao_verificado');
create type public.status_descricao as enum ('rascunho', 'em_revisao', 'aprovada', 'substituida');
create type public.tipo_pacote as enum ('skill', 'plugin', 'mcp', 'comando');
create type public.alvo_instalacao as enum ('claude_code');
create type public.escopo_instalacao as enum ('user', 'project', 'local');
create type public.status_instalacao as enum ('instalado', 'removido', 'falhou');

-- ---------------------------------------------------------------------------
-- Perfis e papéis
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  papel public.papel_usuario not null default 'convidado',
  ativo boolean not null default true,
  criado_por uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.usuario_ativo()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and ativo)
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and ativo and papel = 'admin')
$$;

-- ---------------------------------------------------------------------------
-- Referência
-- ---------------------------------------------------------------------------
create table public.resource_types (
  id smallint generated always as identity primary key,
  slug text not null unique,
  nome text not null,
  ordem smallint not null default 0
);

create table public.platforms (
  id smallint generated always as identity primary key,
  slug text not null unique,
  nome text not null
);

create table public.platform_environments (
  id smallint generated always as identity primary key,
  platform_id smallint not null references public.platforms (id),
  slug text not null unique,
  nome text not null,
  instalacao_automatica boolean not null default false,
  notas text
);

create table public.activity_types (
  id smallint generated always as identity primary key,
  slug text not null unique,
  nome text not null
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id),
  nome text not null,
  slug text not null,
  ordem smallint not null default 0,
  is_system boolean not null default false,
  status public.status_categoria not null default 'ativa',
  merged_into_id uuid references public.categories (id),
  created_at timestamptz not null default now(),
  unique (parent_id, slug)
);
create unique index categories_raiz_slug on public.categories (slug) where parent_id is null;

-- ---------------------------------------------------------------------------
-- Biblioteca
-- ---------------------------------------------------------------------------
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id),
  type_id smallint not null references public.resource_types (id),
  titulo text not null check (length(trim(titulo)) > 0),
  slug text not null,
  versao_recurso text,
  autor text,
  activity_type_id smallint references public.activity_types (id),
  conteudo text not null default '',
  parametros jsonb not null default '[]'::jsonb,
  link_oficial text,
  instalacao_md text,
  aprovacao public.status_aprovacao not null default 'rascunho',
  is_sample boolean not null default false,
  derived_from_id uuid references public.resources (id),
  current_description_id uuid,
  importado_em timestamptz,
  verificado_em timestamptz,
  content_hash text,
  search_document text not null default '',
  search_tsv tsvector,
  embedding_reservado jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id)
);
create index resources_search_tsv on public.resources using gin (search_tsv);
create index resources_titulo_trgm on public.resources using gin (public.normalizar(titulo) extensions.gin_trgm_ops);
create index resources_content_hash on public.resources (content_hash);
create index resources_ativos on public.resources (updated_at desc) where deleted_at is null;

create table public.resource_categories (
  resource_id uuid not null references public.resources (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  papel public.papel_categoria not null default 'secundaria',
  primary key (resource_id, category_id)
);
create unique index resource_categories_uma_principal
  on public.resource_categories (resource_id) where papel = 'principal';

-- Vocabulário controlado
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  nome_pt text not null,
  nome_en text,
  sinonimos text[] not null default '{}',
  category_id uuid references public.categories (id),
  status public.status_vocabulario not null default 'sugerida',
  sugerida_por uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create unique index tags_nome_pt_unico on public.tags (public.normalizar(nome_pt));

create table public.resource_tags (
  resource_id uuid not null references public.resources (id) on delete cascade,
  tag_id uuid not null references public.tags (id),
  origem public.origem_dado not null default 'manual',
  primary key (resource_id, tag_id)
);

create table public.facets (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  nome text not null,
  category_id uuid references public.categories (id),
  ordem smallint not null default 0,
  unique (category_id, slug)
);

create table public.facet_values (
  id uuid primary key default gen_random_uuid(),
  facet_id uuid not null references public.facets (id) on delete cascade,
  valor_pt text not null,
  valor_en text,
  sinonimos text[] not null default '{}',
  status public.status_vocabulario not null default 'aprovada',
  unique (facet_id, valor_pt)
);

create table public.resource_facet_values (
  resource_id uuid not null references public.resources (id) on delete cascade,
  facet_value_id uuid not null references public.facet_values (id),
  primary key (resource_id, facet_value_id)
);

create table public.search_synonyms (
  id uuid primary key default gen_random_uuid(),
  termo text not null,
  sinonimos text[] not null default '{}'
);
create unique index search_synonyms_termo on public.search_synonyms (public.normalizar(termo));

-- Ficha funcional (cada geração é uma linha; nada é sobrescrito)
create table public.resource_descriptions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  versao integer not null,
  derived_from_id uuid references public.resource_descriptions (id),
  resumo varchar(200),
  o_que_faz text,
  para_que_serve text,
  campos jsonb not null default '{}'::jsonb,
  campos_ausentes text[] not null default '{}',
  gerado_por public.origem_dado not null default 'manual',
  modelo text,
  status public.status_descricao not null default 'rascunho',
  aprovado_por uuid references auth.users (id),
  aprovado_em timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (resource_id, versao)
);
alter table public.resources
  add constraint resources_current_description_fk
  foreign key (current_description_id) references public.resource_descriptions (id);

create table public.resource_compatibility (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  environment_id smallint not null references public.platform_environments (id),
  resultado public.resultado_compatibilidade not null default 'nao_verificada',
  status_instalacao public.status_instalacao_conhecido not null default 'desconhecido',
  fonte_url text,
  avaliado_por uuid references auth.users (id),
  avaliado_em timestamptz,
  notas text,
  unique (resource_id, environment_id),
  -- "comprovada" só com fonte e data
  constraint compat_comprovada_exige_fonte
    check (resultado <> 'comprovada' or (fonte_url is not null and avaliado_em is not null))
);

create table public.resource_commands (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  environment_id smallint not null references public.platform_environments (id),
  acionamento public.tipo_acionamento not null,
  comando text not null,
  exemplo_completo text,
  verificacao public.verificacao_comando not null default 'nao_verificado',
  fonte_url text,
  verificado_em timestamptz,
  constraint comando_verificado_exige_fonte
    check (verificacao = 'nao_verificado' or (fonte_url is not null and verificado_em is not null))
);

create table public.resource_versions (
  id bigint generated always as identity primary key,
  resource_id uuid not null references public.resources (id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  alterado_por uuid references auth.users (id),
  alterado_em timestamptz not null default now(),
  resumo text
);
create index resource_versions_recurso on public.resource_versions (resource_id, version desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  ator uuid references auth.users (id),
  entidade text not null,
  entidade_id text not null,
  acao text not null,
  diff jsonb,
  em timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create table public.app_settings (
  chave text primary key,
  valor jsonb not null
);

-- ---------------------------------------------------------------------------
-- Instalação local (MindMapper Local)
-- ---------------------------------------------------------------------------
create table public.install_packages (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  versao text not null default '1',
  tipo public.tipo_pacote not null,
  manifesto jsonb not null,
  aprovado_por uuid references auth.users (id),
  aprovado_em timestamptz,
  created_at timestamptz not null default now(),
  unique (resource_id, versao)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  sistema text,
  ultima_sincronizacao timestamptz,
  unique (owner_id, nome)
);

create table public.installations (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  package_id uuid references public.install_packages (id),
  alvo public.alvo_instalacao not null default 'claude_code',
  escopo public.escopo_instalacao not null default 'user',
  caminho text,
  status public.status_instalacao not null,
  instalado_em timestamptz,
  removido_em timestamptz,
  updated_at timestamptz not null default now(),
  unique (device_id, resource_id, alvo, escopo)
);

-- ---------------------------------------------------------------------------
-- Documento de busca: título, ficha, tags, categorias e filtros num só tsvector
-- ---------------------------------------------------------------------------
create or replace function public.refresh_resource_search(p_resource_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  r record;
  d record;
  v_tags text;
  v_cats text;
  v_facets text;
begin
  select * into r from public.resources where id = p_resource_id;
  if not found then return; end if;

  select * into d from public.resource_descriptions where id = r.current_description_id;

  select coalesce(string_agg(concat_ws(' ', t.nome_pt, t.nome_en, array_to_string(t.sinonimos, ' ')), ' '), '')
    into v_tags
    from public.resource_tags rt join public.tags t on t.id = rt.tag_id
   where rt.resource_id = p_resource_id and t.status = 'aprovada';

  select coalesce(string_agg(c.nome, ' '), '')
    into v_cats
    from public.resource_categories rc join public.categories c on c.id = rc.category_id
   where rc.resource_id = p_resource_id;

  select coalesce(string_agg(concat_ws(' ', fv.valor_pt, fv.valor_en, array_to_string(fv.sinonimos, ' ')), ' '), '')
    into v_facets
    from public.resource_facet_values rf join public.facet_values fv on fv.id = rf.facet_value_id
   where rf.resource_id = p_resource_id;

  update public.resources set
    search_document = concat_ws(' ', r.titulo, d.resumo, d.o_que_faz, d.para_que_serve, v_tags, v_cats, v_facets),
    search_tsv =
      setweight(to_tsvector('portuguese', public.f_unaccent(concat_ws(' ', r.titulo, d.resumo))), 'A') ||
      setweight(to_tsvector('simple', public.f_unaccent(concat_ws(' ', v_tags, v_facets))), 'B') ||
      setweight(to_tsvector('portuguese', public.f_unaccent(concat_ws(' ', d.o_que_faz, d.para_que_serve, v_cats))), 'B') ||
      setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(d.campos::text, ''))), 'C') ||
      setweight(to_tsvector('portuguese', public.f_unaccent(left(r.conteudo, 20000))), 'D')
  where id = p_resource_id;
end $$;

create or replace function public.trg_refresh_search()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'resources' then
    perform public.refresh_resource_search(new.id);
  elsif tg_op = 'DELETE' then
    perform public.refresh_resource_search(old.resource_id);
  else
    perform public.refresh_resource_search(new.resource_id);
  end if;
  return null;
end $$;

-- Em resources, só reagir quando mudar algo que entra na busca (evita recursão).
create trigger resources_search
  after insert or update of titulo, conteudo, current_description_id on public.resources
  for each row execute function public.trg_refresh_search();
create trigger resource_tags_search after insert or update or delete on public.resource_tags
  for each row execute function public.trg_refresh_search();
create trigger resource_categories_search after insert or update or delete on public.resource_categories
  for each row execute function public.trg_refresh_search();
create trigger resource_facets_search after insert or update or delete on public.resource_facet_values
  for each row execute function public.trg_refresh_search();
create trigger resource_descriptions_search after insert or update on public.resource_descriptions
  for each row execute function public.trg_refresh_search();

-- ---------------------------------------------------------------------------
-- Busca com sinônimos PT/EN
-- Cada palavra vira um grupo OR com seus sinônimos; os grupos se juntam com OR
-- e a ordenação premia quem casa mais grupos.
-- ---------------------------------------------------------------------------
create or replace function public.expandir_termo(p_termo text)
returns text[]
language sql stable
set search_path = ''
as $$
  with t as (select public.normalizar(p_termo) as n)
  select array_agg(distinct x) from (
    select (select n from t) as x
    union all
    select public.normalizar(unnest(array[tg.nome_pt, tg.nome_en] || tg.sinonimos))
      from public.tags tg, t
     where tg.status = 'aprovada'
       and (public.normalizar(tg.nome_pt) = t.n or public.normalizar(coalesce(tg.nome_en, '')) = t.n
            or t.n = any (select public.normalizar(s) from unnest(tg.sinonimos) s))
    union all
    select public.normalizar(unnest(array[fv.valor_pt, fv.valor_en] || fv.sinonimos))
      from public.facet_values fv, t
     where public.normalizar(fv.valor_pt) = t.n or public.normalizar(coalesce(fv.valor_en, '')) = t.n
        or t.n = any (select public.normalizar(s) from unnest(fv.sinonimos) s)
    union all
    select public.normalizar(unnest(array[ss.termo] || ss.sinonimos))
      from public.search_synonyms ss, t
     where public.normalizar(ss.termo) = t.n
        or t.n = any (select public.normalizar(s) from unnest(ss.sinonimos) s)
  ) e where x is not null and x <> ''
$$;

create or replace function public.grupo_tsquery(p_termos text[])
returns tsquery
language sql immutable
set search_path = ''
as $$
  select string_agg(q::text, ' | ')::tsquery from (
    select websearch_to_tsquery('portuguese', termo) as q from unnest(p_termos) termo
    union
    select websearch_to_tsquery('simple', termo) from unnest(p_termos) termo
  ) s where q::text <> ''
$$;

create or replace function public.search_resources(
  p_q text default null,
  p_type_slugs text[] default null,
  p_category_ids uuid[] default null,
  p_platform_slugs text[] default null,
  p_tag_ids uuid[] default null,
  p_facet_value_ids uuid[] default null,
  p_somente_favoritos boolean default false,
  p_atualizado_desde timestamptz default null,
  p_ordem text default 'relevancia',
  p_limite integer default 30,
  p_offset integer default 0
)
returns table (resource_id uuid, rank real, grupos_casados integer, total bigint)
language plpgsql stable
set search_path = ''
as $$
declare
  v_palavras text[];
  v_grupos tsquery[];
  v_union tsquery;
  v_palavra text;
  v_g tsquery;
  v_stop text[] := array['a','o','as','os','de','da','do','das','dos','e','em','no','na','nos','nas',
                         'um','uma','para','por','com','the','of','in','on','for','and','to','an'];
begin
  if p_q is not null and length(trim(p_q)) > 0 then
    select array_agg(w) into v_palavras
      from regexp_split_to_table(public.normalizar(p_q), '[^[:alnum:]]+') w
     where w <> '' and not (w = any (v_stop));
  end if;

  if v_palavras is not null then
    foreach v_palavra in array v_palavras loop
      v_g := public.grupo_tsquery(public.expandir_termo(v_palavra));
      if v_g is not null then
        v_grupos := array_append(v_grupos, v_g);
        v_union := case when v_union is null then v_g else v_union || v_g end;
      end if;
    end loop;
  end if;

  return query
  with base as (
    select r.id, r.search_tsv, r.titulo, r.updated_at
      from public.resources r
     where r.deleted_at is null
       and (p_type_slugs is null or r.type_id in (select id from public.resource_types where slug = any (p_type_slugs)))
       and (p_category_ids is null or exists (
             select 1 from public.resource_categories rc join public.categories c on c.id = rc.category_id
              where rc.resource_id = r.id and (c.id = any (p_category_ids) or c.parent_id = any (p_category_ids))))
       and (p_platform_slugs is null or exists (
             select 1 from public.resource_compatibility rc
               join public.platform_environments pe on pe.id = rc.environment_id
               join public.platforms p on p.id = pe.platform_id
              where rc.resource_id = r.id and p.slug = any (p_platform_slugs)
                and rc.resultado not in ('incompativel', 'nao_se_aplica')))
       and (p_tag_ids is null or exists (
             select 1 from public.resource_tags rt where rt.resource_id = r.id and rt.tag_id = any (p_tag_ids)))
       and (p_facet_value_ids is null or exists (
             select 1 from public.resource_facet_values rf where rf.resource_id = r.id and rf.facet_value_id = any (p_facet_value_ids)))
       and (not p_somente_favoritos or exists (
             select 1 from public.favorites f where f.resource_id = r.id and f.user_id = auth.uid()))
       and (p_atualizado_desde is null or r.updated_at >= p_atualizado_desde)
  ), pontuado as (
    select b.id, b.updated_at, b.titulo,
           case when v_union is null then 0::real
                else ts_rank_cd(b.search_tsv, v_union)
                     + coalesce(extensions.similarity(public.normalizar(b.titulo), public.normalizar(p_q)), 0)::real
           end as rk,
           case when v_grupos is null then 0
                else (select count(*)::integer from unnest(v_grupos) g where b.search_tsv @@ g) end as gc
      from base b
     where v_union is null
        or b.search_tsv @@ v_union
        or extensions.similarity(public.normalizar(b.titulo), public.normalizar(p_q)) > 0.3
  )
  select p.id, p.rk, p.gc, count(*) over ()
    from pontuado p
   order by
     case when p_ordem = 'atualizacao' then null else p.gc end desc nulls last,
     case when p_ordem = 'atualizacao' then null else p.rk end desc nulls last,
     case when p_ordem = 'titulo' then p.titulo end asc,
     p.updated_at desc
   limit p_limite offset p_offset;
end $$;

-- ---------------------------------------------------------------------------
-- Versões e auditoria
-- ---------------------------------------------------------------------------
create or replace function public.trg_resource_version()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  -- Mudanças só do índice de busca não geram versão.
  if (to_jsonb(new) - array['search_document','search_tsv','updated_at','version'])
     = (to_jsonb(old) - array['search_document','search_tsv','updated_at','version']) then
    return new;
  end if;
  insert into public.resource_versions (resource_id, version, snapshot, alterado_por)
  values (old.id, old.version, to_jsonb(old) - array['search_tsv','search_document'], auth.uid());
  new.version := old.version + 1;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create trigger resources_version
  before update on public.resources
  for each row execute function public.trg_resource_version();

create or replace function public.trg_audit()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (to_jsonb(new) - array['search_document','search_tsv','updated_at'])
                        = (to_jsonb(old) - array['search_document','search_tsv','updated_at']) then
    return null;
  end if;
  insert into public.audit_log (ator, entidade, entidade_id, acao, diff)
  values (
    auth.uid(), tg_table_name,
    coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id', ''),
    lower(tg_op),
    case when tg_op = 'UPDATE' then jsonb_build_object('antes', to_jsonb(old) - 'search_tsv', 'depois', to_jsonb(new) - 'search_tsv')
         when tg_op = 'DELETE' then to_jsonb(old) - 'search_tsv'
         else to_jsonb(new) - 'search_tsv' end
  );
  return null;
end $$;

create trigger resources_audit after insert or update or delete on public.resources
  for each row execute function public.trg_audit();
create trigger categories_audit after insert or update or delete on public.categories
  for each row execute function public.trg_audit();
create trigger profiles_audit after insert or update or delete on public.profiles
  for each row execute function public.trg_audit();

-- ---------------------------------------------------------------------------
-- Operações de biblioteca
-- ---------------------------------------------------------------------------

-- Salvar como: novo registro com novo ID, copiando vínculos e a ficha atual. O original não muda.
create or replace function public.salvar_como(p_resource_id uuid, p_novo_titulo text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_novo uuid;
  v_desc uuid;
begin
  if not public.is_admin() then raise exception 'Somente o administrador pode criar recursos'; end if;

  insert into public.resources (owner_id, type_id, titulo, slug, versao_recurso, autor, activity_type_id,
    conteudo, parametros, link_oficial, instalacao_md, aprovacao, is_sample, derived_from_id, content_hash)
  select auth.uid(), type_id, p_novo_titulo, slug || '-' || substr(gen_random_uuid()::text, 1, 6), versao_recurso, autor,
         activity_type_id, conteudo, parametros, link_oficial, instalacao_md, 'rascunho', is_sample, id, content_hash
    from public.resources where id = p_resource_id and deleted_at is null
  returning id into v_novo;

  if v_novo is null then raise exception 'Recurso não encontrado'; end if;

  insert into public.resource_categories (resource_id, category_id, papel)
    select v_novo, category_id, papel from public.resource_categories where resource_id = p_resource_id;
  insert into public.resource_tags (resource_id, tag_id, origem)
    select v_novo, tag_id, origem from public.resource_tags where resource_id = p_resource_id;
  insert into public.resource_facet_values (resource_id, facet_value_id)
    select v_novo, facet_value_id from public.resource_facet_values where resource_id = p_resource_id;
  insert into public.resource_compatibility (resource_id, environment_id, resultado, status_instalacao, fonte_url, avaliado_por, avaliado_em, notas)
    select v_novo, environment_id, resultado, status_instalacao, fonte_url, avaliado_por, avaliado_em, notas
      from public.resource_compatibility where resource_id = p_resource_id;
  insert into public.resource_commands (resource_id, environment_id, acionamento, comando, exemplo_completo, verificacao, fonte_url, verificado_em)
    select v_novo, environment_id, acionamento, comando, exemplo_completo, verificacao, fonte_url, verificado_em
      from public.resource_commands where resource_id = p_resource_id;

  insert into public.resource_descriptions (resource_id, versao, derived_from_id, resumo, o_que_faz, para_que_serve,
    campos, campos_ausentes, gerado_por, modelo, status, created_by)
  select v_novo, 1, d.id, d.resumo, d.o_que_faz, d.para_que_serve, d.campos, d.campos_ausentes, d.gerado_por, d.modelo,
         'rascunho', auth.uid()
    from public.resources r join public.resource_descriptions d on d.id = r.current_description_id
   where r.id = p_resource_id
  returning id into v_desc;

  if v_desc is not null then
    update public.resources set current_description_id = v_desc where id = v_novo;
  end if;

  return v_novo;
end $$;

-- Unir categorias sem perder vínculos.
create or replace function public.unir_categorias(p_origem uuid, p_destino uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Somente o administrador pode unir categorias'; end if;
  if p_origem = p_destino then raise exception 'Origem e destino são a mesma categoria'; end if;

  insert into public.resource_categories (resource_id, category_id, papel)
    select resource_id, p_destino, 'secundaria' from public.resource_categories where category_id = p_origem
  on conflict (resource_id, category_id) do nothing;

  -- Se a origem era principal e o destino ainda não é, o destino passa a principal.
  update public.resource_categories rc set papel = 'principal'
   where rc.category_id = p_destino
     and exists (select 1 from public.resource_categories o
                  where o.resource_id = rc.resource_id and o.category_id = p_origem and o.papel = 'principal');

  delete from public.resource_categories where category_id = p_origem;
  update public.categories set parent_id = p_destino where parent_id = p_origem;
  update public.tags set category_id = p_destino where category_id = p_origem;
  update public.facets set category_id = p_destino where category_id = p_origem
    and not exists (select 1 from public.facets f2 where f2.category_id = p_destino and f2.slug = facets.slug);
  update public.categories set status = 'unida', merged_into_id = p_destino where id = p_origem;
end $$;

-- Categoria com recursos não é apagada; só unida ou arquivada.
create or replace function public.trg_categoria_protegida()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.resource_categories where category_id = old.id) then
    raise exception 'A categoria "%" tem recursos. Una ou arquive em vez de excluir.', old.nome;
  end if;
  if old.is_system and old.parent_id is null then
    raise exception 'As 12 categorias principais não podem ser excluídas.';
  end if;
  return old;
end $$;

create trigger categories_protegida before delete on public.categories
  for each row execute function public.trg_categoria_protegida();

-- Expurgo da lixeira (chamado pelo admin ou por agendamento).
create or replace function public.esvaziar_lixeira(p_dias integer default 30)
returns integer
language plpgsql
set search_path = ''
as $$
declare v integer;
begin
  if not public.is_admin() then raise exception 'Somente o administrador pode esvaziar a lixeira'; end if;
  delete from public.resources where deleted_at is not null and deleted_at < now() - make_interval(days => p_dias);
  get diagnostics v = row_count;
  return v;
end $$;

-- ---------------------------------------------------------------------------
-- Políticas de acesso (RLS)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.resource_types enable row level security;
alter table public.platforms enable row level security;
alter table public.platform_environments enable row level security;
alter table public.activity_types enable row level security;
alter table public.categories enable row level security;
alter table public.resources enable row level security;
alter table public.resource_categories enable row level security;
alter table public.tags enable row level security;
alter table public.resource_tags enable row level security;
alter table public.facets enable row level security;
alter table public.facet_values enable row level security;
alter table public.resource_facet_values enable row level security;
alter table public.search_synonyms enable row level security;
alter table public.resource_descriptions enable row level security;
alter table public.resource_compatibility enable row level security;
alter table public.resource_commands enable row level security;
alter table public.resource_versions enable row level security;
alter table public.audit_log enable row level security;
alter table public.favorites enable row level security;
alter table public.app_settings enable row level security;
alter table public.install_packages enable row level security;
alter table public.devices enable row level security;
alter table public.installations enable row level security;

-- Perfis: cada um vê o próprio; admin vê e altera todos.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Leitura da biblioteca: qualquer usuário ativo. Escrita: só admin.
do $$
declare t text;
begin
  foreach t in array array['resource_types','platforms','platform_environments','activity_types','categories',
                           'resource_categories','tags','resource_tags','facets','facet_values',
                           'resource_facet_values','search_synonyms','resource_descriptions',
                           'resource_compatibility','resource_commands','install_packages']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (public.usuario_ativo())', t || '_ler', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin', t);
  end loop;
end $$;

-- Recursos: convidados não veem a lixeira nem rascunhos.
create policy resources_ler on public.resources for select to authenticated
  using (public.is_admin() or (public.usuario_ativo() and deleted_at is null and aprovacao = 'aprovado'));
create policy resources_admin on public.resources for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy resource_versions_ler on public.resource_versions for select to authenticated using (public.is_admin());
create policy audit_log_ler on public.audit_log for select to authenticated using (public.is_admin());
create policy app_settings_ler on public.app_settings for select to authenticated using (public.usuario_ativo());
create policy app_settings_admin on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Favoritos, computadores e instalações: só do próprio usuário.
create policy favorites_dono on public.favorites for all to authenticated
  using (user_id = auth.uid() and public.usuario_ativo()) with check (user_id = auth.uid() and public.usuario_ativo());
create policy devices_dono on public.devices for all to authenticated
  using (owner_id = auth.uid() and public.usuario_ativo()) with check (owner_id = auth.uid() and public.usuario_ativo());
create policy installations_dono on public.installations for all to authenticated
  using (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid()) and public.usuario_ativo())
  with check (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid()) and public.usuario_ativo());

grant execute on function public.search_resources to authenticated;
grant execute on function public.salvar_como to authenticated;
grant execute on function public.unir_categorias to authenticated;
grant execute on function public.esvaziar_lixeira to authenticated;
revoke execute on function public.refresh_resource_search from public, anon, authenticated;
