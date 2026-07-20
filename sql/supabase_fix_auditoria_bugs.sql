-- BENETEXTIL — Correções da auditoria de bugs (colunas/tabelas faltantes)

-- Compras: categoria (nova, além dos campos originais que já existem)
alter table compras add column if not exists categoria text default '';

-- Produtos: localização no estoque
alter table produtos add column if not exists localizacao text default '';

-- Clientes cadastrados: bairro (bug antigo, já existia antes desta auditoria)
alter table clientes_cad add column if not exists bairro text default '';

-- Contas a pagar / receber: observação e data do pagamento
alter table contas_pagar add column if not exists observacao text default '';
alter table contas_pagar add column if not exists data_pag date;
alter table contas_receber add column if not exists observacao text default '';
alter table contas_receber add column if not exists data_pag date;

-- Uniforme: SILK por cor (qtd e valor de cada uma das 4 cores)
alter table clientes add column if not exists silk_qtd_1 numeric default 0;
alter table clientes add column if not exists silk_val_1 numeric default 0;
alter table clientes add column if not exists silk_qtd_2 numeric default 0;
alter table clientes add column if not exists silk_val_2 numeric default 0;
alter table clientes add column if not exists silk_qtd_3 numeric default 0;
alter table clientes add column if not exists silk_val_3 numeric default 0;
alter table clientes add column if not exists silk_qtd_4 numeric default 0;
alter table clientes add column if not exists silk_val_4 numeric default 0;

-- Categorias (tabela nunca tinha sido criada)
create table if not exists categorias (
  id bigserial primary key,
  nome text not null,
  tipo text default '',
  descricao text default '',
  ativo integer default 1,
  created_at timestamptz default now()
);
alter table categorias enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='categorias' and policyname='Autenticados - categorias') then
    execute 'create policy "Autenticados - categorias" on categorias for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

-- Fornecedores (tabela nunca tinha sido criada)
create table if not exists fornecedores (
  id bigserial primary key,
  nome text not null,
  cnpj text default '',
  telefone text default '',
  email text default '',
  contato text default '',
  endereco text default '',
  cidade text default '',
  estado text default '',
  observacao text default '',
  ativo integer default 1,
  created_at timestamptz default now()
);
alter table fornecedores enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='fornecedores' and policyname='Autenticados - fornecedores') then
    execute 'create policy "Autenticados - fornecedores" on fornecedores for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

select 'Correções da auditoria aplicadas com sucesso!' as resultado;
