-- ============================================================
-- Corrige o campo "Entrada" dos pedidos de Uniforme (clientes) que
-- ficaram desatualizados: a Contas a Receber já está "pago", mas o
-- pedido continua achando que só recebeu uma entrada parcial (badge
-- "Parcial" errado na tela de Uniforme).
--
-- Motivo: marcar "recebido" em Contas a Receber não atualiza o campo
-- Entrada lá no pedido — são dois dados independentes. Esse script
-- sincroniza os dois pra quem já foi pago de verdade.
--
-- Rode o BLOCO 1 primeiro (só leitura) pra ver a lista antes de
-- aplicar o BLOCO 2 (que altera os dados).
-- ============================================================

-- BLOCO 1: diagnóstico (não altera nada)
select c.id, c.nome, c.tipo_peca, c.valor_total, c.entrada,
       r.descricao as lancamento_receber, r.status
from clientes c
join contas_receber r
  on r.descricao ~ ('#' || c.id || '$')
  and r.descricao like 'Venda:%'
where r.status = 'pago'
  and c.ativo = 1
  and coalesce(c.entrada, 0) < coalesce(c.valor_total, 0)
order by c.id;

-- BLOCO 2: aplica a correção (roda só depois de conferir o BLOCO 1)
update clientes c
set entrada = c.valor_total
from contas_receber r
where r.descricao ~ ('#' || c.id || '$')
  and r.descricao like 'Venda:%'
  and r.status = 'pago'
  and c.ativo = 1
  and coalesce(c.entrada, 0) < coalesce(c.valor_total, 0);

-- Confirmar
select 'Entradas sincronizadas com sucesso!' as resultado;
