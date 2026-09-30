import * as XLSX from 'xlsx';
import { lerPlanilhaContasPagar } from '../planilhaContasPagar';

function planilha(linhas: unknown[][]): ArrayBuffer {
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, XLSX.utils.aoa_to_sheet(linhas), 'Contas a Pagar');
  return XLSX.write(livro, { type: 'array', bookType: 'xlsx' });
}

describe('lerPlanilhaContasPagar', () => {
  it('lê o layout do export da Omie (título, cabeçalho, total) e classifica a situação', () => {
    const conteudo = planilha([
      ['Contas a Pagar 2026'],
      ['Razão Social', 'Projeto', 'Nota Fiscal', 'Categoria', 'Vencimento', 'Valor Líquido', 'Situação', 'Última Data de Pagto ou Recbto (completa)', 'Minha Empresa (CNPJ)'],
      [null, null, null, null, null, -3500, null, null, null], // linha de total
      ['Fornecedor A', 'Obra 1', '123', 'Material', '10/03/2026', -1000, 'A Pagar', null, '27.652.481/0001-76'],
      ['Fornecedor B', 'Obra 1', '124', 'Serviço', '15/03/2026', 'R$ 1.500,50', 'Pago', '14/03/2026', '27.652.481/0001-76'],
      ['Fornecedor C', null, null, null, '2026-04-01', -999.5, 'Cancelado', null, '27.652.481/0001-76'],
      ['Fornecedor D', null, null, null, '20/11/2025', -200, 'Pago', '21/11/2025', '27.652.481/0001-76'], // histórico de 2025: fora
      ['Fornecedor E', null, null, null, '05/12/2025', -300, 'Atrasado', null, '27.652.481/0001-76'], // em aberto de 2025: fica
    ]);

    const leitura = lerPlanilhaContasPagar(conteudo);

    expect(leitura.linhas.map((l) => [l.fornecedor, l.situacao, l.valor])).toEqual([
      ['Fornecedor A', 'pendente', 1000],
      ['Fornecedor B', 'paga', 1500.5],
      ['Fornecedor C', 'cancelada', 999.5],
      ['Fornecedor E', 'pendente', 300],
    ]);
    expect(leitura.linhas[0].vencimento).toBe('2026-03-10');
    expect(leitura.linhas[1]).toMatchObject({ vencimento: '2026-03-15', dt_pagamento: '2026-03-14', projeto: 'Obra 1' });
    expect(leitura.meses).toEqual(['2025-12', '2026-03', '2026-04']);
    expect(leitura.cnpjsNoArquivo).toEqual(['27652481000176']);
    expect(leitura.ignoradas).toBe(2); // total + histórico de 2025
  });

  it('explica o que falta quando não acha o cabeçalho', () => {
    expect(() => lerPlanilhaContasPagar(planilha([['Nome', 'Quantia']]))).toThrow(/Vencimento/);
  });
});
