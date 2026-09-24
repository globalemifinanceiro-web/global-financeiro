import { ScrollView, StyleSheet } from 'react-native';
import { SelectField } from '@/components/ui/SelectField';
import { useOpcoesFiltro } from '@/hooks/useFinanceData';
import { useFiltrosStore } from '@/stores/useFiltrosStore';
import { spacing } from '@/theme';

export function FiltersBar() {
  const { data: opcoes } = useOpcoesFiltro();
  const filtros = useFiltrosStore((state) => state.filtros);
  const setFiltro = useFiltrosStore((state) => state.setFiltro);

  if (!opcoes) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <SelectField
        label="Projeto/Obra"
        value={filtros.projeto}
        options={opcoes.projetos}
        onChange={(v) => setFiltro('projeto', v)}
      />
      <SelectField
        label="Categoria"
        value={filtros.categoria}
        options={opcoes.categorias}
        onChange={(v) => setFiltro('categoria', v)}
      />
      <SelectField
        label="Departamento"
        value={filtros.departamento}
        options={opcoes.departamentos}
        onChange={(v) => setFiltro('departamento', v)}
      />
      <SelectField
        label="Conta corrente"
        value={filtros.contaCorrente}
        options={opcoes.contasCorrentes}
        onChange={(v) => setFiltro('contaCorrente', v)}
      />
      <SelectField
        label="Situação"
        value={filtros.situacao}
        options={['aberto', 'vencido', 'liquidado']}
        onChange={(v) => setFiltro('situacao', v as never)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
});
