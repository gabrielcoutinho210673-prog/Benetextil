-- BENETEXTIL — Compra do tecido na Sublimação
alter table sublimacao add column if not exists compra_tecido_metros      numeric default 0;
alter table sublimacao add column if not exists compra_tecido_valor_metro  numeric default 0;
alter table sublimacao add column if not exists compra_tecido_total        numeric default 0;

select 'Colunas compra_tecido adicionadas!' as resultado;
