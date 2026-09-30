import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { ItemComVencimento } from '@/components/notasFiscais/AlertaVencimentoModal';
import { listarPendentesParaCobranca } from '@/services/supabase/contasReceberSheets';
import { precisaAlertar, statusVencimento } from '@/utils/notaFiscalStatus';
import { tocarAlertaSonoro } from '@/utils/alertaSonoro';

function chaveDoDia(): string {
  return `cobranca-alertas-vistos-${new Date().toISOString().slice(0, 10)}`;
}

/**
 * Mesma régua de aviso das notas fiscais (5/1/0 dias), só que para clientes que ainda não pagaram —
 * lembrete pra cobrar, não pra pagar. Só dispara pop-up uma vez por dia por título.
 */
export function useAlertaCobranca() {
  const { data: pendentes } = useQuery({
    queryKey: ['contas-receber-sheets', 'pendentes-cobranca'],
    queryFn: listarPendentesParaCobranca,
    refetchInterval: 5 * 60 * 1000,
  });
  const [paraAlertar, setParaAlertar] = useState<ItemComVencimento[]>([]);

  useEffect(() => {
    if (!pendentes || pendentes.length === 0) return;
    let cancelado = false;

    (async () => {
      const chave = chaveDoDia();
      const vistosRaw = await AsyncStorage.getItem(chave);
      const vistos = new Set<string>(vistosRaw ? JSON.parse(vistosRaw) : []);

      const paraCobrar = pendentes.filter((item) => {
        if (vistos.has(item.id)) return false;
        return precisaAlertar(statusVencimento({ situacao: 'pendente', vencimento: item.vencimento }));
      });

      if (cancelado || paraCobrar.length === 0) return;

      setParaAlertar(paraCobrar);
      tocarAlertaSonoro();

      const novosVistos = [...vistos, ...paraCobrar.map((item) => item.id)];
      await AsyncStorage.setItem(chave, JSON.stringify(novosVistos));
    })();

    return () => {
      cancelado = true;
    };
  }, [pendentes]);

  function dispensar() {
    setParaAlertar([]);
  }

  return { paraAlertar, dispensar };
}
