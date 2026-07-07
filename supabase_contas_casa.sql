-- BENETEXTIL — Contas da Casa (separado da confecção)
create table if not exists contas_casa (
  id          bigserial primary key,
  descricao   text not null,
  categoria   text default '',
  tipo        text default 'saida',   -- 'entrada' ou 'saida'
  valor       numeric default 0,
  data        date,
  status      text default 'pendente', -- 'pago' ou 'pendente'
  observacoes text default '',
  ativo       integer default 1,
  created_at  timestamptz default now()
);

alter table contas_casa enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='contas_casa' and policyname='Autenticados - contas_casa'
  ) then
    execute 'create policy "Autenticados - contas_casa" on contas_casa for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

select 'Tabela contas_casa criada com sucesso!' as resultado;
