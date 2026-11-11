-- ============================================================
-- Pedido de Uniforme passa de 5 para até 10 peças (ex: camiseta
-- cinza P-GG, camiseta cinza EXG, camiseta preta, calça...).
-- Cria para as peças 6 a 10 as mesmas colunas que as peças 2 a 5 já usam.
-- RODAR ANTES de publicar o código novo, senão salvar pedido dá erro.
-- ============================================================
alter table clientes add column if not exists peca6_tipo         text default '';
alter table clientes add column if not exists peca6_qtd          text default '';
alter table clientes add column if not exists peca6_tamanhos     text default '';
alter table clientes add column if not exists peca6_cores        text default '';
alter table clientes add column if not exists peca6_tecido       text default '';
alter table clientes add column if not exists peca6_tecido_qtd   numeric default 0;
alter table clientes add column if not exists peca6_tecido_valor numeric default 0;
alter table clientes add column if not exists peca6_venda_valor  numeric default 0;
alter table clientes add column if not exists peca6_obs          text default '';
alter table clientes add column if not exists peca6_aviamentos   jsonb default '{}';

alter table clientes add column if not exists peca7_tipo         text default '';
alter table clientes add column if not exists peca7_qtd          text default '';
alter table clientes add column if not exists peca7_tamanhos     text default '';
alter table clientes add column if not exists peca7_cores        text default '';
alter table clientes add column if not exists peca7_tecido       text default '';
alter table clientes add column if not exists peca7_tecido_qtd   numeric default 0;
alter table clientes add column if not exists peca7_tecido_valor numeric default 0;
alter table clientes add column if not exists peca7_venda_valor  numeric default 0;
alter table clientes add column if not exists peca7_obs          text default '';
alter table clientes add column if not exists peca7_aviamentos   jsonb default '{}';

alter table clientes add column if not exists peca8_tipo         text default '';
alter table clientes add column if not exists peca8_qtd          text default '';
alter table clientes add column if not exists peca8_tamanhos     text default '';
alter table clientes add column if not exists peca8_cores        text default '';
alter table clientes add column if not exists peca8_tecido       text default '';
alter table clientes add column if not exists peca8_tecido_qtd   numeric default 0;
alter table clientes add column if not exists peca8_tecido_valor numeric default 0;
alter table clientes add column if not exists peca8_venda_valor  numeric default 0;
alter table clientes add column if not exists peca8_obs          text default '';
alter table clientes add column if not exists peca8_aviamentos   jsonb default '{}';

alter table clientes add column if not exists peca9_tipo         text default '';
alter table clientes add column if not exists peca9_qtd          text default '';
alter table clientes add column if not exists peca9_tamanhos     text default '';
alter table clientes add column if not exists peca9_cores        text default '';
alter table clientes add column if not exists peca9_tecido       text default '';
alter table clientes add column if not exists peca9_tecido_qtd   numeric default 0;
alter table clientes add column if not exists peca9_tecido_valor numeric default 0;
alter table clientes add column if not exists peca9_venda_valor  numeric default 0;
alter table clientes add column if not exists peca9_obs          text default '';
alter table clientes add column if not exists peca9_aviamentos   jsonb default '{}';

alter table clientes add column if not exists peca10_tipo         text default '';
alter table clientes add column if not exists peca10_qtd          text default '';
alter table clientes add column if not exists peca10_tamanhos     text default '';
alter table clientes add column if not exists peca10_cores        text default '';
alter table clientes add column if not exists peca10_tecido       text default '';
alter table clientes add column if not exists peca10_tecido_qtd   numeric default 0;
alter table clientes add column if not exists peca10_tecido_valor numeric default 0;
alter table clientes add column if not exists peca10_venda_valor  numeric default 0;
alter table clientes add column if not exists peca10_obs          text default '';
alter table clientes add column if not exists peca10_aviamentos   jsonb default '{}';

select 'Colunas das peças 6 a 10 adicionadas em clientes com sucesso!' as resultado;
