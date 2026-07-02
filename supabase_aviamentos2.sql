-- BENETEXTIL — Adicionar novos aviamentos na tabela clientes
alter table clientes add column if not exists aviamento_entretela numeric default 0;
alter table clientes add column if not exists aviamento_cordao    numeric default 0;
alter table clientes add column if not exists aviamento_cadarco   numeric default 0;

select 'Colunas adicionadas com sucesso!' as resultado;
