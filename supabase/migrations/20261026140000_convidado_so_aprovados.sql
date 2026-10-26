-- Convidados liam as tabelas filhas (ficha, comandos, pacotes…) de qualquer recurso,
-- inclusive rascunhos e itens na lixeira. Agora a leitura acompanha a visibilidade do
-- próprio recurso: a subconsulta em resources já passa pela política resources_ler.
-- Migração aditiva: só troca políticas de leitura; nenhum dado é alterado.
do $$
declare t text;
begin
  foreach t in array array['resource_categories','resource_tags','resource_facet_values','resource_descriptions',
                           'resource_compatibility','resource_commands','install_packages']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_ler', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
         public.usuario_ativo() and exists (select 1 from public.resources r where r.id = resource_id))',
      t || '_ler', t);
  end loop;
end $$;
