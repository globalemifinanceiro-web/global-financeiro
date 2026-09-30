-- Contas a Pagar: importadas de uma planilha mensal por CNPJ (arrastada/escolhida no app).
-- Tudo aqui é só visual (dashboard da diretoria) — nenhum pagamento é disparado a partir daqui.
-- Rode no SQL Editor do Supabase depois do 0005_conciliacoes.sql.

create table if not exists public.importacoes_contas_pagar (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  arquivo_nome text not null,
  linhas integer not null,
  meses text[] not null,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.contas_pagar_planilhas (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid not null references public.importacoes_contas_pagar(id) on delete cascade,
  empresa text not null,
  fornecedor text not null,
  projeto text,
  categoria text,
  departamento text,
  numero_documento text,
  vencimento date not null,
  valor numeric(14,2) not null check (valor >= 0),
  situacao text not null check (situacao in ('pendente', 'paga', 'cancelada')),
  dt_pagamento date,
  observacao text
);

create index if not exists contas_pagar_planilhas_empresa_venc_idx on public.contas_pagar_planilhas (empresa, vencimento);
create index if not exists importacoes_contas_pagar_empresa_idx on public.importacoes_contas_pagar (empresa, created_at desc);

alter table public.importacoes_contas_pagar enable row level security;
alter table public.contas_pagar_planilhas enable row level security;

drop policy if exists "importacoes_contas_pagar_select" on public.importacoes_contas_pagar;
create policy "importacoes_contas_pagar_select" on public.importacoes_contas_pagar for select to authenticated using (true);
drop policy if exists "importacoes_contas_pagar_insert" on public.importacoes_contas_pagar;
create policy "importacoes_contas_pagar_insert" on public.importacoes_contas_pagar for insert to authenticated with check (true);

drop policy if exists "contas_pagar_planilhas_select" on public.contas_pagar_planilhas;
create policy "contas_pagar_planilhas_select" on public.contas_pagar_planilhas for select to authenticated using (true);
drop policy if exists "contas_pagar_planilhas_insert" on public.contas_pagar_planilhas;
create policy "contas_pagar_planilhas_insert" on public.contas_pagar_planilhas for insert to authenticated with check (true);
drop policy if exists "contas_pagar_planilhas_delete" on public.contas_pagar_planilhas;
create policy "contas_pagar_planilhas_delete" on public.contas_pagar_planilhas for delete to authenticated using (true);

-- Substitui, numa única transação, os lançamentos da empresa nos meses (AAAA-MM de vencimento)
-- presentes no arquivo — funciona tanto para planilha só do mês quanto para a do ano inteiro.
create or replace function public.importar_contas_pagar(p_empresa text, p_arquivo text, p_meses text[], p_linhas jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Não autenticado' using errcode = '42501'; end if;

  delete from public.contas_pagar_planilhas
   where empresa = p_empresa and to_char(vencimento, 'YYYY-MM') = any(p_meses);

  insert into public.importacoes_contas_pagar (empresa, arquivo_nome, linhas, meses, criado_por)
  values (p_empresa, p_arquivo, jsonb_array_length(p_linhas), p_meses, auth.uid())
  returning id into v_id;

  insert into public.contas_pagar_planilhas
    (importacao_id, empresa, fornecedor, projeto, categoria, departamento, numero_documento, vencimento, valor, situacao, dt_pagamento, observacao)
  select v_id, p_empresa, l.fornecedor, l.projeto, l.categoria, l.departamento, l.numero_documento, l.vencimento, l.valor, l.situacao, l.dt_pagamento, l.observacao
    from jsonb_to_recordset(p_linhas) as l(
      fornecedor text, projeto text, categoria text, departamento text, numero_documento text,
      vencimento date, valor numeric, situacao text, dt_pagamento date, observacao text);

  return v_id;
end;
$$;

grant execute on function public.importar_contas_pagar(text, text, text[], jsonb) to authenticated;
