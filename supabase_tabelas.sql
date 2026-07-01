-- ============================================================
-- BENETEXTIL — Criar todas as tabelas no Supabase
-- Cole este código no SQL Editor do Supabase e clique em RUN
-- ============================================================

create table if not exists clientes (
  id bigserial primary key,
  nome text, telefone text, endereco text, data_pedido text,
  tipo_peca text, quantidade integer default 0,
  tamanhos text, cores text, tecido text, tecido_valor numeric default 0,
  estampa text, obs_servico text, data_entrega text,
  valor_total numeric default 0, entrada numeric default 0,
  forma_pagamento text, obs_corte text, obs_acabamento text,
  silk_qtd integer default 0,
  silk_1 text, silk_2 text, silk_3 text, silk_4 text,
  bordado_qtd integer default 0,
  bordado_1 text, bordado_2 text, bordado_3 text, bordado_4 text, bordado_5 text,
  costura_qtd integer default 0,
  costura_1 text, costura_val_1 numeric default 0,
  costura_2 text, costura_val_2 numeric default 0,
  costura_3 text, costura_val_3 numeric default 0,
  costura_4 text, costura_val_4 numeric default 0,
  costura_5 text, costura_val_5 numeric default 0,
  costura_total numeric default 0,
  cpf_cnpj text, email text, cidade text, estado text, observacoes text,
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists sublimacao (
  id bigserial primary key,
  descricao text, tecido text, cod_cor text,
  qtd_metro numeric default 0, valor_metro numeric default 0,
  uber numeric default 0, almoco numeric default 0,
  gasolina numeric default 0, estacionamento numeric default 0,
  brim numeric default 0,
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists produtos (
  id bigserial primary key,
  tipo text, nome text, cod_cor text,
  estoque integer default 0, estoque_minimo integer default 0,
  observacoes text, codigo text, categoria text,
  unidade text default 'UN', preco_custo numeric default 0, preco_venda numeric default 0,
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists contas_pagar (
  id bigserial primary key,
  descricao text, fornecedor text,
  valor numeric default 0, vencimento text,
  status text default 'pendente',
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists contas_receber (
  id bigserial primary key,
  descricao text, cliente text,
  valor numeric default 0, vencimento text,
  status text default 'pendente',
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists vendas (
  id bigserial primary key,
  numero text, cliente_id bigint, cliente_nome text,
  data text, forma_pagamento text,
  subtotal numeric default 0, desconto numeric default 0, total numeric default 0,
  status text default 'aberta',
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists itens_venda (
  id bigserial primary key,
  venda_id bigint, produto_id bigint, produto_nome text,
  quantidade numeric default 0, preco numeric default 0,
  desconto numeric default 0, total numeric default 0,
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists caixa (
  id bigserial primary key,
  data_abertura text, data_fechamento text,
  valor_abertura numeric default 0, valor_fechamento numeric default 0,
  valor_sistema numeric default 0, status text default 'aberto',
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists mov_caixa (
  id bigserial primary key,
  caixa_id bigint, tipo text, valor numeric default 0,
  descricao text, data text,
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists kardex (
  id bigserial primary key,
  produto_id bigint, produto_nome text, tipo text,
  quantidade numeric default 0, saldo_anterior numeric default 0,
  saldo_atual numeric default 0, descricao text, data text,
  ativo integer default 1, created_at timestamptz default now()
);

-- Liberar acesso público (app interno sem login)
alter table clientes      disable row level security;
alter table sublimacao    disable row level security;
alter table produtos      disable row level security;
alter table contas_pagar  disable row level security;
alter table contas_receber disable row level security;
alter table vendas        disable row level security;
alter table itens_venda   disable row level security;
alter table caixa         disable row level security;
alter table mov_caixa     disable row level security;
alter table kardex        disable row level security;

-- Confirmar
select 'Tabelas criadas com sucesso!' as resultado;
