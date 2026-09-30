import { EMPRESAS } from '@/constants/empresas';
import type { FinanceDataSource } from '@/services/data/FinanceDataSource';
import { listarContasPagarPlanilhas } from '@/services/supabase/contasPagarPlanilhas';
import { listarContasReceberSheets } from '@/services/supabase/contasReceberSheets';
import { toLocalDate } from '@/utils/date';
import {
  agruparPorCategoria,
  agruparPorProjeto,
  aplicarFiltros,
  calcularFluxoCaixaMensal,
  calcularResumoFinanceiro,
} from '@/utils/financeCalculations';
import { mesesDoAno } from '@/utils/periodo';

// Contas a pagar vêm das planilhas mensais importadas no app; contas a receber, do Google Sheets.
function carregarAmbas() {
  return Promise.all([listarContasPagarPlanilhas(), listarContasReceberSheets()]);
}

export const realDataSource: FinanceDataSource = {
  modo: 'real',

  async getResumo(filtros) {
    const [contasPagar, contasReceber] = await carregarAmbas();
    return calcularResumoFinanceiro(
      aplicarFiltros(contasPagar, filtros),
      aplicarFiltros(contasReceber, filtros),
      new Date(),
      new Date().toISOString(),
      filtros.mes
    );
  },

  async getContasPagar(filtros) {
    return aplicarFiltros(await listarContasPagarPlanilhas(), filtros);
  },

  async getContasReceber(filtros) {
    return aplicarFiltros(await listarContasReceberSheets(), filtros);
  },

  async getFluxoCaixaMensal(filtros) {
    const [contasPagar, contasReceber] = await carregarAmbas();
    const anoTodo = { ...filtros, mes: undefined };
    return calcularFluxoCaixaMensal(aplicarFiltros(contasPagar, anoTodo), aplicarFiltros(contasReceber, anoTodo), mesesDoAno());
  },

  async getDespesasPorCategoria(filtros) {
    return agruparPorCategoria(aplicarFiltros(await listarContasPagarPlanilhas(), filtros));
  },

  async getResultadoPorProjeto(filtros) {
    const [contasPagar, contasReceber] = await carregarAmbas();
    return agruparPorProjeto(aplicarFiltros(contasPagar, filtros), aplicarFiltros(contasReceber, filtros));
  },

  async getProximosVencimentos(filtros) {
    const [contasPagar, contasReceber] = await carregarAmbas();
    const abertas = aplicarFiltros([...contasPagar, ...contasReceber], filtros).filter((conta) => conta.situacao === 'aberto');
    return abertas.sort((a, b) => toLocalDate(a.vencimento).getTime() - toLocalDate(b.vencimento).getTime()).slice(0, 10);
  },

  async getAlertas() {
    return [];
  },

  async getOpcoesFiltro(filtros) {
    const [contasPagar, contasReceber] = await carregarAmbas();
    const daEmpresa = (contas: typeof contasPagar) => (filtros.empresa ? contas.filter((c) => c.empresa === filtros.empresa) : contas);
    const pagar = daEmpresa(contasPagar);
    const receber = daEmpresa(contasReceber);
    const unico = (valores: string[]) => Array.from(new Set(valores)).filter(Boolean).sort();
    return {
      empresas: [...EMPRESAS],
      projetos: unico([...pagar, ...receber].map((c) => c.projeto)),
      clientes: unico(receber.map((c) => c.clienteOuFornecedor)),
      fornecedores: unico(pagar.map((c) => c.clienteOuFornecedor)),
      categorias: unico([...pagar, ...receber].map((c) => c.categoria)),
      departamentos: unico(pagar.map((c) => c.departamento)),
      contasCorrentes: [],
    };
  },
};
