import type { AlertaFinanceiro, ContaFinanceira, OpcoesFiltro } from '@/types/finance';
import { createSeededRandom, pickFrom, randomFloat, randomInt } from './seededRandom';

/**
 * Todos os nomes abaixo são fictícios, criados só para preencher o modo de demonstração.
 * Nenhum dado real de cliente, fornecedor ou obra da Global Engenharia é usado aqui.
 *
 * As duas empresas (CNPJs) têm projetos, clientes, fornecedores e contas correntes próprios —
 * só categorias e departamentos são compartilhados entre elas (classificação contábil comum).
 * O CNPJ de cada uma ainda não foi informado; por enquanto só o nome é exibido no app.
 */
export const EMPRESAS_DEMO = ['Global Engenharia', 'Global Montagem'] as const;
type EmpresaDemo = (typeof EMPRESAS_DEMO)[number];

const PROJETOS_POR_EMPRESA: Record<EmpresaDemo, string[]> = {
  'Global Engenharia': ['Obra Residencial Jardins', 'Obra Comercial Centro', 'Condomínio Vista Verde', 'Rodovia BR-101 - Trecho 4'],
  'Global Montagem': ['Reforma Galpão Industrial', 'Ampliação Fábrica Norte', 'Obra Hospital Regional', 'Reforma Escola Municipal'],
};

const CLIENTES_POR_EMPRESA: Record<EmpresaDemo, string[]> = {
  'Global Engenharia': ['Incorporadora Horizonte S.A.', 'Prefeitura Municipal (Contrato Público)', 'Condomínio Vista Verde'],
  'Global Montagem': ['Shopping Nova Era', 'Indústria Beta S.A.', 'Hospital Regional Fundação Saúde'],
};

const FORNECEDORES_POR_EMPRESA: Record<EmpresaDemo, string[]> = {
  'Global Engenharia': ['Construtora Alfa Ltda', 'Materiais Gama Distribuidora', 'Concreto Prime Ltda', 'Ferragens União'],
  'Global Montagem': ['Fornecedora Delta Elétrica', 'Locadora Ômega Equipamentos', 'Transportes Sigma', 'Consultoria Vetor Engenharia'],
};

const CONTAS_CORRENTES_POR_EMPRESA: Record<EmpresaDemo, string[]> = {
  'Global Engenharia': ['Banco do Brasil - CC 12345-6', 'Bradesco - CC 5551-2'],
  'Global Montagem': ['Itaú - CC 98765-4', 'Santander - CC 4420-9'],
};

export const CATEGORIAS_DEMO = [
  'Material de Construção',
  'Mão de Obra',
  'Locação de Equipamentos',
  'Serviços Terceirizados',
  'Impostos e Taxas',
  'Combustível',
  'Manutenção',
  'Consultoria',
] as const;

export const DEPARTAMENTOS_DEMO = ['Obras', 'Administrativo', 'Engenharia', 'Compras', 'Financeiro', 'Comercial'] as const;

export interface DemoDataset {
  contasPagar: ContaFinanceira[];
  contasReceber: ContaFinanceira[];
  opcoesFiltro: OpcoesFiltro;
  alertas: AlertaFinanceiro[];
}

function isoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function gerarConta(
  random: () => number,
  tipo: 'pagar' | 'receber',
  index: number,
  hoje: Date
): ContaFinanceira {
  const empresa = pickFrom(random, EMPRESAS_DEMO);
  const vencimentoOffset = randomInt(random, -75, 45);
  const vencimento = addDays(hoje, vencimentoOffset);

  // Distribuição: ~45% já liquidado, ~15% vencido em aberto, resto em aberto (passado ou futuro).
  const roll = random();
  let situacao: ContaFinanceira['situacao'];
  let dataLiquidacao: string | undefined;
  if (roll < 0.45) {
    situacao = 'liquidado';
    const atrasoLiquidacao = randomInt(random, 0, 5);
    dataLiquidacao = isoDateOnly(addDays(vencimento, atrasoLiquidacao));
  } else if (vencimentoOffset < 0) {
    situacao = 'vencido';
  } else {
    situacao = 'aberto';
  }

  const valorLiquido = randomFloat(random, 800, 65000, 2);
  const entidade =
    tipo === 'pagar' ? pickFrom(random, FORNECEDORES_POR_EMPRESA[empresa]) : pickFrom(random, CLIENTES_POR_EMPRESA[empresa]);

  return {
    id: `${tipo}-${index}`,
    tipo,
    clienteOuFornecedor: entidade,
    projeto: pickFrom(random, PROJETOS_POR_EMPRESA[empresa]),
    categoria: pickFrom(random, CATEGORIAS_DEMO),
    departamento: pickFrom(random, DEPARTAMENTOS_DEMO),
    contaCorrente: pickFrom(random, CONTAS_CORRENTES_POR_EMPRESA[empresa]),
    empresa,
    numeroDocumento: String(100000 + index),
    vencimento: isoDateOnly(vencimento),
    dataLiquidacao,
    valorDocumento: valorLiquido,
    valorLiquido,
    situacao,
  };
}

