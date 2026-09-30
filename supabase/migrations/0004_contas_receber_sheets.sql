-- Espelho local da aba "à Receber" da planilha do Google Sheets. Sincronizado por completo a cada
-- chamada da Edge Function sync-contas-receber (apaga tudo e recria), então não precisa de lógica
-- de reconciliação — a planilha é sempre a fonte da verdade.
-- Rode no SQL Editor do Supabase depois do 0003_projetos_global_sync.sql.

create table if not exists public.contas_receber_sheets (
  id uuid primary key default gen_random_uuid(),
  linha_planilha integer not null,
  empresa text,
  cliente text not null,
  numero_documento text,
  tipo_documento text,
  emissao date,
  vencimento date not null,
  valor numeric(14,2) not null check (valor >= 0),
  dt_pagamento date,
  situacao text not null check (situacao in ('pendente', 'paga', 'cancelada')),
  observacao text,
  sincronizado_em timestamptz not null default now()
);

create unique index if not exists contas_receber_sheets_linha_uq on public.contas_receber_sheets (linha_planilha);
create index if not exists contas_receber_sheets_empresa_idx on public.contas_receber_sheets (empresa);
create index if not exists contas_receber_sheets_situacao_idx on public.contas_receber_sheets (situacao);

alter table public.contas_receber_sheets enable row level security;

drop policy if exists "contas_receber_sheets_select" on public.contas_receber_sheets;
create policy "contas_receber_sheets_select" on public.contas_receber_sheets for select to authenticated using (true);

drop policy if exists "contas_receber_sheets_insert" on public.contas_receber_sheets;
create policy "contas_receber_sheets_insert" on public.contas_receber_sheets for insert to authenticated with check (true);

drop policy if exists "contas_receber_sheets_delete" on public.contas_receber_sheets;
create policy "contas_receber_sheets_delete" on public.contas_receber_sheets for delete to authenticated using (true);
