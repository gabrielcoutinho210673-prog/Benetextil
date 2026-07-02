-- BENETEXTIL — Adicionar campos de peças 2 a 5 na tabela clientes
alter table clientes add column if not exists peca2_tipo          text default '';
alter table clientes add column if not exists peca2_qtd           text default '';
alter table clientes add column if not exists peca2_tamanhos      text default '';
alter table clientes add column if not exists peca2_cores         text default '';
alter table clientes add column if not exists peca2_tecido        text default '';
alter table clientes add column if not exists peca2_tecido_valor  numeric default 0;
alter table clientes add column if not exists peca2_estampa       text default '';
alter table clientes add column if not exists peca2_obs           text default '';

alter table clientes add column if not exists peca3_tipo          text default '';
alter table clientes add column if not exists peca3_qtd           text default '';
alter table clientes add column if not exists peca3_tamanhos      text default '';
alter table clientes add column if not exists peca3_cores         text default '';
alter table clientes add column if not exists peca3_tecido        text default '';
alter table clientes add column if not exists peca3_tecido_valor  numeric default 0;
alter table clientes add column if not exists peca3_estampa       text default '';
alter table clientes add column if not exists peca3_obs           text default '';

alter table clientes add column if not exists peca4_tipo          text default '';
alter table clientes add column if not exists peca4_qtd           text default '';
alter table clientes add column if not exists peca4_tamanhos      text default '';
alter table clientes add column if not exists peca4_cores         text default '';
alter table clientes add column if not exists peca4_tecido        text default '';
alter table clientes add column if not exists peca4_tecido_valor  numeric default 0;
alter table clientes add column if not exists peca4_estampa       text default '';
alter table clientes add column if not exists peca4_obs           text default '';

alter table clientes add column if not exists peca5_tipo          text default '';
alter table clientes add column if not exists peca5_qtd           text default '';
alter table clientes add column if not exists peca5_tamanhos      text default '';
alter table clientes add column if not exists peca5_cores         text default '';
alter table clientes add column if not exists peca5_tecido        text default '';
alter table clientes add column if not exists peca5_tecido_valor  numeric default 0;
alter table clientes add column if not exists peca5_estampa       text default '';
alter table clientes add column if not exists peca5_obs           text default '';

select 'Colunas de pecas multiplas adicionadas!' as resultado;
