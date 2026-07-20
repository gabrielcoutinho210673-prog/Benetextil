-- BENETEXTIL — Adicionar quantidade de peças por costureira
alter table clientes add column if not exists costura_qtd_1 numeric default 0;
alter table clientes add column if not exists costura_qtd_2 numeric default 0;
alter table clientes add column if not exists costura_qtd_3 numeric default 0;
alter table clientes add column if not exists costura_qtd_4 numeric default 0;
alter table clientes add column if not exists costura_qtd_5 numeric default 0;

select 'Colunas de quantidade de costura adicionadas!' as resultado;
