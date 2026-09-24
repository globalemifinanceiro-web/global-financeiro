import { Redirect, Slot, usePathname } from 'expo-router';
import { AppShell } from '@/components/navigation/AppShell';
import { NAV_ITEMS } from '@/constants/navigation';
import { podeAcessar } from '@/constants/permissions';
import { useSessionStore } from '@/stores/useSessionStore';

export default function AppGroupLayout() {
  const hidratado = useSessionStore((state) => state.hidratado);
  const usuario = useSessionStore((state) => state.usuario);
  const pathname = usePathname();

  if (!hidratado) return null;
  if (!usuario) return <Redirect href="/login" />;

  const painelAtual = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  if (painelAtual && !podeAcessar(usuario.perfil, painelAtual.id)) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
