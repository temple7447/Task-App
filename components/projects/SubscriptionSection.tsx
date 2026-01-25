import { ProjectSubscription, ThemeColors } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SubscriptionSectionProps {
  subscriptions?: ProjectSubscription[];
  colors: ThemeColors;
  onAddSub: () => void;
  onDeleteSub: (id: string) => void;
}

export const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  subscriptions,
  colors,
  onAddSub,
  onDeleteSub,
}) => {
  return (
    <View style={styles.subscriptionsSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscriptions</Text>
        <TouchableOpacity
          onPress={onAddSub}
          style={[styles.smallAddButton, { backgroundColor: colors.primary + '20' }]}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={[styles.smallAddButtonText, { color: colors.primary }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {subscriptions && subscriptions.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subList}>
          {subscriptions.map((sub) => (
            <View key={sub.id} style={[styles.subCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.subCardHeader}>
                <View style={styles.subCardInfo}>
                  <Text style={[styles.subName, { color: colors.text }]} numberOfLines={1}>{sub.name}</Text>
                  <Text style={[styles.subDate, { color: colors.placeholder }]}>
                    End: {sub.endDate.toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => onDeleteSub(sub.id)}>
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.subCardFooter}>
                {sub.cost !== undefined && (
                  <Text style={[styles.subCost, { color: colors.primary }]}>₦{sub.cost.toLocaleString()}</Text>
                )}
                <View style={[styles.statusBadge, { backgroundColor: sub.status === 'active' ? colors.completed + '20' : colors.error + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: sub.status === 'active' ? colors.completed : colors.error }]}>
                    {sub.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={[styles.emptySubText, { color: colors.placeholder }]}>No subscriptions tracked for this project.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  subscriptionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  smallAddButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subList: {
    paddingLeft: 16,
  },
  subCard: {
    width: 220,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    justifyContent: 'space-between',
    minHeight: 100,
  },
  subCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  subName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subDate: {
    fontSize: 11,
  },
  subCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  subCost: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  emptySubText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
