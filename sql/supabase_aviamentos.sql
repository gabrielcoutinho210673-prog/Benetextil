-- ============================================================
-- BENETEXTIL — Adicionar colunas de aviamentos na tabela clientes
-- Cole no SQL Editor do Supabase e clique em RUN
-- ============================================================

alter table clientes add column if not exists aviamento_botao    numeric default 0;
alter table clientes add column if not exists aviamento_ziper    numeric default 0;
alter table clientes add column if not exists aviamento_elastico numeric default 0;
alter table clientes add column if not exists aviamento_ilhos    numeric default 0;

select 'Colunas de aviamentos adicionadas com sucesso!' as resultado;
