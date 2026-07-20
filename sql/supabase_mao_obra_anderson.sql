-- BENETEXTIL — Mão de obra Anderson por metro quadrado
alter table sublimacao add column if not exists mao_obra_anderson_m2    numeric default 0;
alter table sublimacao add column if not exists mao_obra_anderson_valor numeric default 0;

select 'Colunas mao_obra_anderson_m2 e valor adicionadas!' as resultado;
