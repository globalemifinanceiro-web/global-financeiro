-- Permite desfazer uma importação de contas a pagar pelo app: apagar o registro da importação
-- apaga junto os lançamentos dela (on delete cascade em contas_pagar_planilhas.importacao_id).
-- Rode no SQL Editor do Supabase depois do 0007_solicitacoes_projetos.sql.

drop policy if exists "importacoes_contas_pagar_delete" on public.importacoes_contas_pagar;
create policy "importacoes_contas_pagar_delete" on public.importacoes_contas_pagar for delete to authenticated using (true);
