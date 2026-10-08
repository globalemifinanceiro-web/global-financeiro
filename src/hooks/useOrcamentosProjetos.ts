import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { carregarPainelOrcamentos } from '@/services/supabase/orcamentosProjetos';
import { useSessionStore } from '@/stores/useSessionStore';
import type { OrcamentoProjetos } from '@/types/orcamento';
import { tocarAlertaSonoro } from '@/utils/alertaSonoro';

const INTERVALO_MS = 2 * 60 * 1000;
const CHAVE_VISTOS = 'orcamentos-projetos-vistos';

/** Sincroniza com o Projetos Global a cada 2 minutos enquanto o app está aberto. */
export function usePainelOrcamentos() {
  const logado = useSessionStore((state) => !!state.usuario);
  return useQuery({
    queryKey: ['orcamentos-projetos'],
    queryFn: carregarPainelOrcamentos,
    refetchInterval: INTERVALO_MS,
    enabled: logado,
  });
}

/** Pop-up + som quando a Diretoria aprova um orçamento no Projetos. Cada orçamento avisa uma vez. */
export function useAlertaOrcamentos() {
  const { data } = usePainelOrcamentos();
  const [paraAlertar, setParaAlertar] = useState<OrcamentoProjetos[]>([]);

  useEffect(() => {
    const aprovados = data?.orcamentos ?? [];
    if (aprovados.length === 0) return;
    let cancelado = false;

    (async () => {
      const vistosRaw = await AsyncStorage.getItem(CHAVE_VISTOS);
      const vistos = new Set<string>(vistosRaw ? JSON.parse(vistosRaw) : []);
      const novos = aprovados.filter((o) => !vistos.has(o.id));
      if (cancelado || novos.length === 0) return;

      setParaAlertar(novos);
      tocarAlertaSonoro();
      await AsyncStorage.setItem(CHAVE_VISTOS, JSON.stringify([...vistos, ...novos.map((o) => o.id)]));
    })();

    return () => {
      cancelado = true;
    };
  }, [data]);

  return { paraAlertar, dispensar: () => setParaAlertar([]) };
}
