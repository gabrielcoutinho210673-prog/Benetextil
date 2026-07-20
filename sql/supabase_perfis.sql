-- BENETEXTIL — Tabela de perfis/roles por usuário
create table if not exists perfis (
  id   uuid references auth.users(id) primary key,
  role text default 'admin'
);

alter table perfis enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename='perfis' and policyname='perfis - leitura própria'
  ) then
    execute 'create policy "perfis - leitura própria" on perfis for select using (auth.uid() = id)';
  end if;
end $$;

-- Define admin (claudia)
insert into perfis (id, role)
select id, 'admin' from auth.users where email = 'claudia@gmail.com'
on conflict (id) do update set role = 'admin';

-- Define operador (funcionario)
insert into perfis (id, role)
select id, 'operador' from auth.users where email = 'funcionario@gmail.com'
on conflict (id) do update set role = 'operador';

select email, p.role
from auth.users u
join perfis p on p.id = u.id;
