-- BENETEXTIL — Corrigir colunas faltantes em contas_casa
-- (a tela usa fornecedor/vencimento/observacao, mas a tabela não tinha essas colunas)

alter table contas_casa add column if not exists fornecedor text default '';
alter table contas_casa add column if not exists vencimento date;
alter table contas_casa add column if not exists observacao text default '';

-- migra dados antigos da coluna "data" para "vencimento", se existir
do $$ begin
  if exists (select 1 from information_schema.columns where table_name='contas_casa' and column_name='data') then
    execute 'update contas_casa set vencimento = data where vencimento is null and data is not null';
  end if;
end $$;

-- migra dados antigos da coluna "observacoes" para "observacao", se existir
do $$ begin
  if exists (select 1 from information_schema.columns where table_name='contas_casa' and column_name='observacoes') then
    execute 'update contas_casa set observacao = observacoes where (observacao is null or observacao = '''') and observacoes is not null';
  end if;
end $$;

select 'Colunas fornecedor/vencimento/observacao corrigidas em contas_casa!' as resultado;
