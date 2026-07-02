-- BENETEXTIL — Adicionar novos aviamentos na tabela clientes
alter table clientes add column if not exists aviamento_composicao      numeric default 0;
alter table clientes add column if not exists aviamento_etiqueta        numeric default 0;
alter table clientes add column if not exists aviamento_velcro          numeric default 0;
alter table clientes add column if not exists aviamento_botao_pressao   numeric default 0;
alter table clientes add column if not exists aviamento_faixa_refletiva numeric default 0;
alter table clientes add column if not exists aviamento_tnt             numeric default 0;
alter table clientes add column if not exists aviamento_tinta           numeric default 0;
alter table clientes add column if not exists aviamento_tela            numeric default 0;

select 'Novos aviamentos adicionados!' as resultado;
