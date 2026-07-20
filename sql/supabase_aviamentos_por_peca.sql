-- BENETEXTIL — Aviamentos por peça (JSON por produto)
-- Cole no SQL Editor do Supabase e clique em RUN
alter table clientes add column if not exists peca1_aviamentos jsonb default '{}';
alter table clientes add column if not exists peca2_aviamentos jsonb default '{}';
alter table clientes add column if not exists peca3_aviamentos jsonb default '{}';
alter table clientes add column if not exists peca4_aviamentos jsonb default '{}';
alter table clientes add column if not exists peca5_aviamentos jsonb default '{}';

select 'Colunas de aviamentos por peça adicionadas!' as resultado;
