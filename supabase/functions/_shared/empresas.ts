// CNPJ (só dígitos) e nome -> nome da empresa no Financeiro (mesmos nomes de src/constants/empresas.ts).

const EMPRESA_POR_CNPJ: Record<string, string> = {
  '27652481000176': 'Global Engenharia',
  '45740203000152': 'Global Montagem',
  '49413918000151': 'Global Serviço',
};

const EMPRESA_POR_NOME: Record<string, string> = {
  ENGENHARIA: 'Global Engenharia',
  MONTAGEM: 'Global Montagem',
  SERVICO: 'Global Serviço',
  SERVICOS: 'Global Serviço',
};

export function empresaDoProjetos(cnpj: string | null | undefined, nome: string | null | undefined): string | null {
  const digitos = cnpj?.replace(/\D/g, '');
  if (digitos && EMPRESA_POR_CNPJ[digitos]) return EMPRESA_POR_CNPJ[digitos];
  const chave = nome?.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
  return (chave && EMPRESA_POR_NOME[chave]) || null;
}
