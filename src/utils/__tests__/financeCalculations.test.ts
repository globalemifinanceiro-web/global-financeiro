import {
  agruparPorCategoria,
  agruparPorProjeto,
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
