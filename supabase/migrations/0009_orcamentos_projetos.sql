-- Espelho dos orçamentos/propostas aprovados pela Diretoria no Projetos Global (aba "Orçamentos" e aviso
-- de orçamento aprovado). Alimentada pela Edge Function sync-orcamentos-projetos, que reconcilia a cada
-- sincronização: orçamento que deixou de estar aprovado lá (desfeito/reprovado) sai daqui.
-- Rode no SQL Editor do Supabase depois do 0008_desfazer_importacao.sql.

create table if not exists public.orcamentos_projetos (
  id uuid primary key,
  codigo text,
  projeto_pcg text,
  projeto_cliente text,
  empresa text,
  fornecedor text,
  tipo_documento text,
  numero_documento text,
  emissao date,
  vencimento date,
  valor numeric(14,2),
  forma_pagamento text,
  categoria text,
  descricao text,
  enviado_por text,
  enviado_em timestamptz,
  gestor_nome text,
  gestor_em timestamptz,
  diretoria_nome text,
  aprovado_em timestamptz not null,
  sincronizado_em timestamptz not null default now()
);

create index if not exists orcamentos_projetos_aprovado_idx on public.orcamentos_projetos (aprovado_em desc);

alter table public.orcamentos_projetos enable row level security;

drop policy if exists "orcamentos_projetos_select" on public.orcamentos_projetos;
create policy "orcamentos_projetos_select" on public.orcamentos_projetos for select to authenticated using (true);
drop policy if exists "orcamentos_projetos_insert" on public.orcamentos_projetos;
create policy "orcamentos_projetos_insert" on public.orcamentos_projetos for insert to authenticated with check (true);
drop policy if exists "orcamentos_projetos_update" on public.orcamentos_projetos;
create policy "orcamentos_projetos_update" on public.orcamentos_projetos for update to authenticated using (true);
drop policy if exists "orcamentos_projetos_delete" on public.orcamentos_projetos;
create policy "orcamentos_projetos_delete" on public.orcamentos_projetos for delete to authenticated using (true);
