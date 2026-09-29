import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useNotasFiscais } from './useNotasFiscais';
import { precisaAlertar, statusVencimento } from '@/utils/notaFiscalStatus';
import { tocarAlertaSonoro } from '@/utils/alertaSonoro';
import type { NotaFiscal } from '@/types/notaFiscal';

function chaveDoDia(): string {
  return `nf-alertas-vistos-${new Date().toISOString().slice(0, 10)}`;
}

/**
 * Verifica as notas fiscais pendentes e devolve as que precisam de pop-up agora (venceram, vencem
 * hoje, ou entraram na janela de 1 ou de 5 dias). Cada nota só dispara o pop-up uma vez por dia —
 * fica marcada em AsyncStorage para não incomodar toda vez que a tela recarrega.
 */
export function useAlertaVencimentoNF() {
  const { data: notas } = useNotasFiscais();
  const [paraAlertar, setParaAlertar] = useState<NotaFiscal[]>([]);

  useEffect(() => {
    if (!notas || notas.length === 0) return;
    let cancelado = false;

    (async () => {
      const chave = chaveDoDia();
      const vistosRaw = await AsyncStorage.getItem(chave);
      const vistos = new Set<string>(vistosRaw ? JSON.parse(vistosRaw) : []);

      const pendentesParaAlertar = notas.filter((nota) => {
        if (vistos.has(nota.id)) return false;
        return precisaAlertar(statusVencimento(nota));
      });

      if (cancelado || pendentesParaAlertar.length === 0) return;

      setParaAlertar(pendentesParaAlertar);
      tocarAlertaSonoro();

      const novosVistos = [...vistos, ...pendentesParaAlertar.map((n) => n.id)];
      await AsyncStorage.setItem(chave, JSON.stringify(novosVistos));
    })();

    return () => {
      cancelado = true;
    };
  }, [notas]);

  function dispensar() {
    setParaAlertar([]);
  }

  return { paraAlertar, dispensar };
}
