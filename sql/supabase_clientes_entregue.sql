-- ============================================================
-- Adiciona o campo "entregue" no pedido de Uniforme (clientes).
-- Sem esse campo, o sistema só sabia dizer "atrasado" comparando a
-- Data de Entrega com a data de hoje — um pedido já entregue e pago
-- continuava aparecendo em vermelho pra sempre. Agora dá pra marcar
-- como entregue e ele sai do "Em Atraso".
-- ============================================================
alter table clientes add column if not exists entregue integer default 0;

select 'Campo entregue adicionado com sucesso!' as resultado;
