-- BENETEXTIL — Custos operacionais na tabela clientes (uniforme)
alter table clientes add column if not exists uber           numeric default 0;
alter table clientes add column if not exists almoco         numeric default 0;
alter table clientes add column if not exists gasolina       numeric default 0;
alter table clientes add column if not exists estacionamento numeric default 0;

select 'Colunas de custos operacionais adicionadas!' as resultado;
