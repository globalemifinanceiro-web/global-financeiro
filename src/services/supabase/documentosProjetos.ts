import { invocarFuncao } from './functions';

export interface DocumentosProjetos {
  documentoAssinado: { nome: string; url: string }[];
  anexos: { nome: string; url: string }[];
}

/** Links novos (válidos por 1 hora) dos documentos de uma solicitação ou de um orçamento do Projetos. */
export function buscarDocumentosProjetos(id: string, tipo: 'nota' | 'orcamento' = 'nota'): Promise<DocumentosProjetos> {
  return invocarFuncao<DocumentosProjetos>('documentos-projetos', { id, tipo });
}
