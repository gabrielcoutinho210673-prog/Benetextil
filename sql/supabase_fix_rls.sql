-- BENETEXTIL — Corrigir RLS em todas as tabelas
-- Cole no SQL Editor do Supabase e clique em RUN

-- ── Ativa RLS em todas as tabelas ──────────────────────────────
alter table if exists clientes       enable row level security;
alter table if exists sublimacao     enable row level security;
alter table if exists produtos       enable row level security;
alter table if exists compras        enable row level security;
alter table if exists contas_pagar   enable row level security;
alter table if exists contas_receber enable row level security;
alter table if exists clientes_cad   enable row level security;
alter table if exists perfis         enable row level security;
alter table if exists contas_casa    enable row level security;
alter table if exists kardex         enable row level security;
alter table if exists vendas         enable row level security;
alter table if exists caixa          enable row level security;

-- ── Cria políticas para cada tabela (somente usuários autenticados) ──

do $$
declare
  tbls text[] := ARRAY[
    'clientes','sublimacao','produtos','compras',
    'contas_pagar','contas_receber','clientes_cad',
    'contas_casa','kardex','vendas','caixa'
  ];
  t text;
  pol text;
begin
  foreach t in array tbls loop
    -- verifica se a tabela existe
    if exists (select 1 from information_schema.tables where table_schema='public' and table_name=t) then
      pol := 'Autenticados - ' || t;
      if not exists (
        select 1 from pg_policies where tablename=t and policyname=pol
      ) then
        execute format(
          'create policy %I on %I for all using (auth.role() = ''authenticated'')',
          pol, t
        );
      end if;
    end if;
  end loop;
end $$;

-- ── perfis: política especial (leitura própria) ─────────────────
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='perfis' and policyname='perfis - leitura própria'
  ) then
    execute 'create policy "perfis - leitura própria" on perfis for select using (auth.uid() = id)';
  end if;
end $$;

select 'RLS corrigido em todas as tabelas!' as resultado;
