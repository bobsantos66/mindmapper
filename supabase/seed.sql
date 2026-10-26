-- MindMapper · dados de referência reais (não são exemplos).
-- Pode rodar em produção. Exemplos de teste ficam em seed.sample.sql.

insert into public.resource_types (slug, nome, ordem) values
  ('prompt', 'Prompt', 1),
  ('skill', 'Skill', 2),
  ('plugin', 'Plugin', 3),
  ('conector', 'Conector', 4),
  ('mcp_server', 'MCP Server', 5),
  ('agente', 'Agente', 6),
  ('template', 'Template', 7),
  ('comando', 'Comando', 8),
  ('workflow', 'Workflow', 9)
on conflict (slug) do nothing;

insert into public.platforms (slug, nome) values
  ('chatgpt', 'ChatGPT'),
  ('claude', 'Claude')
on conflict (slug) do nothing;

insert into public.platform_environments (platform_id, slug, nome, instalacao_automatica, notas)
select p.id, e.slug, e.nome, e.auto, e.notas
  from (values
    ('chatgpt', 'chatgpt', 'ChatGPT (site e app)', false,
     'Apps e conectores só podem ser adicionados na tela do próprio ChatGPT. O MindMapper copia, abre o link e orienta.'),
    ('claude', 'claude-ai', 'Claude.ai (site e app)', false, null),
    ('claude', 'claude-code', 'Claude Code', true,
     'Instalação automática pelo MindMapper Local: claude plugin, claude mcp e pasta de skills.'),
    ('claude', 'claude-desktop', 'Claude Desktop', false, null)
  ) as e(plataforma, slug, nome, auto, notas)
  join public.platforms p on p.slug = e.plataforma
on conflict (slug) do nothing;

insert into public.activity_types (slug, nome) values
  ('gerar', 'Gerar'),
  ('editar', 'Editar'),
  ('analisar', 'Analisar'),
  ('automatizar', 'Automatizar'),
  ('pesquisar', 'Pesquisar'),
  ('organizar', 'Organizar'),
  ('converter', 'Converter')
on conflict (slug) do nothing;

-- As 12 categorias principais, exatamente como definidas pelo Bob.
insert into public.categories (nome, slug, ordem, is_system) values
  ('Texto e Conteúdo', 'texto-e-conteudo', 1, true),
  ('Imagem e Design', 'imagem-e-design', 2, true),
  ('Vídeo e Animação', 'video-e-animacao', 3, true),
  ('Áudio e Música', 'audio-e-musica', 4, true),
  ('Programação e Aplicativos', 'programacao-e-aplicativos', 5, true),
  ('Agentes e Automação', 'agentes-e-automacao', 6, true),
  ('Dados e Análise', 'dados-e-analise', 7, true),
  ('Marketing e Negócios', 'marketing-e-negocios', 8, true),
  ('Arquitetura, 3D e Eventos', 'arquitetura-3d-e-eventos', 9, true),
  ('Documentos e Produtividade', 'documentos-e-produtividade', 10, true),
  ('Pesquisa e Educação', 'pesquisa-e-educacao', 11, true),
  ('Áreas Especializadas', 'areas-especializadas', 12, true)
on conflict do nothing;

-- Vídeo e Animação: exatamente oito subcategorias (modelo para as demais).
insert into public.categories (parent_id, nome, slug, ordem, is_system)
select c.id, s.nome, s.slug, s.ordem, true
  from public.categories c,
  (values
    ('Geração de Vídeo por IA', 'geracao-de-video-por-ia', 1),
    ('Câmeras e Cinematografia', 'cameras-e-cinematografia', 2),
    ('Roteiro e Storyboard', 'roteiro-e-storyboard', 3),
    ('Edição e Transições', 'edicao-e-transicoes', 4),
    ('Motion Graphics e Animação', 'motion-graphics-e-animacao', 5),
    ('Pós-produção e Finalização', 'pos-producao-e-finalizacao', 6),
    ('Som e Sincronização', 'som-e-sincronizacao', 7),
    ('Formatos e Aplicações', 'formatos-e-aplicacoes', 8)
  ) as s(nome, slug, ordem)
 where c.slug = 'video-e-animacao' and c.parent_id is null
on conflict do nothing;

-- Filtros comuns a todas as categorias.
insert into public.facets (slug, nome, category_id, ordem) values
  ('plataforma-ia', 'Plataforma de IA', null, 1),
  ('ferramenta', 'Ferramenta', null, 2),
  ('idioma', 'Idioma', null, 3),
  ('nivel', 'Nível', null, 4),
  ('custo', 'Custo', null, 5)
on conflict do nothing;

