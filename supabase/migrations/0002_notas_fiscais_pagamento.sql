-- Campos para a Central de Pagamentos (forma de pagamento e confirmação de assinatura).
-- Rode no SQL Editor do Supabase depois do 0001_notas_fiscais.sql.

alter table public.notas_fiscais
  add column if not exists forma_pagamento text,
  add column if not exists assinado boolean not null default false;
