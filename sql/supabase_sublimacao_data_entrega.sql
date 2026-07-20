-- BENETEXTIL — Adicionar data de entrega na sublimação
alter table sublimacao add column if not exists data_entrega date;

select 'Coluna data_entrega adicionada na sublimacao!' as resultado;
