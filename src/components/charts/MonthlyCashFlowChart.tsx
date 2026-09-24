import { Fragment, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import type { FluxoCaixaMensal } from '@/types/finance';
import { formatMonthShortBR } from '@/utils/date';
import { colors, typography } from '@/theme';

interface MonthlyCashFlowChartProps {
  data: FluxoCaixaMensal[];
  height?: number;
}

const BAR_GAP = 6;
const GROUP_PADDING = 14;

export function MonthlyCashFlowChart({ data, height = 200 }: MonthlyCashFlowChartProps) {
  const [width, setWidth] = useState(0);

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const maxValue = Math.max(1, ...data.flatMap((item) => [item.receitas, item.despesas]));
  const groupWidth = data.length > 0 ? width / data.length : 0;
  const barWidth = Math.max(6, (groupWidth - GROUP_PADDING - BAR_GAP) / 2);
  const chartHeight = height - 28;

  return (
    <View onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Line x1={0} y1={chartHeight} x2={width} y2={chartHeight} stroke={colors.border} strokeWidth={1} />
          {data.map((item, index) => {
            const groupX = index * groupWidth + GROUP_PADDING / 2;
            const receitaHeight = (item.receitas / maxValue) * (chartHeight - 8);
            const despesaHeight = (item.despesas / maxValue) * (chartHeight - 8);
            return (
              <Fragment key={item.mes}>
                <Rect
                  x={groupX}
                  y={chartHeight - receitaHeight}
                  width={barWidth}
                  height={receitaHeight}
                  rx={3}
                  fill={colors.positive}
                />
                <Rect
                  x={groupX + barWidth + BAR_GAP}
                  y={chartHeight - despesaHeight}
                  width={barWidth}
                  height={despesaHeight}
                  rx={3}
                  fill={colors.negative}
                />
              </Fragment>
            );
          })}
        </Svg>
      ) : null}
      <View style={styles.labelsRow}>
        {data.map((item) => (
          <Text key={item.mes} style={styles.monthLabel}>
            {formatMonthShortBR(item.mes)}
          </Text>
        ))}
      </View>
      <View style={styles.legendRow}>
        <LegendDot color={colors.positive} label="Receitas" />
        <LegendDot color={colors.negative} label="Despesas" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labelsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  monthLabel: { ...typography.caption, color: colors.textSecondary },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 8, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { ...typography.caption, color: colors.textSecondary },
});
