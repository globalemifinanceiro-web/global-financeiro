/** Orçamento/proposta aprovado pela Diretoria no Projetos Global. */
export interface OrcamentoProjetos {
  id: string;
  codigo: string | null;
  projetoPcg: string | null;
  projetoCliente: string | null;
  empresa: string | null;
  fornecedor: string | null;
  numeroDocumento: string | null;
  emissao: string | null;
  validade: string | null;
  valor: number | null;
  condicaoPagamento: string | null;
  descricao: string | null;
  quantidadeItens: number;
  enviadoPor: string | null;
  gestorNome: string | null;
  diretoriaNome: string | null;
  aprovadoEm: string;
  /** Cópias no storage do Financeiro (bucket "orcamentos"). */
  arquivoPath: string | null;
  arquivoNome: string | null;
  assinadoPath: string | null;
  assinadoNome: string | null;
}
