-- ============================================================
-- Módulo Cartões de Crédito
-- ============================================================
create table if not exists cartoes (
  id bigserial primary key,
  nome text, cor text default '#4361ee',
  limite numeric default 0,
  dia_fechamento integer default 1,
  dia_vencimento integer default 10,
  ativo integer default 1, created_at timestamptz default now()
);

create table if not exists lancamentos_cartao (
  id bigserial primary key,
  cartao_id bigint,
  descricao text, categoria text,
  data text, valor numeric default 0,
  parcela_atual integer default 1,
  parcela_total integer,
  fatura text, -- 'YYYY-MM' da fatura a que o lançamento pertence
  status text default 'pendente', -- pendente | pago
  ativo integer default 1, created_at timestamptz default now()
);

alter table cartoes enable row level security;
alter table lancamentos_cartao enable row level security;

create policy "Autenticados - cartoes"           on cartoes           for all using (auth.role() = 'authenticated');
create policy "Autenticados - lancamentos_cartao" on lancamentos_cartao for all using (auth.role() = 'authenticated');

select 'Tabelas de Cartões de Crédito criadas com sucesso!' as resultado;
