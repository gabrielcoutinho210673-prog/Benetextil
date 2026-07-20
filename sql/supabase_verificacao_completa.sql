-- ============================================================
-- BENETEXTIL — SQL DE VERIFICAÇÃO E SINCRONIZAÇÃO COMPLETA
-- Cole no SQL Editor do Supabase e clique em RUN
-- Seguro: usa "add column if not exists" — não apaga nada
-- ============================================================

-- ── TABELA: clientes ─────────────────────────────────────────
-- Aviamentos (adicionados depois da criação inicial)
alter table clientes add column if not exists aviamento_botao      numeric default 0;
alter table clientes add column if not exists aviamento_ziper      numeric default 0;
alter table clientes add column if not exists aviamento_elastico   numeric default 0;
alter table clientes add column if not exists aviamento_ilhos      numeric default 0;
alter table clientes add column if not exists aviamento_entretela  numeric default 0;
alter table clientes add column if not exists aviamento_cordao     numeric default 0;
alter table clientes add column if not exists aviamento_cadarco    numeric default 0;

-- Costura: quantidade de peças por costureira
alter table clientes add column if not exists costura_qtd_1 numeric default 0;
alter table clientes add column if not exists costura_qtd_2 numeric default 0;
alter table clientes add column if not exists costura_qtd_3 numeric default 0;
alter table clientes add column if not exists costura_qtd_4 numeric default 0;
alter table clientes add column if not exists costura_qtd_5 numeric default 0;

-- Peças 2 a 5 (múltiplos tipos de peça por pedido)
alter table clientes add column if not exists peca2_tipo          text default '';
alter table clientes add column if not exists peca2_qtd           text default '';
alter table clientes add column if not exists peca2_tamanhos      text default '';
alter table clientes add column if not exists peca2_cores         text default '';
alter table clientes add column if not exists peca2_tecido        text default '';
alter table clientes add column if not exists peca2_tecido_valor  numeric default 0;
alter table clientes add column if not exists peca2_estampa       text default '';
alter table clientes add column if not exists peca2_obs           text default '';

alter table clientes add column if not exists peca3_tipo          text default '';
alter table clientes add column if not exists peca3_qtd           text default '';
alter table clientes add column if not exists peca3_tamanhos      text default '';
alter table clientes add column if not exists peca3_cores         text default '';
alter table clientes add column if not exists peca3_tecido        text default '';
alter table clientes add column if not exists peca3_tecido_valor  numeric default 0;
alter table clientes add column if not exists peca3_estampa       text default '';
alter table clientes add column if not exists peca3_obs           text default '';

alter table clientes add column if not exists peca4_tipo          text default '';
alter table clientes add column if not exists peca4_qtd           text default '';
alter table clientes add column if not exists peca4_tamanhos      text default '';
alter table clientes add column if not exists peca4_cores         text default '';
alter table clientes add column if not exists peca4_tecido        text default '';
alter table clientes add column if not exists peca4_tecido_valor  numeric default 0;
alter table clientes add column if not exists peca4_estampa       text default '';
alter table clientes add column if not exists peca4_obs           text default '';

alter table clientes add column if not exists peca5_tipo          text default '';
alter table clientes add column if not exists peca5_qtd           text default '';
alter table clientes add column if not exists peca5_tamanhos      text default '';
alter table clientes add column if not exists peca5_cores         text default '';
alter table clientes add column if not exists peca5_tecido        text default '';
alter table clientes add column if not exists peca5_tecido_valor  numeric default 0;
alter table clientes add column if not exists peca5_estampa       text default '';
alter table clientes add column if not exists peca5_obs           text default '';

-- ── TABELA: sublimacao ───────────────────────────────────────
alter table sublimacao add column if not exists mao_obra_anderson  numeric default 0;
alter table sublimacao add column if not exists valor_venda        numeric default 0;
alter table sublimacao add column if not exists nome_cliente       text default '';
alter table sublimacao add column if not exists telefone_cliente   text default '';
alter table sublimacao add column if not exists data_pedido        date;
alter table sublimacao add column if not exists endereco_cliente   text default '';

-- ── TABELA: clientes_cad (criar se não existir) ──────────────
create table if not exists clientes_cad (
  id          bigserial primary key,
  nome        text not null,
  cnpj        text,
  telefone    text,
  email       text,
  contato     text,
  endereco    text,
  cidade      text,
  estado      text,
  observacoes text,
  ativo       integer default 1,
  created_at  timestamptz default now()
);

-- RLS para clientes_cad
alter table clientes_cad enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='clientes_cad' and policyname='Autenticados - clientes_cad'
  ) then
    execute 'create policy "Autenticados - clientes_cad" on clientes_cad for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

-- ── CONFIRMAÇÃO ──────────────────────────────────────────────
select 'Banco de dados sincronizado com sucesso!' as resultado;
