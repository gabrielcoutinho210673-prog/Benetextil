-- BENETEXTIL — Valor de estampa/bordado por peça
alter table clientes add column if not exists estampa_valor      numeric default 0;
alter table clientes add column if not exists peca2_estampa_valor numeric default 0;
alter table clientes add column if not exists peca3_estampa_valor numeric default 0;
alter table clientes add column if not exists peca4_estampa_valor numeric default 0;
alter table clientes add column if not exists peca5_estampa_valor numeric default 0;

select 'Colunas estampa_valor adicionadas!' as resultado;
