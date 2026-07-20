-- BENETEXTIL — Adicionar valor do corte na tabela clientes
alter table clientes add column if not exists corte_valor numeric default 0;

select 'Coluna corte_valor adicionada!' as resultado;
