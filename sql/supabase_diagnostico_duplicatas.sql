-- BENETEXTIL — Diagnóstico geral de duplicatas (SOMENTE LEITURA, não apaga nada)
-- Roda cada bloco e me manda o resultado (ou revisa você mesma) antes de apagar qualquer coisa.

-- ═══════════════════════════════════════════════════════
-- 1) CONTAS A PAGAR — duplicatas exatas
-- (mesma descrição + fornecedor + valor + vencimento, aparecendo mais de uma vez)
-- ═══════════════════════════════════════════════════════
select descricao, fornecedor, valor, vencimento, status,
       count(*) as quantas_vezes,
       array_agg(id order by id) as ids
from contas_pagar
where ativo = 1
group by descricao, fornecedor, valor, vencimento, status
having count(*) > 1
order by count(*) desc, vencimento desc;

-- ═══════════════════════════════════════════════════════
-- 2) CONTAS A RECEBER — duplicatas exatas
-- ═══════════════════════════════════════════════════════
select descricao, cliente, valor, vencimento, status,
       count(*) as quantas_vezes,
       array_agg(id order by id) as ids
from contas_receber
where ativo = 1
group by descricao, cliente, valor, vencimento, status
having count(*) > 1
order by count(*) desc, vencimento desc;

-- ═══════════════════════════════════════════════════════
-- 3) MESMA DESCRIÇÃO E FORNECEDOR, VALORES DIFERENTES, MESMO DIA
-- (pode indicar que um pedido foi editado e gerou entradas parecidas mas não idênticas)
-- ═══════════════════════════════════════════════════════
select descricao, fornecedor, vencimento,
       count(*) as quantos_lancamentos,
       array_agg(valor order by id) as valores,
       array_agg(status order by id) as status_de_cada,
       array_agg(id order by id) as ids
from contas_pagar
where ativo = 1
group by descricao, fornecedor, vencimento
having count(*) > 1
order by count(*) desc, vencimento desc;

-- ═══════════════════════════════════════════════════════
-- 4) PEDIDOS DE UNIFORME (clientes) duplicados
-- (mesmo nome + tipo de peça + valor total + data do pedido — pode ser clique duplo salvando 2x)
-- ═══════════════════════════════════════════════════════
select nome, tipo_peca, valor_total, data_pedido,
       count(*) as quantas_vezes,
       array_agg(id order by id) as ids
from clientes
where ativo = 1
group by nome, tipo_peca, valor_total, data_pedido
having count(*) > 1
order by count(*) desc;

-- ═══════════════════════════════════════════════════════
-- 5) SUBLIMAÇÃO duplicada
-- (mesmo cliente + tecido + cor + datas + valor de venda — pode ser clique duplo salvando 2x)
-- ═══════════════════════════════════════════════════════
select nome_cliente, tecido, cod_cor, data_pedido, data_entrega, valor_venda,
       count(*) as quantas_vezes,
       array_agg(id order by id) as ids
from sublimacao
where ativo = 1
group by nome_cliente, tecido, cod_cor, data_pedido, data_entrega, valor_venda
having count(*) > 1
order by count(*) desc;
