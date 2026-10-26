-- MindMapper · DADOS DE EXEMPLO PARA TESTES.
-- Todos marcados com is_sample = true e exibidos com o selo "Exemplo ilustrativo".
-- Não são recursos reais verificados. Não rodar em produção.
-- Remover todos: delete from public.resources where is_sample;

do $$
declare
  t_skill smallint := (select id from public.resource_types where slug = 'skill');
  t_prompt smallint := (select id from public.resource_types where slug = 'prompt');
  env_cc smallint := (select id from public.platform_environments where slug = 'claude-code');
  env_gpt smallint := (select id from public.platform_environments where slug = 'chatgpt');
  cat_dados uuid := (select id from public.categories where slug = 'dados-e-analise' and parent_id is null);
  cat_video uuid := (select id from public.categories where slug = 'video-e-animacao' and parent_id is null);
  sub_cameras uuid := (select id from public.categories where slug = 'cameras-e-cinematografia');
  sub_formatos uuid := (select id from public.categories where slug = 'formatos-e-aplicacoes');
  sub_geracao uuid := (select id from public.categories where slug = 'geracao-de-video-por-ia');
  r1 uuid; r2 uuid; r3 uuid; d uuid;
  tag_fpv uuid; tag_pub uuid; tag_auto uuid; tag_dash uuid;
begin
  insert into public.tags (nome_pt, nome_en, sinonimos, status) values
    ('FPV', 'FPV', array['first person view', 'drone fpv'], 'aprovada') returning id into tag_fpv;
  insert into public.tags (nome_pt, nome_en, sinonimos, status) values
    ('Publicidade', 'Advertising', array['comercial', 'anuncio', 'propaganda', 'commercial', 'ad'], 'aprovada') returning id into tag_pub;
  insert into public.tags (nome_pt, nome_en, sinonimos, status) values
    ('Automotivo', 'Automotive', array['carro', 'automovel', 'car'], 'aprovada') returning id into tag_auto;
  insert into public.tags (nome_pt, nome_en, sinonimos, status) values
    ('Dashboard', 'Dashboard', array['painel', 'indicadores', 'kpi'], 'aprovada') returning id into tag_dash;

  -- 1. O exemplo do Bob: Build Dashboard
  insert into public.resources (type_id, titulo, slug, conteudo, aprovacao, is_sample)
  values (t_skill, 'Build Dashboard', 'build-dashboard',
          'EXEMPLO ILUSTRATIVO. Conteúdo original da skill não importado.', 'aprovado', true)
  returning id into r1;
  insert into public.resource_descriptions (resource_id, versao, resumo, o_que_faz, para_que_serve, campos, campos_ausentes, status)
  values (r1, 1,
    'Cria painéis interativos com indicadores, tabelas e gráficos.',
    'Auxilia na criação de painéis interativos para visualizar indicadores, tabelas e gráficos.',
    'Organizar dados de vendas, faturamento, campanhas e resultados em dashboards.',
    jsonb_build_object(
      'como_utilizar', jsonb_build_object('valor', 'Consultar as instruções originais da skill, verificar a instalação e copiar o comando adequado ao ambiente.', 'origem', 'manual', 'estado', 'nao_verificado'),
      'resultados', jsonb_build_object('valor', 'Código, componentes visuais e estrutura de um painel, dependendo das capacidades efetivas da skill.', 'origem', 'manual', 'estado', 'nao_verificado'),
      'requisitos', jsonb_build_object('valor', null, 'origem', 'manual', 'estado', 'ausente')),
    array['requisitos'], 'aprovada')
  returning id into d;
  update public.resources set current_description_id = d where id = r1;
  insert into public.resource_categories values (r1, cat_dados, 'principal');
  insert into public.resource_tags values (r1, tag_dash, 'manual');
  insert into public.resource_compatibility (resource_id, environment_id, resultado) values (r1, env_cc, 'nao_verificada');

  -- 2 e 3. Recursos para o teste "FPV drone dive em comercial automotivo"
  insert into public.resources (type_id, titulo, slug, conteudo, aprovacao, is_sample)
  values (t_prompt, 'Plano FPV para filme de carro', 'plano-fpv-filme-carro',
          'EXEMPLO ILUSTRATIVO. Prompt de teste: tomada FPV mergulhando sobre o veículo em movimento.', 'aprovado', true)
  returning id into r2;
  insert into public.resource_descriptions (resource_id, versao, resumo, o_que_faz, para_que_serve, status)
  values (r2, 1, 'Descreve uma tomada de câmera FPV para vídeo publicitário de veículos.',
          'Gera a descrição de um movimento de câmera em primeira pessoa (FPV) sobre um veículo.',
          'Planejar cenas de filmes publicitários.', 'aprovada')
  returning id into d;
  update public.resources set current_description_id = d where id = r2;
  insert into public.resource_categories values (r2, cat_video, 'principal'), (r2, sub_cameras, 'secundaria'), (r2, sub_formatos, 'secundaria');
  insert into public.resource_tags values (r2, tag_fpv, 'manual'), (r2, tag_pub, 'manual'), (r2, tag_auto, 'manual');
  insert into public.resource_compatibility (resource_id, environment_id, resultado) values
    (r2, env_gpt, 'nao_verificada'), (r2, env_cc, 'nao_verificada');

  insert into public.resources (type_id, titulo, slug, conteudo, aprovacao, is_sample)
  values (t_prompt, 'Roteiro de cena aérea', 'roteiro-cena-aerea',
          'EXEMPLO ILUSTRATIVO. Prompt de teste genérico para drone, sem relação com publicidade.', 'aprovado', true)
  returning id into r3;
  insert into public.resource_descriptions (resource_id, versao, resumo, o_que_faz, para_que_serve, status)
  values (r3, 1, 'Sugere tomadas aéreas com drone para paisagens.', 'Gera ideias de tomadas aéreas.',
          'Planejar vídeos de paisagem.', 'aprovada')
  returning id into d;
  update public.resources set current_description_id = d where id = r3;
  insert into public.resource_categories values (r3, cat_video, 'principal'), (r3, sub_geracao, 'secundaria');
  insert into public.resource_facet_values
    select r3, fv.id from public.facet_values fv where fv.valor_pt = 'Drone aéreo';
end $$;