function gerarAlertas(contasPagar: ContaFinanceira[], contasReceber: ContaFinanceira[]): AlertaFinanceiro[] {
  const vencidosPagar = contasPagar.filter((c) => c.situacao === 'vencido');
  const vencidosReceber = contasReceber.filter((c) => c.situacao === 'vencido');

  const alertas: AlertaFinanceiro[] = [];

  if (vencidosPagar.length > 0) {
    alertas.push({
      id: 'alerta-vencidos-pagar',
      titulo: `${vencidosPagar.length} título(s) a pagar vencido(s)`,
      descricao: 'Existem contas a pagar em atraso que precisam de atenção imediata.',
      severidade: 'critico',
      data: new Date().toISOString(),
    });
  }

  if (vencidosReceber.length > 0) {
    alertas.push({
      id: 'alerta-vencidos-receber',
      titulo: `${vencidosReceber.length} título(s) a receber vencido(s)`,
      descricao: 'Existem recebimentos em atraso que podem impactar o fluxo de caixa.',
      severidade: 'atencao',
      data: new Date().toISOString(),
    });
  }

  alertas.push({
    id: 'alerta-modo-demo',
    titulo: 'Ambiente em modo de demonstração',
    descricao: 'Os valores exibidos são fictícios e não representam dados reais da Omie ou do Google Sheets.',
    severidade: 'info',
    data: new Date().toISOString(),
  });

  return alertas;
}

function opcoesParaEmpresa(empresa?: string): OpcoesFiltro {
  const empresas = [...EMPRESAS_DEMO];
  const chaves = empresa && (empresas as string[]).includes(empresa) ? [empresa as EmpresaDemo] : empresas;

  const unico = (listas: string[][]) => Array.from(new Set(listas.flat()));

  return {
    empresas,
    projetos: unico(chaves.map((e) => PROJETOS_POR_EMPRESA[e])),
    clientes: unico(chaves.map((e) => CLIENTES_POR_EMPRESA[e])),
    fornecedores: unico(chaves.map((e) => FORNECEDORES_POR_EMPRESA[e])),
    categorias: [...CATEGORIAS_DEMO],
    departamentos: [...DEPARTAMENTOS_DEMO],
    contasCorrentes: unico(chaves.map((e) => CONTAS_CORRENTES_POR_EMPRESA[e])),
  };
}

let cachedContas: { contasPagar: ContaFinanceira[]; contasReceber: ContaFinanceira[]; alertas: AlertaFinanceiro[] } | null = null;

function gerarContas() {
  if (cachedContas) return cachedContas;

  const random = createSeededRandom(42);
  const hoje = new Date();

  const contasPagar = Array.from({ length: 70 }, (_, index) => gerarConta(random, 'pagar', index, hoje));
  const contasReceber = Array.from({ length: 55 }, (_, index) => gerarConta(random, 'receber', index, hoje));

  cachedContas = { contasPagar, contasReceber, alertas: gerarAlertas(contasPagar, contasReceber) };
  return cachedContas;
}

/** Gera (uma única vez por sessão) o conjunto de dados fictícios usado no modo de demonstração. */
export function getDemoDataset(empresa?: string): DemoDataset {
  const { contasPagar, contasReceber, alertas } = gerarContas();
  return { contasPagar, contasReceber, alertas, opcoesFiltro: opcoesParaEmpresa(empresa) };
}
