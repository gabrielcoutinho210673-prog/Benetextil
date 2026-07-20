-- BENETEXTIL — Criar tabela de compras da empresa
create table if not exists compras (
  id              bigserial primary key,
  descricao       text not null,
  fornecedor      text default '',
  valor_total     numeric default 0,
  parcelas        integer default 1,
  forma_pagamento text default '',
  data_compra     date,
  observacoes     text default '',
  ativo           integer default 1,
  created_at      timestamptz default now()
);

alter table compras enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='compras' and policyname='Autenticados - compras'
  ) then
    execute 'create policy "Autenticados - compras" on compras for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

select 'Tabela compras criada com sucesso!' as resultado;
