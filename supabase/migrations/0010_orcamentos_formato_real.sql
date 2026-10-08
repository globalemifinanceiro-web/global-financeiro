-- Ajusta orcamentos_projetos ao formato real da rota /api/integracao/financeiro/orcamentos do Projetos
-- (situação aprovado/cancelado, validade, valores, condição de pagamento, itens, assinaturas) e guarda
-- uma cópia dos arquivos do orçamento no storage do Financeiro (os links do Projetos expiram em 1 hora).
-- Funciona tendo rodado ou não o 0009_orcamentos_projetos.sql. Rode no SQL Editor do Supabase.

create table if not exists public.orcamentos_projetos (
  id uuid primary key,
  aprovado_em timestamptz not null
);

alter table public.orcamentos_projetos
  add column if not exists codigo text,
  add column if not exists projeto_pcg text,
  add column if not exists projeto_cliente text,
  add column if not exists empresa text,
  add column if not exists fornecedor text,
  add column if not exists numero_documento text,
  add column if not exists emissao date,
  add column if not exists validade date,
  add column if not exists valor_bruto numeric(14,2),
  add column if not exists desconto numeric(14,2),
  add column if not exists valor numeric(14,2),
  add column if not exists condicao_pagamento text,
  add column if not exists descricao text,
  add column if not exists itens jsonb not null default '[]',
  add column if not exists enviado_por text,
  add column if not exists gestor_nome text,
  add column if not exists gestor_em timestamptz,
  add column if not exists diretoria_nome text,
  add column if not exists atualizado_em timestamptz not null default now(),
  add column if not exists arquivo_nome text,
  add column if not exists arquivo_sha256 text,
  add column if not exists arquivo_path text,
  add column if not exists assinado_nome text,
  add column if not exists assinado_sha256 text,
  add column if not exists assinado_path text,
  add column if not exists sincronizado_em timestamptz not null default now();

-- Campos do primeiro rascunho que a rota real não traz.
alter table public.orcamentos_projetos
  drop column if exists tipo_documento,
  drop column if exists vencimento,
  drop column if exists forma_pagamento,
  drop column if exists categoria,
  drop column if exists enviado_em;

create index if not exists orcamentos_projetos_aprovado_idx on public.orcamentos_projetos (aprovado_em desc);
create index if not exists orcamentos_projetos_atualizado_idx on public.orcamentos_projetos (atualizado_em desc);

alter table public.orcamentos_projetos enable row level security;

drop policy if exists "orcamentos_projetos_select" on public.orcamentos_projetos;
create policy "orcamentos_projetos_select" on public.orcamentos_projetos for select to authenticated using (true);
drop policy if exists "orcamentos_projetos_insert" on public.orcamentos_projetos;
create policy "orcamentos_projetos_insert" on public.orcamentos_projetos for insert to authenticated with check (true);
drop policy if exists "orcamentos_projetos_update" on public.orcamentos_projetos;
create policy "orcamentos_projetos_update" on public.orcamentos_projetos for update to authenticated using (true);
drop policy if exists "orcamentos_projetos_delete" on public.orcamentos_projetos;
create policy "orcamentos_projetos_delete" on public.orcamentos_projetos for delete to authenticated using (true);

-- Bucket privado com a cópia dos arquivos dos orçamentos (acesso só por URL assinada de curta duração).
insert into storage.buckets (id, name, public) values ('orcamentos', 'orcamentos', false) on conflict (id) do nothing;

drop policy if exists "orcamentos_storage_select" on storage.objects;
create policy "orcamentos_storage_select" on storage.objects for select to authenticated using (bucket_id = 'orcamentos');
drop policy if exists "orcamentos_storage_insert" on storage.objects;
create policy "orcamentos_storage_insert" on storage.objects for insert to authenticated with check (bucket_id = 'orcamentos');
drop policy if exists "orcamentos_storage_update" on storage.objects;
create policy "orcamentos_storage_update" on storage.objects for update to authenticated using (bucket_id = 'orcamentos');
drop policy if exists "orcamentos_storage_delete" on storage.objects;
create policy "orcamentos_storage_delete" on storage.objects for delete to authenticated using (bucket_id = 'orcamentos');
