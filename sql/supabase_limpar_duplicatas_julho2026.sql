-- BENETEXTIL — Limpeza das duplicatas pendentes (Transripoli e Bravos)
-- Só apaga linhas PENDENTES (nunca foram pagas de verdade) — as pagas ficam intactas.
-- Rode o SELECT primeiro pra conferir o que vai ser apagado antes do DELETE.

-- 1) Conferir o que será apagado
select id, descricao, fornecedor, valor, vencimento, status
from contas_pagar
where status = 'pendente'
  and (
    (descricao ilike '%TRANSRIPOLI%' and descricao ilike 'Tecido%' and valor = 246.00)
    or (descricao ilike '%TRANSRIPOLI%' and descricao ilike 'Aviamentos%' and valor = 16.40)
    or (descricao ilike '%BRAVOS%' and descricao ilike 'Tecido%' and valor = 29.80)
    or (descricao ilike '%BRAVOS%' and descricao ilike 'Aviamentos%' and valor = 35.20)
    or (descricao ilike '%BRAVOS%' and descricao ilike 'Uber%' and valor = 18.00)
  );

-- 2) Se a lista acima mostrar exatamente as 5 linhas esperadas (e nenhuma outra),
--    descomente e rode o DELETE abaixo (remova os "--" do início de cada linha)

-- delete from contas_pagar
-- where status = 'pendente'
--   and (
--     (descricao ilike '%TRANSRIPOLI%' and descricao ilike 'Tecido%' and valor = 246.00)
--     or (descricao ilike '%TRANSRIPOLI%' and descricao ilike 'Aviamentos%' and valor = 16.40)
--     or (descricao ilike '%BRAVOS%' and descricao ilike 'Tecido%' and valor = 29.80)
--     or (descricao ilike '%BRAVOS%' and descricao ilike 'Aviamentos%' and valor = 35.20)
--     or (descricao ilike '%BRAVOS%' and descricao ilike 'Uber%' and valor = 18.00)
--   );

select 'Confira o resultado do SELECT acima antes de rodar o DELETE!' as aviso;
