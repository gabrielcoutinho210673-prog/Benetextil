-- BENETEXTIL — Adiciona coluna produto na tabela compras
alter table compras add column if not exists produto text default '';

select 'Coluna produto adicionada em compras!' as resultado;
