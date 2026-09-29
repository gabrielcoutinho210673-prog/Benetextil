-- ============================================================
-- Campo novo no módulo Compras da Empresa:
--  - valor_entrada : valor de entrada/sinal pago no ato da compra.
--    As parcelas em Contas a Pagar passam a ser calculadas sobre
--    (valor_total - valor_entrada), e não mais sobre o valor cheio.
-- ============================================================
alter table compras add column if not exists valor_entrada numeric default 0;

select 'Coluna valor_entrada adicionada em Compras com sucesso!' as resultado;
