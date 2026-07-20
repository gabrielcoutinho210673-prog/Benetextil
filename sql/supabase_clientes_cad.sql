-- ============================================================
-- BENETEXTIL — Criar tabela de clientes cadastrados
-- Cole no SQL Editor do Supabase e clique em RUN
-- ============================================================

create table if not exists clientes_cad (
  id          bigserial primary key,
  nome        text not null,
  cnpj        text,
  telefone    text,
  email       text,
  contato     text,
  endereco    text,
  cidade      text,
  estado      text,
  observacoes text,
  ativo       integer default 1,
  created_at  timestamptz default now()
);

-- Liberar acesso para usuários autenticados
alter table clientes_cad enable row level security;
create policy "Autenticados - clientes_cad" on clientes_cad for all using (auth.role() = 'authenticated');

select 'Tabela clientes_cad criada com sucesso!' as resultado;
