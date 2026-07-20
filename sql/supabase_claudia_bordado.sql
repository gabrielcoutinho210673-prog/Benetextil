-- BENETEXTIL — Bordado com custo (Claudia)
alter table clientes add column if not exists bordado_pecas_qtd numeric default 0;
alter table clientes add column if not exists bordado_pecas_val numeric default 0;

select 'Colunas bordado_pecas adicionadas!' as resultado;
