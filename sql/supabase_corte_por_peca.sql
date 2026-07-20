-- BENETEXTIL — Corte por peça (qtd + valor/un)
alter table clientes add column if not exists corte_qtd         numeric default 0;
alter table clientes add column if not exists peca2_corte_qtd   numeric default 0;
alter table clientes add column if not exists peca2_corte_valor numeric default 0;
alter table clientes add column if not exists peca3_corte_qtd   numeric default 0;
alter table clientes add column if not exists peca3_corte_valor numeric default 0;
alter table clientes add column if not exists peca4_corte_qtd   numeric default 0;
alter table clientes add column if not exists peca4_corte_valor numeric default 0;
alter table clientes add column if not exists peca5_corte_qtd   numeric default 0;
alter table clientes add column if not exists peca5_corte_valor numeric default 0;

select 'Colunas de corte por peca adicionadas!' as resultado;
