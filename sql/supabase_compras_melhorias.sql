-- ============================================================
-- Campos novos no módulo Compras da Empresa:
--  - forma_pagamento : PIX / Cartão / Boleto / etc.
--  - comprovante_url : link da foto/PDF da nota
--  - produto_id / produto_qtd : vínculo com um produto do estoque
--    (quando preenchido na criação, dá entrada automática no Kardex)
-- ============================================================
alter table compras add column if not exists forma_pagamento text;
alter table compras add column if not exists comprovante_url text;
alter table compras add column if not exists produto_id bigint;
alter table compras add column if not exists produto_qtd numeric default 0;

select 'Colunas de Compras adicionadas com sucesso!' as resultado;
