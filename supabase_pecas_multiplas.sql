-- BENETEXTIL — Adicionar campos de peças 2 a 5 na tabela clientes
alter table clientes add column if not exists peca2_tipo     text default '';
alter table clientes add column if not exists peca2_qtd      text default '';
alter table clientes add column if not exists peca2_tamanhos text default '';
alter table clientes add column if not exists peca2_cores    text default '';

alter table clientes add column if not exists peca3_tipo     text default '';
alter table clientes add column if not exists peca3_qtd      text default '';
alter table clientes add column if not exists peca3_tamanhos text default '';
alter table clientes add column if not exists peca3_cores    text default '';

alter table clientes add column if not exists peca4_tipo     text default '';
alter table clientes add column if not exists peca4_qtd      text default '';
alter table clientes add column if not exists peca4_tamanhos text default '';
alter table clientes add column if not exists peca4_cores    text default '';

alter table clientes add column if not exists peca5_tipo     text default '';
alter table clientes add column if not exists peca5_qtd      text default '';
alter table clientes add column if not exists peca5_tamanhos text default '';
alter table clientes add column if not exists peca5_cores    text default '';

select 'Colunas de pecas multiplas adicionadas!' as resultado;
