import { ThemeColors } from '@/types/task-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProjectInfoProps {
  description: string;
  stats: {
    total: number;
    checked: number;
    percentage: number;
  };
  colors: ThemeColors;
}

export const ProjectInfo: React.FC<ProjectInfoProps> = ({ description, stats, colors }) => {
  return (
    <View style={[styles.projectInfo, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <Text style={[styles.projectDescription, { color: colors.text }]}>
        {description || 'No description'}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Tasks</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.completed }]}>{stats.checked}</Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Done</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{stats.percentage}%</Text>
          <Text style={[styles.statLabel, { color: colors.placeholder }]}>Progress</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  projectInfo: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  projectDescription: {
    fontSize: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
