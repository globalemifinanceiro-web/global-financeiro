import type { SolicitacaoProjetos } from '@/types/solicitacao';

const PAPEL_LABEL: Record<string, string> = {
  gestor: 'Gestor de Projetos',
  diretor: 'Diretor',
  financeiro: 'Financeiro',
  auxiliar: 'Auxiliar de Projetos',
};

/** "aprovação do Diretor (Fulano)" — quem está segurando a solicitação agora. */
export function comQuemEsta(s: SolicitacaoProjetos): string {
  const papel = s.etapaPapel ? (PAPEL_LABEL[s.etapaPapel] ?? s.etapaPapel) : null;
  const nomes = s.responsaveis.map((r) => r.nome).filter(Boolean).join(', ');
  const etapa = s.etapaNome ?? (papel ? `aprovação do ${papel}` : 'próxima etapa');
  return nomes ? `${etapa} (${nomes})` : etapa;
}

/** Dias inteiros desde que entrou na etapa atual. */
export function diasParado(s: SolicitacaoProjetos, agora = new Date()): number {
  const desde = new Date(s.etapaDesde ?? s.atualizadoEm);
  return Math.max(0, Math.floor((agora.getTime() - desde.getTime()) / 86400000));
}
