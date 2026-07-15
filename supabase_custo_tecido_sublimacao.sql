-- BENETEXTIL — Custo de compra do tecido na Sublimação
alter table sublimacao add column if not exists custo_tecido_metro numeric default 0;

select 'Coluna custo_tecido_metro adicionada!' as resultado;
