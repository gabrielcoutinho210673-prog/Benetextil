-- BENETEXTIL — Construção (gastos da obra, separado da confecção)
create table if not exists construcao (
  id          bigserial primary key,
  descricao   text not null,
  categoria   text default '',
  fornecedor  text default '',
  valor       numeric default 0,
  vencimento  date,
  status      text default 'pendente', -- 'pago' ou 'pendente'
  observacao  text default '',
  ativo       integer default 1,
  created_at  timestamptz default now()
);

alter table construcao enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='construcao' and policyname='Autenticados - construcao'
  ) then
    execute 'create policy "Autenticados - construcao" on construcao for all using (auth.role() = ''authenticated'')';
  end if;
end $$;

select 'Tabela construcao criada com sucesso!' as resultado;
