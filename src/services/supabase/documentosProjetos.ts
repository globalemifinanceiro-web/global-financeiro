import { invocarFuncao } from './functions';

export interface DocumentosProjetos {
  documentoAssinado: { nome: string; url: string }[];
  anexos: { nome: string; url: string }[];
}

/** Links novos (válidos por 1 hora) do documento assinado e dos anexos de uma solicitação do Projetos. */
export function buscarDocumentosProjetos(id: string): Promise<DocumentosProjetos> {
  return invocarFuncao<DocumentosProjetos>('documentos-projetos', { id });
}
