-- ============================================================
-- BENETEXTIL — Ativar segurança real (RLS + Auth)
-- Cole no SQL Editor do Supabase e clique em RUN
-- ============================================================

-- 1. Ativar RLS em todas as tabelas
alter table clientes        enable row level security;
alter table sublimacao      enable row level security;
alter table produtos        enable row level security;
alter table contas_pagar    enable row level security;
alter table contas_receber  enable row level security;
alter table vendas          enable row level security;
alter table itens_venda     enable row level security;
alter table caixa           enable row level security;
alter table mov_caixa       enable row level security;
alter table kardex          enable row level security;

-- 2. Criar políticas: apenas usuários autenticados podem acessar
create policy "Autenticados - clientes"       on clientes       for all using (auth.role() = 'authenticated');
create policy "Autenticados - sublimacao"     on sublimacao     for all using (auth.role() = 'authenticated');
create policy "Autenticados - produtos"       on produtos       for all using (auth.role() = 'authenticated');
create policy "Autenticados - contas_pagar"   on contas_pagar   for all using (auth.role() = 'authenticated');
create policy "Autenticados - contas_receber" on contas_receber for all using (auth.role() = 'authenticated');
create policy "Autenticados - vendas"         on vendas         for all using (auth.role() = 'authenticated');
create policy "Autenticados - itens_venda"    on itens_venda    for all using (auth.role() = 'authenticated');
create policy "Autenticados - caixa"          on caixa          for all using (auth.role() = 'authenticated');
create policy "Autenticados - mov_caixa"      on mov_caixa      for all using (auth.role() = 'authenticated');
create policy "Autenticados - kardex"         on kardex         for all using (auth.role() = 'authenticated');

-- Confirmar
select 'Segurança ativada com sucesso!' as resultado;
