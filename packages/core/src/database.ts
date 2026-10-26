
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_types": {
                  Row: {
                    "id": number,"nome": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"nome": string,"slug": string
                  }
                  Update: {
                    "id"?: never,"nome"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"app_settings": {
                  Row: {
                    "chave": string,"valor": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "chave": string,"valor": NonNullable<Json>
                  }
                  Update: {
                    "chave"?: string,"valor"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "acao": string,"ator": string | null,"diff": Json | null,"em": string,"entidade": string,"entidade_id": string,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "acao": string,"ator"?: string | null,"diff"?: Json | null,"em"?: string,"entidade": string,"entidade_id": string,"id"?: never
                  }
                  Update: {
                    "acao"?: string,"ator"?: string | null,"diff"?: Json | null,"em"?: string,"entidade"?: string,"entidade_id"?: string,"id"?: never
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"id": string,"is_system": boolean,"merged_into_id": string | null,"nome": string,"ordem": number,"parent_id": string | null,"slug": string,"status": Database["public"]['Enums']["status_categoria"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_system"?: boolean,"merged_into_id"?: string | null,"nome": string,"ordem"?: number,"parent_id"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["status_categoria"]
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_system"?: boolean,"merged_into_id"?: string | null,"nome"?: string,"ordem"?: number,"parent_id"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["status_categoria"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_merged_into_id_fkey"
      columns: ["merged_into_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"devices": {
                  Row: {
                    "id": string,"nome": string,"owner_id": string,"sistema": string | null,"ultima_sincronizacao": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"nome": string,"owner_id": string,"sistema"?: string | null,"ultima_sincronizacao"?: string | null
                  }
                  Update: {
                    "id"?: string,"nome"?: string,"owner_id"?: string,"sistema"?: string | null,"ultima_sincronizacao"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"facet_values": {
                  Row: {
                    "facet_id": string,"id": string,"sinonimos": (string)[],"status": Database["public"]['Enums']["status_vocabulario"],"valor_en": string | null,"valor_pt": string
                  }
                  ComputedFields: never
                  Insert: {
                    "facet_id": string,"id"?: string,"sinonimos"?: (string)[],"status"?: Database["public"]['Enums']["status_vocabulario"],"valor_en"?: string | null,"valor_pt": string
                  }
                  Update: {
                    "facet_id"?: string,"id"?: string,"sinonimos"?: (string)[],"status"?: Database["public"]['Enums']["status_vocabulario"],"valor_en"?: string | null,"valor_pt"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "facet_values_facet_id_fkey"
      columns: ["facet_id"]
isOneToOne: false
      referencedRelation: "facets"
      referencedColumns: ["id"]
    }
                  ]
                },"facets": {
                  Row: {
                    "category_id": string | null,"id": string,"nome": string,"ordem": number,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"id"?: string,"nome": string,"ordem"?: number,"slug": string
                  }
                  Update: {
                    "category_id"?: string | null,"id"?: string,"nome"?: string,"ordem"?: number,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "facets_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"resource_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"resource_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"resource_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"install_packages": {
                  Row: {
                    "aprovado_em": string | null,"aprovado_por": string | null,"created_at": string,"id": string,"manifesto": NonNullable<Json>,"resource_id": string,"tipo": Database["public"]['Enums']["tipo_pacote"],"versao": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aprovado_em"?: string | null,"aprovado_por"?: string | null,"created_at"?: string,"id"?: string,"manifesto": NonNullable<Json>,"resource_id": string,"tipo": Database["public"]['Enums']["tipo_pacote"],"versao"?: string
                  }
                  Update: {
                    "aprovado_em"?: string | null,"aprovado_por"?: string | null,"created_at"?: string,"id"?: string,"manifesto"?: NonNullable<Json>,"resource_id"?: string,"tipo"?: Database["public"]['Enums']["tipo_pacote"],"versao"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "install_packages_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"installations": {
                  Row: {
                    "alvo": Database["public"]['Enums']["alvo_instalacao"],"caminho": string | null,"device_id": string,"escopo": Database["public"]['Enums']["escopo_instalacao"],"id": string,"instalado_em": string | null,"package_id": string | null,"removido_em": string | null,"resource_id": string,"status": Database["public"]['Enums']["status_instalacao"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alvo"?: Database["public"]['Enums']["alvo_instalacao"],"caminho"?: string | null,"device_id": string,"escopo"?: Database["public"]['Enums']["escopo_instalacao"],"id"?: string,"instalado_em"?: string | null,"package_id"?: string | null,"removido_em"?: string | null,"resource_id": string,"status": Database["public"]['Enums']["status_instalacao"],"updated_at"?: string
                  }
                  Update: {
                    "alvo"?: Database["public"]['Enums']["alvo_instalacao"],"caminho"?: string | null,"device_id"?: string,"escopo"?: Database["public"]['Enums']["escopo_instalacao"],"id"?: string,"instalado_em"?: string | null,"package_id"?: string | null,"removido_em"?: string | null,"resource_id"?: string,"status"?: Database["public"]['Enums']["status_instalacao"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "installations_device_id_fkey"
      columns: ["device_id"]
isOneToOne: false
      referencedRelation: "devices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "installations_package_id_fkey"
      columns: ["package_id"]
isOneToOne: false
      referencedRelation: "install_packages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "installations_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_environments": {
                  Row: {
                    "id": number,"instalacao_automatica": boolean,"nome": string,"notas": string | null,"platform_id": number,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"instalacao_automatica"?: boolean,"nome": string,"notas"?: string | null,"platform_id": number,"slug": string
                  }
                  Update: {
                    "id"?: never,"instalacao_automatica"?: boolean,"nome"?: string,"notas"?: string | null,"platform_id"?: number,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "platform_environments_platform_id_fkey"
      columns: ["platform_id"]
isOneToOne: false
      referencedRelation: "platforms"
      referencedColumns: ["id"]
    }
                  ]
                },"platforms": {
                  Row: {
                    "id": number,"nome": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"nome": string,"slug": string
                  }
                  Update: {
                    "id"?: never,"nome"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "ativo": boolean,"created_at": string,"criado_por": string | null,"id": string,"nome": string,"papel": Database["public"]['Enums']["papel_usuario"]
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"criado_por"?: string | null,"id": string,"nome"?: string,"papel"?: Database["public"]['Enums']["papel_usuario"]
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"criado_por"?: string | null,"id"?: string,"nome"?: string,"papel"?: Database["public"]['Enums']["papel_usuario"]
                  }
                  Relationships: [
                    
                  ]
                },"resource_categories": {
                  Row: {
                    "category_id": string,"papel": Database["public"]['Enums']["papel_categoria"],"resource_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"papel"?: Database["public"]['Enums']["papel_categoria"],"resource_id": string
                  }
                  Update: {
                    "category_id"?: string,"papel"?: Database["public"]['Enums']["papel_categoria"],"resource_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resource_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resource_categories_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"resource_commands": {
                  Row: {
                    "acionamento": Database["public"]['Enums']["tipo_acionamento"],"comando": string,"environment_id": number,"exemplo_completo": string | null,"fonte_url": string | null,"id": string,"resource_id": string,"verificacao": Database["public"]['Enums']["verificacao_comando"],"verificado_em": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "acionamento": Database["public"]['Enums']["tipo_acionamento"],"comando": string,"environment_id": number,"exemplo_completo"?: string | null,"fonte_url"?: string | null,"id"?: string,"resource_id": string,"verificacao"?: Database["public"]['Enums']["verificacao_comando"],"verificado_em"?: string | null
                  }
                  Update: {
                    "acionamento"?: Database["public"]['Enums']["tipo_acionamento"],"comando"?: string,"environment_id"?: number,"exemplo_completo"?: string | null,"fonte_url"?: string | null,"id"?: string,"resource_id"?: string,"verificacao"?: Database["public"]['Enums']["verificacao_comando"],"verificado_em"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "resource_commands_environment_id_fkey"
      columns: ["environment_id"]
isOneToOne: false
      referencedRelation: "platform_environments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resource_commands_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"resource_compatibility": {
                  Row: {
                    "avaliado_em": string | null,"avaliado_por": string | null,"environment_id": number,"fonte_url": string | null,"id": string,"notas": string | null,"resource_id": string,"resultado": Database["public"]['Enums']["resultado_compatibilidade"],"status_instalacao": Database["public"]['Enums']["status_instalacao_conhecido"]
                  }
                  ComputedFields: never
                  Insert: {
                    "avaliado_em"?: string | null,"avaliado_por"?: string | null,"environment_id": number,"fonte_url"?: string | null,"id"?: string,"notas"?: string | null,"resource_id": string,"resultado"?: Database["public"]['Enums']["resultado_compatibilidade"],"status_instalacao"?: Database["public"]['Enums']["status_instalacao_conhecido"]
                  }
                  Update: {
                    "avaliado_em"?: string | null,"avaliado_por"?: string | null,"environment_id"?: number,"fonte_url"?: string | null,"id"?: string,"notas"?: string | null,"resource_id"?: string,"resultado"?: Database["public"]['Enums']["resultado_compatibilidade"],"status_instalacao"?: Database["public"]['Enums']["status_instalacao_conhecido"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "resource_compatibility_environment_id_fkey"
      columns: ["environment_id"]
isOneToOne: false
      referencedRelation: "platform_environments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resource_compatibility_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"resource_descriptions": {
                  Row: {
                    "aprovado_em": string | null,"aprovado_por": string | null,"campos": NonNullable<Json>,"campos_ausentes": (string)[],"created_at": string,"created_by": string | null,"derived_from_id": string | null,"gerado_por": Database["public"]['Enums']["origem_dado"],"id": string,"modelo": string | null,"o_que_faz": string | null,"para_que_serve": string | null,"resource_id": string,"resumo": string | null,"status": Database["public"]['Enums']["status_descricao"],"versao": number
                  }
                  ComputedFields: never
                  Insert: {
                    "aprovado_em"?: string | null,"aprovado_por"?: string | null,"campos"?: NonNullable<Json>,"campos_ausentes"?: (string)[],"created_at"?: string,"created_by"?: string | null,"derived_from_id"?: string | null,"gerado_por"?: Database["public"]['Enums']["origem_dado"],"id"?: string,"modelo"?: string | null,"o_que_faz"?: string | null,"para_que_serve"?: string | null,"resource_id": string,"resumo"?: string | null,"status"?: Database["public"]['Enums']["status_descricao"],"versao": number
                  }
                  Update: {
                    "aprovado_em"?: string | null,"aprovado_por"?: string | null,"campos"?: NonNullable<Json>,"campos_ausentes"?: (string)[],"created_at"?: string,"created_by"?: string | null,"derived_from_id"?: string | null,"gerado_por"?: Database["public"]['Enums']["origem_dado"],"id"?: string,"modelo"?: string | null,"o_que_faz"?: string | null,"para_que_serve"?: string | null,"resource_id"?: string,"resumo"?: string | null,"status"?: Database["public"]['Enums']["status_descricao"],"versao"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "resource_descriptions_derived_from_id_fkey"
      columns: ["derived_from_id"]
isOneToOne: false
      referencedRelation: "resource_descriptions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resource_descriptions_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"resource_facet_values": {
                  Row: {
                    "facet_value_id": string,"resource_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "facet_value_id": string,"resource_id": string
                  }
                  Update: {
                    "facet_value_id"?: string,"resource_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resource_facet_values_facet_value_id_fkey"
      columns: ["facet_value_id"]
isOneToOne: false
      referencedRelation: "facet_values"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resource_facet_values_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"resource_tags": {
                  Row: {
                    "origem": Database["public"]['Enums']["origem_dado"],"resource_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "origem"?: Database["public"]['Enums']["origem_dado"],"resource_id": string,"tag_id": string
                  }
                  Update: {
                    "origem"?: Database["public"]['Enums']["origem_dado"],"resource_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resource_tags_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resource_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"resource_types": {
                  Row: {
                    "id": number,"nome": string,"ordem": number,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"nome": string,"ordem"?: number,"slug": string
                  }
                  Update: {
                    "id"?: never,"nome"?: string,"ordem"?: number,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"resource_versions": {
                  Row: {
                    "alterado_em": string,"alterado_por": string | null,"id": number,"resource_id": string,"resumo": string | null,"snapshot": NonNullable<Json>,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "alterado_em"?: string,"alterado_por"?: string | null,"id"?: never,"resource_id": string,"resumo"?: string | null,"snapshot": NonNullable<Json>,"version": number
                  }
                  Update: {
                    "alterado_em"?: string,"alterado_por"?: string | null,"id"?: never,"resource_id"?: string,"resumo"?: string | null,"snapshot"?: NonNullable<Json>,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "resource_versions_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"resources": {
                  Row: {
                    "activity_type_id": number | null,"aprovacao": Database["public"]['Enums']["status_aprovacao"],"autor": string | null,"content_hash": string | null,"conteudo": string,"created_at": string,"current_description_id": string | null,"deleted_at": string | null,"deleted_by": string | null,"derived_from_id": string | null,"embedding_reservado": Json | null,"id": string,"importado_em": string | null,"instalacao_md": string | null,"is_sample": boolean,"link_oficial": string | null,"owner_id": string | null,"parametros": NonNullable<Json>,"search_document": string,"search_tsv": unknown,"slug": string,"titulo": string,"type_id": number,"updated_at": string,"updated_by": string | null,"verificado_em": string | null,"versao_recurso": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_type_id"?: number | null,"aprovacao"?: Database["public"]['Enums']["status_aprovacao"],"autor"?: string | null,"content_hash"?: string | null,"conteudo"?: string,"created_at"?: string,"current_description_id"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"derived_from_id"?: string | null,"embedding_reservado"?: Json | null,"id"?: string,"importado_em"?: string | null,"instalacao_md"?: string | null,"is_sample"?: boolean,"link_oficial"?: string | null,"owner_id"?: string | null,"parametros"?: NonNullable<Json>,"search_document"?: string,"search_tsv"?: unknown,"slug": string,"titulo": string,"type_id": number,"updated_at"?: string,"updated_by"?: string | null,"verificado_em"?: string | null,"versao_recurso"?: string | null,"version"?: number
                  }
                  Update: {
                    "activity_type_id"?: number | null,"aprovacao"?: Database["public"]['Enums']["status_aprovacao"],"autor"?: string | null,"content_hash"?: string | null,"conteudo"?: string,"created_at"?: string,"current_description_id"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"derived_from_id"?: string | null,"embedding_reservado"?: Json | null,"id"?: string,"importado_em"?: string | null,"instalacao_md"?: string | null,"is_sample"?: boolean,"link_oficial"?: string | null,"owner_id"?: string | null,"parametros"?: NonNullable<Json>,"search_document"?: string,"search_tsv"?: unknown,"slug"?: string,"titulo"?: string,"type_id"?: number,"updated_at"?: string,"updated_by"?: string | null,"verificado_em"?: string | null,"versao_recurso"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "resources_activity_type_id_fkey"
      columns: ["activity_type_id"]
isOneToOne: false
      referencedRelation: "activity_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resources_current_description_fk"
      columns: ["current_description_id"]
isOneToOne: false
      referencedRelation: "resource_descriptions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resources_derived_from_id_fkey"
      columns: ["derived_from_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resources_type_id_fkey"
      columns: ["type_id"]
isOneToOne: false
      referencedRelation: "resource_types"
      referencedColumns: ["id"]
    }
                  ]
                },"search_synonyms": {
                  Row: {
                    "id": string,"sinonimos": (string)[],"termo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"sinonimos"?: (string)[],"termo": string
                  }
                  Update: {
                    "id"?: string,"sinonimos"?: (string)[],"termo"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tags": {
                  Row: {
                    "category_id": string | null,"created_at": string,"id": string,"nome_en": string | null,"nome_pt": string,"sinonimos": (string)[],"status": Database["public"]['Enums']["status_vocabulario"],"sugerida_por": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"created_at"?: string,"id"?: string,"nome_en"?: string | null,"nome_pt": string,"sinonimos"?: (string)[],"status"?: Database["public"]['Enums']["status_vocabulario"],"sugerida_por"?: string | null
                  }
                  Update: {
                    "category_id"?: string | null,"created_at"?: string,"id"?: string,"nome_en"?: string | null,"nome_pt"?: string,"sinonimos"?: (string)[],"status"?: Database["public"]['Enums']["status_vocabulario"],"sugerida_por"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tags_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "buscar_tag_por_nome":
{ Args: { "p_nome": string }; Returns: string
                           },
"estatisticas_admin":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"esvaziar_lixeira":
{ Args: { "p_dias"?: number }; Returns: number
                           },
"expandir_termo":
{ Args: { "p_termo": string }; Returns: (string)[]
                           },
"f_unaccent":
{ Args: { "": string }; Returns: string
                           },
"grupo_tsquery":
{ Args: { "p_termos": (string)[] }; Returns: unknown
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"normalizar":
{ Args: { "": string }; Returns: string
                           },
"refresh_resource_search":
{ Args: { "p_resource_id": string }; Returns: undefined
                           },
"salvar_como":
{ Args: { "p_novo_titulo": string,"p_resource_id": string }; Returns: string
                           },
"search_resources":
{ Args: { "p_atualizado_desde"?: string,"p_category_ids"?: (string)[],"p_facet_value_ids"?: (string)[],"p_limite"?: number,"p_offset"?: number,"p_ordem"?: string,"p_platform_slugs"?: (string)[],"p_q"?: string,"p_somente_favoritos"?: boolean,"p_tag_ids"?: (string)[],"p_type_slugs"?: (string)[] }; Returns: {
              "grupos_casados": number,"rank": number,"resource_id": string,"total": number
            }[]
                           },
"unir_categorias":
{ Args: { "p_destino": string,"p_origem": string }; Returns: undefined
                           },
"usuario_ativo":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "alvo_instalacao": "claude_code","escopo_instalacao": "user"|"project"|"local","origem_dado": "manual"|"importado"|"regras"|"ia","papel_categoria": "principal"|"secundaria","papel_usuario": "admin"|"convidado","resultado_compatibilidade": "comprovada"|"declarada_na_fonte"|"nao_verificada"|"incompativel"|"nao_se_aplica","status_aprovacao": "rascunho"|"em_revisao"|"aprovado","status_categoria": "ativa"|"unida"|"arquivada","status_descricao": "rascunho"|"em_revisao"|"aprovada"|"substituida","status_instalacao": "instalado"|"removido"|"falhou","status_instalacao_conhecido": "instalado"|"requer_configuracao"|"desconhecido","status_vocabulario": "sugerida"|"aprovada"|"rejeitada","tipo_acionamento": "mencao_app"|"comando_barra"|"cli"|"link_instalacao"|"manual","tipo_pacote": "skill"|"plugin"|"mcp"|"comando","verificacao_comando": "verificado"|"encontrado_na_doc"|"nao_verificado"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "alvo_instalacao": ["claude_code"],"escopo_instalacao": ["user", "project", "local"],"origem_dado": ["manual", "importado", "regras", "ia"],"papel_categoria": ["principal", "secundaria"],"papel_usuario": ["admin", "convidado"],"resultado_compatibilidade": ["comprovada", "declarada_na_fonte", "nao_verificada", "incompativel", "nao_se_aplica"],"status_aprovacao": ["rascunho", "em_revisao", "aprovado"],"status_categoria": ["ativa", "unida", "arquivada"],"status_descricao": ["rascunho", "em_revisao", "aprovada", "substituida"],"status_instalacao": ["instalado", "removido", "falhou"],"status_instalacao_conhecido": ["instalado", "requer_configuracao", "desconhecido"],"status_vocabulario": ["sugerida", "aprovada", "rejeitada"],"tipo_acionamento": ["mencao_app", "comando_barra", "cli", "link_instalacao", "manual"],"tipo_pacote": ["skill", "plugin", "mcp", "comando"],"verificacao_comando": ["verificado", "encontrado_na_doc", "nao_verificado"]
          }
        }
} as const
