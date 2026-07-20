-- BENETEXTIL — Quantidade de tecido por peça
alter table clientes add column if not exists tecido_qtd      numeric default 0;
alter table clientes add column if not exists peca2_tecido_qtd numeric default 0;
alter table clientes add column if not exists peca3_tecido_qtd numeric default 0;
alter table clientes add column if not exists peca4_tecido_qtd numeric default 0;
alter table clientes add column if not exists peca5_tecido_qtd numeric default 0;

select 'Colunas tecido_qtd adicionadas!' as resultado;
