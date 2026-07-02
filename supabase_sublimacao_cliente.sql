-- BENETEXTIL — Adicionar campos de cliente na tabela sublimacao
alter table sublimacao add column if not exists nome_cliente     text default '';
alter table sublimacao add column if not exists telefone_cliente text default '';
alter table sublimacao add column if not exists data_pedido      date;
alter table sublimacao add column if not exists endereco_cliente text default '';

select 'Colunas de cliente adicionadas na sublimacao!' as resultado;
