import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { carregarPainelSolicitacoes } from '@/services/supabase/solicitacoesProjetos';
import { useSessionStore } from '@/stores/useSessionStore';
import { EM_APROVACAO, type SolicitacaoProjetos } from '@/types/solicitacao';
import { tocarAlertaSonoro } from '@/utils/alertaSonoro';

const INTERVALO_MS = 2 * 60 * 1000;
const CHAVE_VISTAS = 'solicitacoes-projetos-vistas';

/** Sincroniza com o Projetos Global a cada 2 minutos enquanto o app está aberto. */
export function usePainelSolicitacoes() {
  const logado = useSessionStore((state) => !!state.usuario);
  return useQuery({
    queryKey: ['solicitacoes-projetos'],
    queryFn: carregarPainelSolicitacoes,
    refetchInterval: INTERVALO_MS,
    enabled: logado,
  });
}

/**
 * Pop-up + som quando aparece uma solicitação nova em aprovação no Projetos (lançada, com o
 * Gestor ou com o Diretor). Cada solicitação só avisa uma vez — fica marcada no aparelho.
 */
export function useAlertaSolicitacoes() {
  const { data } = usePainelSolicitacoes();
  const [paraAlertar, setParaAlertar] = useState<SolicitacaoProjetos[]>([]);

  useEffect(() => {
    const emAprovacao = data?.solicitacoes.filter((s) => EM_APROVACAO.includes(s.situacao)) ?? [];
    if (emAprovacao.length === 0) return;
    let cancelado = false;

    (async () => {
      const vistasRaw = await AsyncStorage.getItem(CHAVE_VISTAS);
      const vistas = new Set<string>(vistasRaw ? JSON.parse(vistasRaw) : []);
      const novas = emAprovacao.filter((s) => !vistas.has(s.id));
      if (cancelado || novas.length === 0) return;

      setParaAlertar(novas);
      tocarAlertaSonoro();
      await AsyncStorage.setItem(CHAVE_VISTAS, JSON.stringify([...vistas, ...novas.map((s) => s.id)]));
    })();

    return () => {
      cancelado = true;
    };
  }, [data]);

  return { paraAlertar, dispensar: () => setParaAlertar([]) };
}
