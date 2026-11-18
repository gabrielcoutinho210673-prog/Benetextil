-- ============================================================
-- Sublimação passa a aceitar até 10 sublimações no mesmo pedido.
--  - A 1ª sublimação continua nas colunas de sempre (descricao, tecido,
--    cod_cor, qtd_metro, valor_metro, compra_tecido_metros...).
--  - Da 2ª em diante ficam em itens_extra (lista em JSON).
--  - compra_tecido_total e valor_venda passam a ser a soma de todas.
-- RODAR ANTES de publicar o código novo, senão salvar sublimação dá erro.
-- ============================================================
alter table sublimacao add column if not exists itens_extra jsonb default '[]';

select 'Coluna itens_extra adicionada em sublimacao com sucesso!' as resultado;
