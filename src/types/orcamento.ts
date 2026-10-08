/** Orçamento/proposta aprovado pela Diretoria no Projetos Global. */
export interface OrcamentoProjetos {
  id: string;
  codigo: string | null;
  projetoPcg: string | null;
  projetoCliente: string | null;
  empresa: string | null;
  fornecedor: string | null;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  emissao: string | null;
  vencimento: string | null;
  valor: number | null;
  formaPagamento: string | null;
  categoria: string | null;
  descricao: string | null;
  enviadoPor: string | null;
  enviadoEm: string | null;
  gestorNome: string | null;
  gestorEm: string | null;
  diretoriaNome: string | null;
  aprovadoEm: string;
}
