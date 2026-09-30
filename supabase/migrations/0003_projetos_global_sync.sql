-- Integração com o Projetos Global: campos para identificar notas sincronizadas de lá e permitir
-- que o Financeiro classifique cada uma na empresa certa (o Projetos Global não distingue empresa —
-- tudo chega junto, num "funil", e a separação por CNPJ só acontece aqui).
-- Rode no SQL Editor do Supabase depois do 0002_notas_fiscais_pagamento.sql.

alter table public.notas_fiscais
  alter column empresa drop not null;

alter table public.notas_fiscais
  add column if not exists origem text not null default 'manual' check (origem in ('manual', 'projetos_global')),
  add column if not exists projetos_global_request_id uuid,
  add column if not exists projetos_global_status text,
  add column if not exists projeto_pcg text,
  add column if not exists projeto_nome text;

create unique index if not exists notas_fiscais_pg_request_uq on public.notas_fiscais (projetos_global_request_id)
  where projetos_global_request_id is not null;

-- Fila de classificação: itens vindos do Projetos Global que ainda não têm empresa definida.
create index if not exists notas_fiscais_sem_empresa_idx on public.notas_fiscais (origem) where empresa is null;
