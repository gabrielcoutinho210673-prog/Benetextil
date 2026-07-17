-- BENETEXTIL — Caseado e Travete (Paulo)
alter table clientes add column if not exists caseado_qtd numeric default 0;
alter table clientes add column if not exists caseado_val numeric default 0;
alter table clientes add column if not exists travete_qtd numeric default 0;
alter table clientes add column if not exists travete_val numeric default 0;

select 'Colunas caseado e travete adicionadas!' as resultado;
