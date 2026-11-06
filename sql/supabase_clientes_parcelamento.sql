-- ============================================================
-- Condições de pagamento no pedido de Uniforme (tabela clientes),
-- usadas na Ordem de Fornecimento (PDF) enviada ao cliente:
--  - entrada_data           : data da entrada (vazio = data do pedido)
--  - parcelas_qtd           : saldo (total - entrada) dividido em N parcelas
--  - parcelas_primeiro_venc : vencimento da 1ª parcela (vazio = data de entrega)
--  - parcelas_intervalo     : dias entre uma parcela e outra (padrão 30)
-- RODAR ANTES de publicar o código novo, senão salvar pedido dá erro.
-- ============================================================
alter table clientes add column if not exists entrada_data date;
alter table clientes add column if not exists parcelas_qtd integer default 1;
alter table clientes add column if not exists parcelas_primeiro_venc date;
alter table clientes add column if not exists parcelas_intervalo integer default 30;

select 'Colunas de parcelamento adicionadas em clientes com sucesso!' as resultado;
