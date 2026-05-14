import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';

interface PieData {
  category: string;
  amount: number;
  color?: string;
}

interface ExpensePieChartProps {
  data: PieData[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((item, idx) => ({
    name: item.category,
    population: item.amount,
    color: item.color || colors.chart[idx % colors.chart.length],
    legendFontColor: '#64748B',
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={SCREEN_WIDTH - theme.spacing.lg * 2}
        height={180}
        chartConfig={{
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="0"
        hasLegend={false}
      />
      <View style={styles.legend}>
        {chartData.map((item) => (
          <View key={item.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.legendName}>{item.name}</Text>
            <Text style={styles.legendAmount}>{formatCurrency(item.population)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legend: {
    width: '100%',
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    ...theme.typography.caption,
    color: colors.text.secondary,
  },
  legendAmount: {
    ...theme.typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
});
