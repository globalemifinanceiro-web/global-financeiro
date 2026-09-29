/**
 * Identidade das empresas (CNPJs) do grupo Global — usada tanto no modo de demonstração quanto
 * no modo real. Cada CNPJ tem clientes, fornecedores, projetos e contas correntes próprios;
 * só a lista de nomes/CNPJ em si é fixa e compartilhada.
 */
export const EMPRESAS = ['Global Engenharia', 'Global Montagem', 'Global Serviço'] as const;
export type NomeEmpresa = (typeof EMPRESAS)[number];

export const CNPJ_POR_EMPRESA: Record<NomeEmpresa, string> = {
  'Global Engenharia': '27.652.481/0001-76',
  'Global Montagem': '45.740.203/0001-52',
  'Global Serviço': '49.413.918/0001-51',
};
