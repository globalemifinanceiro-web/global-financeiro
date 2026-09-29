-- Notas Fiscais: controle de prazos de pagamento com anexo do documento.
-- Rode este script inteiro no SQL Editor do Supabase do projeto Global Financeiro.

create extension if not exists pgcrypto;

create table if not exists public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  cliente_ou_fornecedor text not null,
  numero_documento text,
  valor numeric(14,2) not null check (valor > 0),
  vencimento date not null,
  situacao text not null default 'pendente' check (situacao in ('pendente', 'paga', 'cancelada')),
  arquivo_path text,
  arquivo_nome text,
  observacoes text,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notas_fiscais_vencimento_idx on public.notas_fiscais (vencimento) where situacao = 'pendente';
create index if not exists notas_fiscais_empresa_idx on public.notas_fiscais (empresa);

alter table public.notas_fiscais enable row level security;

-- Hoje existe uma única conta compartilhada (ver README do app) — qualquer usuário autenticado
-- pode ler/gravar. Quando existirem múltiplas contas/perfis, trocar por regras por perfil.
drop policy if exists "notas_fiscais_select" on public.notas_fiscais;
create policy "notas_fiscais_select" on public.notas_fiscais for select to authenticated using (true);

drop policy if exists "notas_fiscais_insert" on public.notas_fiscais;
create policy "notas_fiscais_insert" on public.notas_fiscais for insert to authenticated with check (true);

drop policy if exists "notas_fiscais_update" on public.notas_fiscais;
create policy "notas_fiscais_update" on public.notas_fiscais for update to authenticated using (true);

drop policy if exists "notas_fiscais_delete" on public.notas_fiscais;
create policy "notas_fiscais_delete" on public.notas_fiscais for delete to authenticated using (true);

-- Bucket privado para os arquivos anexados (PDF/imagem/doc). O acesso só acontece via URL
-- assinada de curta duração gerada pelo app — nunca público.
insert into storage.buckets (id, name, public)
values ('notas-fiscais', 'notas-fiscais', false)
on conflict (id) do nothing;

drop policy if exists "notas_fiscais_storage_insert" on storage.objects;
create policy "notas_fiscais_storage_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'notas-fiscais');

drop policy if exists "notas_fiscais_storage_select" on storage.objects;
create policy "notas_fiscais_storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'notas-fiscais');

drop policy if exists "notas_fiscais_storage_delete" on storage.objects;
create policy "notas_fiscais_storage_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'notas-fiscais');
