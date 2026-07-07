-- BENETEXTIL — Valor de venda por peça (para cálculo de lucro)
alter table clientes add column if not exists venda_valor       numeric default 0;
alter table clientes add column if not exists peca2_venda_valor numeric default 0;
alter table clientes add column if not exists peca3_venda_valor numeric default 0;
alter table clientes add column if not exists peca4_venda_valor numeric default 0;
alter table clientes add column if not exists peca5_venda_valor numeric default 0;

select 'Colunas venda_valor adicionadas!' as resultado;
