-- Conciliação: cada comprovante de pagamento/recebimento anexado no app. O arquivo em si fica na
-- pasta "comprovantes" do Google Drive (gravado via Google Apps Script); aqui só os metadados,
-- o vínculo com o título e o resultado da baixa.
-- Rode no SQL Editor do Supabase depois do 0004_contas_receber_sheets.sql.

create table if not exists public.conciliacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('recebimento', 'pagamento')),
  empresa text,
  data_pagamento date not null,
  valor numeric(14,2) not null check (valor > 0),
  descricao text,
  arquivo_nome text not null,
  drive_file_id text not null,
  drive_url text not null,
  -- Vínculo com o título. contas_receber_sheets é recriada a cada sincronização (ids mudam), então
  -- o vínculo com conta a receber usa a linha da planilha + um retrato dos dados da época.
  conta_receber_linha integer,
  nota_fiscal_id uuid references public.notas_fiscais(id) on delete set null,
  titulo_descricao text,
  -- Resultado da baixa: sem_vinculo | ok (título marcado como pago) | pendente_origem (o título
  -- vem do Projetos Global e a baixa tem que ser feita lá) | erro (comprovante salvo, baixa falhou).
  baixa_status text not null default 'sem_vinculo' check (baixa_status in ('sem_vinculo', 'ok', 'pendente_origem', 'erro')),
  baixa_erro text,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists conciliacoes_data_idx on public.conciliacoes (data_pagamento desc);
create index if not exists conciliacoes_empresa_idx on public.conciliacoes (empresa);

alter table public.conciliacoes enable row level security;

drop policy if exists "conciliacoes_select" on public.conciliacoes;
create policy "conciliacoes_select" on public.conciliacoes for select to authenticated using (true);

drop policy if exists "conciliacoes_insert" on public.conciliacoes;
create policy "conciliacoes_insert" on public.conciliacoes for insert to authenticated with check (true);

drop policy if exists "conciliacoes_delete" on public.conciliacoes;
create policy "conciliacoes_delete" on public.conciliacoes for delete to authenticated using (true);

-- A baixa de uma conta a receber atualiza o espelho local na hora (sem esperar a próxima
-- sincronização), então a tabela precisa aceitar update.
drop policy if exists "contas_receber_sheets_update" on public.contas_receber_sheets;
create policy "contas_receber_sheets_update" on public.contas_receber_sheets for update to authenticated using (true);
