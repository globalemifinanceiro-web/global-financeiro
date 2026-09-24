import { create } from 'zustand';
import type { FiltrosFinanceiros } from '@/types/finance';

interface FiltrosState {
  filtros: FiltrosFinanceiros;
  setFiltro: <K extends keyof FiltrosFinanceiros>(chave: K, valor: FiltrosFinanceiros[K]) => void;
  limparFiltros: () => void;
}

export const useFiltrosStore = create<FiltrosState>((set) => ({
  filtros: {},
  setFiltro: (chave, valor) =>
    set((state) => ({ filtros: { ...state.filtros, [chave]: valor || undefined } })),
  limparFiltros: () => set({ filtros: {} }),
}));
