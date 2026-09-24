import type { Ionicons } from '@expo/vector-icons';
import type { PainelId } from './permissions';

export interface NavItem {
  id: PainelId;
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'grid-outline' },
  { id: 'contas-a-pagar', label: 'Contas a Pagar', href: '/contas-a-pagar', icon: 'arrow-up-circle-outline' },
  { id: 'contas-a-receber', label: 'Contas a Receber', href: '/contas-a-receber', icon: 'arrow-down-circle-outline' },
  { id: 'fluxo-de-caixa', label: 'Fluxo de Caixa', href: '/fluxo-de-caixa', icon: 'trending-up-outline' },
  { id: 'projetos', label: 'Projetos e Obras', href: '/projetos', icon: 'business-outline' },
  { id: 'relatorios', label: 'Relatórios', href: '/relatorios', icon: 'document-text-outline' },
  { id: 'alertas', label: 'Alertas', href: '/alertas', icon: 'notifications-outline' },
  { id: 'integracoes', label: 'Status das Integrações', href: '/integracoes', icon: 'sync-outline' },
  { id: 'configuracoes', label: 'Configurações', href: '/configuracoes', icon: 'settings-outline' },
];

export const NAV_ITEMS_PRIMARIOS: PainelId[] = ['dashboard', 'contas-a-pagar', 'contas-a-receber', 'relatorios'];
