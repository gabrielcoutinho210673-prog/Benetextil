-- BENETEXTIL — Adicionar campos financeiros na tabela sublimacao
alter table sublimacao add column if not exists valor_venda numeric default 0;
alter table sublimacao add column if not exists mao_obra_anderson numeric default 0;

select 'Colunas adicionadas com sucesso!' as resultado;
