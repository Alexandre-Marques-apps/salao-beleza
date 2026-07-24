-- Tabela de tokens de push (um device pode ser Admin, Profissional ou Cliente)
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  role text not null check (role in ('admin','profissional','cliente')),
  owner_id text,              -- id do profissional ou cliente dono do device (null para admin)
  created_at timestamptz default now()
);

-- Índice pra achar rápido os tokens de um cliente/profissional específico
create index if not exists idx_push_tokens_owner on push_tokens(role, owner_id);

-- RLS: cada device só grava seu próprio token (via API route com service role, então RLS fica travada por padrão)
alter table push_tokens enable row level security;
