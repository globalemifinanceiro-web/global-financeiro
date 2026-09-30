import {
  agruparPorCategoria,
  agruparPorProjeto,
  aplicarFiltros,
  calcularFluxoCaixaMensal,
  calcularResumoFinanceiro,
  somarEmAberto,
  somarVencendoEm,
  somarVencidos,
} from '../financeCalculations';
import type { ContaFinanceira } from '@/types/finance';

const HOJE = new Date('2026-09-18T12:00:00');

function conta(overrides: Partial<ContaFinanceira>): ContaFinanceira {
  return {
    id: 'x',
    tipo: 'pagar',
    clienteOuFornecedor: 'Fornecedor Teste',
    projeto: 'Obra A',
    categoria: 'Material',
    departamento: 'Obras',
    contaCorrente: 'Banco 1',
    empresa: 'Global Engenharia',
    numeroDocumento: '1',
    vencimento: '2026-09-18',
    valorDocumento: 1000,
    valorLiquido: 1000,
    situacao: 'aberto',
    ...overrides,
  };
}

describe('somarEmAberto', () => {
  it('soma apenas títulos não liquidados', () => {
    const contas = [
      conta({ id: '1', valorLiquido: 100, situacao: 'aberto' }),
      conta({ id: '2', valorLiquido: 200, situacao: 'vencido' }),
      conta({ id: '3', valorLiquido: 300, situacao: 'liquidado' }),
    ];
    expect(somarEmAberto(contas)).toBe(300);
  });
});

describe('somarVencidos', () => {
  it('considera apenas vencimento anterior a hoje e não liquidado', () => {
    const contas = [
      conta({ id: '1', valorLiquido: 100, vencimento: '2026-09-10', situacao: 'vencido' }),
      conta({ id: '2', valorLiquido: 200, vencimento: '2026-09-18', situacao: 'aberto' }), // hoje, não é vencido
      conta({ id: '3', valorLiquido: 300, vencimento: '2026-09-01', situacao: 'liquidado' }), // já pago
    ];
    expect(somarVencidos(contas, HOJE)).toBe(100);
  });
});

describe('somarVencendoEm', () => {
  it('inclui hoje e o limite de dias, exclui liquidados e fora da janela', () => {
    const contas = [
      conta({ id: '1', valorLiquido: 100, vencimento: '2026-09-18' }), // hoje (delta 0)
      conta({ id: '2', valorLiquido: 200, vencimento: '2026-09-25' }), // delta 7
      conta({ id: '3', valorLiquido: 300, vencimento: '2026-09-26' }), // delta 8, fora
      conta({ id: '4', valorLiquido: 400, vencimento: '2026-09-20', situacao: 'liquidado' }), // já pago
      conta({ id: '5', valorLiquido: 500, vencimento: '2026-09-05' }), // já venceu, fora da janela futura
    ];
    expect(somarVencendoEm(contas, HOJE, 7)).toBe(300);
  });
});

describe('calcularResumoFinanceiro', () => {
  it('consolida saldo, vencidos e resultado previsto/realizado', () => {
    const contasPagar = [
      conta({ id: 'p1', valorLiquido: 1000, vencimento: '2026-09-10', situacao: 'vencido' }),
      conta({ id: 'p2', valorLiquido: 500, vencimento: '2026-09-18', situacao: 'liquidado' }),
    ];
    const contasReceber = [
      conta({ id: 'r1', tipo: 'receber', valorLiquido: 3000, vencimento: '2026-09-20', situacao: 'aberto' }),
      conta({ id: 'r2', tipo: 'receber', valorLiquido: 1500, vencimento: '2026-09-05', situacao: 'liquidado' }),
    ];

    const resumo = calcularResumoFinanceiro(contasPagar, contasReceber, HOJE, '2026-09-18T08:00:00Z');

    expect(resumo.totalAPagar).toBe(1000); // só o vencido, o liquidado não conta como "a pagar"
    expect(resumo.totalAReceber).toBe(3000);
    expect(resumo.saldoConsolidado).toBe(2000);
    expect(resumo.valoresVencidos).toBe(1000);
    expect(resumo.resultadoRealizado).toBe(1500 - 500); // recebido liquidado - pago liquidado
    expect(resumo.ultimaSincronizacao).toBe('2026-09-18T08:00:00Z');
  });
});

describe('aplicarFiltros — período', () => {
  const contas = [
    conta({ id: 'pago-2026', situacao: 'liquidado', vencimento: '2025-12-20', dataLiquidacao: '2026-01-05' }),
    conta({ id: 'pago-2025', situacao: 'liquidado', vencimento: '2025-11-10', dataLiquidacao: '2025-11-12' }),
    conta({ id: 'atrasado-2025', situacao: 'vencido', vencimento: '2025-12-01' }),
    conta({ id: 'aberto-marco', situacao: 'aberto', vencimento: '2026-03-15' }),
    conta({ id: 'aberto-2027', situacao: 'aberto', vencimento: '2027-01-10' }),
  ];
  const ids = (lista: typeof contas) => lista.map((c) => c.id);

  it('no ano todo: esconde histórico de anos anteriores, mas mantém atrasados em aberto', () => {
    expect(ids(aplicarFiltros(contas, {}))).toEqual(['pago-2026', 'atrasado-2025', 'aberto-marco']);
  });

  it('pago conta pela data do pagamento, pendente pelo vencimento', () => {
    expect(ids(aplicarFiltros(contas, { mes: 1 }))).toEqual(['pago-2026']);
    expect(ids(aplicarFiltros(contas, { mes: 3 }))).toEqual(['aberto-marco']);
  });
});