-- Filtros próprios de Vídeo e Animação.
insert into public.facets (slug, nome, category_id, ordem)
select f.slug, f.nome, c.id, f.ordem
  from public.categories c,
  (values
    ('formato-video', 'Formato', 10),
    ('duracao', 'Duração', 11),
    ('resolucao', 'Resolução', 12),
    ('estilo', 'Estilo', 13),
    ('movimento-camera', 'Movimento de câmera', 14)
  ) as f(slug, nome, ordem)
 where c.slug = 'video-e-animacao' and c.parent_id is null
on conflict do nothing;

insert into public.facet_values (facet_id, valor_pt, valor_en, sinonimos)
select f.id, v.pt, v.en, v.sin
  from (values
    ('idioma', 'Português', 'Portuguese', array['pt', 'pt-br']),
    ('idioma', 'Inglês', 'English', array['en']),
    ('nivel', 'Iniciante', 'Beginner', array['basico']),
    ('nivel', 'Intermediário', 'Intermediate', array[]::text[]),
    ('nivel', 'Avançado', 'Advanced', array[]::text[]),
    ('custo', 'Gratuito', 'Free', array['gratis', 'sem custo']),
    ('custo', 'Pago', 'Paid', array['assinatura']),
    ('formato-video', 'Horizontal 16:9', 'Landscape 16:9', array['16:9', 'widescreen']),
    ('formato-video', 'Vertical 9:16', 'Vertical 9:16', array['9:16', 'reels', 'shorts', 'stories']),
    ('formato-video', 'Quadrado 1:1', 'Square 1:1', array['1:1']),
    ('duracao', 'Até 15 segundos', 'Up to 15s', array[]::text[]),
    ('duracao', '15 a 60 segundos', '15 to 60s', array[]::text[]),
    ('duracao', 'Mais de 1 minuto', 'Over 1 minute', array[]::text[]),
    ('resolucao', '720p', '720p', array['hd']),
    ('resolucao', '1080p', '1080p', array['full hd', 'fhd']),
    ('resolucao', '4K', '4K', array['uhd', '2160p']),
    ('estilo', 'Cinematográfico', 'Cinematic', array['cinema', 'filme']),
    ('estilo', 'Realista', 'Photorealistic', array['fotorrealista', 'realistic']),
    ('estilo', 'Animação 2D', '2D animation', array['cartoon', 'desenho']),
    ('estilo', 'Animação 3D', '3D animation', array['cgi']),
    ('movimento-camera', 'FPV', 'FPV', array['first person view', 'drone fpv']),
    ('movimento-camera', 'Drone aéreo', 'Aerial drone', array['drone', 'aereo', 'aerial']),
    ('movimento-camera', 'Dolly', 'Dolly', array['dolly in', 'dolly out', 'travelling']),
    ('movimento-camera', 'Dolly zoom', 'Dolly zoom', array['vertigo', 'efeito vertigo']),
    ('movimento-camera', 'Panorâmica', 'Pan', array['pan', 'panoramica']),
    ('movimento-camera', 'Tilt', 'Tilt', array['inclinacao']),
    ('movimento-camera', 'Grua', 'Crane', array['crane shot', 'jib']),
    ('movimento-camera', 'Órbita', 'Orbit', array['orbital', 'arc shot'])
  ) as v(facet, pt, en, sin)
  join public.facets f on f.slug = v.facet
on conflict (facet_id, valor_pt) do nothing;

-- Sinônimos gerais de busca (PT/EN). O admin pode editar.
insert into public.search_synonyms (termo, sinonimos) values
  ('comercial', array['publicidade', 'anuncio', 'propaganda', 'commercial', 'ad', 'advertising']),
  ('automotivo', array['carro', 'automovel', 'veiculo', 'car', 'automotive', 'vehicle']),
  ('mergulho', array['dive', 'diving', 'nosedive', 'queda']),
  ('planilha', array['excel', 'xlsx', 'spreadsheet', 'sheets']),
  ('grafico', array['chart', 'graph', 'visualizacao']),
  ('painel', array['dashboard', 'indicadores', 'kpi']),
  ('video', array['filme', 'clip', 'movie']),
  ('imagem', array['image', 'foto', 'picture', 'ilustracao'])
on conflict do nothing;

insert into public.app_settings (chave, valor) values
  ('upload', '{"tamanho_maximo_mb": 25, "arquivos_por_envio": 20, "extensoes": ["pdf","doc","docx","xls","xlsx","txt","md","json"]}'),
  ('lixeira', '{"dias_retencao": 30}'),
  ('ia', '{"ativa": false, "provedor": null, "teto_mensal_usd": 0}')
on conflict (chave) do nothing;