describe('calcularResumoFinanceiro — mês e médias', () => {
  it('usa o mês filtrado nos KPIs de mês e divide a média pelos meses decorridos', () => {
    const contasReceber = [
      conta({ id: 'r1', tipo: 'receber', valorLiquido: 900, situacao: 'liquidado', vencimento: '2026-02-01', dataLiquidacao: '2026-03-02' }),
      conta({ id: 'r2', tipo: 'receber', valorLiquido: 100, situacao: 'aberto', vencimento: '2026-03-20' }),
    ];
    const contasPagar = [conta({ id: 'p1', valorLiquido: 300, situacao: 'liquidado', vencimento: '2026-03-10', dataLiquidacao: '2026-03-10' })];

    const marco = calcularResumoFinanceiro(contasPagar, contasReceber, HOJE, 'x', 3);
    expect(marco.receitasDoMes).toBe(1000); // recebido em março (pela data do pagamento) + pendente de março
    expect(marco.despesasDoMes).toBe(300);
    expect(marco.mediaMensalEntradas).toBe(900);

    const anoTodo = calcularResumoFinanceiro(contasPagar, contasReceber, HOJE, 'x');
    expect(anoTodo.mediaMensalEntradas).toBe(100); // 900 em 9 meses (jan–set)
    expect(anoTodo.mediaMensalSaidas).toBe(300); // só março tem contas a pagar
  });

  it('média de saídas conta as pendentes pelo vencimento e divide só pelos meses com planilha', () => {
    const contasPagar = [
      conta({ id: 'p1', valorLiquido: 1000, situacao: 'aberto', vencimento: '2026-10-05' }),
      conta({ id: 'p2', valorLiquido: 500, situacao: 'aberto', vencimento: '2026-10-20' }),
      conta({ id: 'p3', valorLiquido: 300, situacao: 'aberto', vencimento: '2026-11-10' }),
      conta({ id: 'p4', valorLiquido: 9999, situacao: 'vencido', vencimento: '2025-12-01' }), // atrasada de 2025: fora da média de 2026
    ];
    const resumo = calcularResumoFinanceiro(contasPagar, [], HOJE, 'x');
    expect(resumo.mediaMensalSaidas).toBe(900); // (1500 + 300) / 2 meses
  });
});

describe('calcularFluxoCaixaMensal', () => {
  it('agrupa receitas e despesas por mês na ordem informada', () => {
    const contasPagar = [conta({ id: 'p1', valorLiquido: 400, vencimento: '2026-08-15' })];
    const contasReceber = [
      conta({ id: 'r1', tipo: 'receber', valorLiquido: 900, vencimento: '2026-08-20' }),
      conta({ id: 'r2', tipo: 'receber', valorLiquido: 200, vencimento: '2026-09-05' }),
    ];

    const fluxo = calcularFluxoCaixaMensal(contasPagar, contasReceber, ['2026-08-01', '2026-09-01']);

    expect(fluxo).toEqual([
      { mes: '2026-08-01', receitas: 900, despesas: 400, saldo: 500 },
      { mes: '2026-09-01', receitas: 200, despesas: 0, saldo: 200 },
    ]);
  });
});

describe('agruparPorCategoria', () => {
  it('soma por categoria e ordena do maior para o menor', () => {
    const contasPagar = [
      conta({ id: '1', categoria: 'Material', valorLiquido: 100 }),
      conta({ id: '2', categoria: 'Mão de obra', valorLiquido: 500 }),
      conta({ id: '3', categoria: 'Material', valorLiquido: 300 }),
    ];
    expect(agruparPorCategoria(contasPagar)).toEqual([
      { categoria: 'Mão de obra', valor: 500 },
      { categoria: 'Material', valor: 400 },
    ]);
  });
});

describe('agruparPorProjeto', () => {
  it('calcula resultado (receitas - despesas) por projeto', () => {
    const contasPagar = [conta({ id: 'p1', projeto: 'Obra A', valorLiquido: 200 })];
    const contasReceber = [
      conta({ id: 'r1', tipo: 'receber', projeto: 'Obra A', valorLiquido: 500 }),
      conta({ id: 'r2', tipo: 'receber', projeto: 'Obra B', valorLiquido: 100 }),
    ];
    const resultado = agruparPorProjeto(contasPagar, contasReceber);
    expect(resultado).toEqual([
      { projeto: 'Obra A', receitas: 500, despesas: 200, resultado: 300 },
      { projeto: 'Obra B', receitas: 100, despesas: 0, resultado: 100 },
    ]);
  });
});
