import { DailyEarning } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DayItemProps {
    item: { date: Date; earning?: DailyEarning };
    colors: any;
    formatCurrency: (amount: number, options?: { forceShow?: boolean; isDebt?: boolean }) => string;
    formatDate: (date: Date) => string;
    onDelete: (id: string) => void;
    dailyGoal: number;
}

export const DayItem: React.FC<DayItemProps> = ({ item, colors, formatCurrency, formatDate, onDelete, dailyGoal }) => {
    const getDayStatus = (earning?: DailyEarning): 'met' | 'partial' | 'debt' => {
        if (!earning) return 'debt';
        if (earning.amount >= earning.goal) return 'met';
        return 'partial';
    };

    const status = getDayStatus(item.earning);
    const statusColor = status === 'met' ? colors.completed : status === 'partial' ? colors.warning : colors.error;
    const statusIcon = status === 'met' ? 'checkmark-circle' : status === 'partial' ? 'warning' : 'close-circle';

    return (
        <View style={[styles.dayCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                    <Text style={[styles.dayDate, { color: colors.text }]}>
                        {formatDate(item.date)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Ionicons name={statusIcon} size={16} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {status === 'met' ? 'Goal Met' : status === 'partial' ? 'Partial' : 'Debt'}
                        </Text>
                    </View>
                </View>

                {item.earning && (
                    <TouchableOpacity onPress={() => onDelete(item.earning!.id)}>
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.dayDetails}>
                <Text style={[styles.amount, { color: statusColor }]}>
                    {item.earning ? formatCurrency(item.earning.amount) : formatCurrency(0, { isDebt: true })}
                </Text>
                <Text style={[styles.goal, { color: colors.placeholder }]}>
                    Goal: {formatCurrency(dailyGoal)}
                </Text>
                <Text style={[styles.difference, { color: statusColor }]}>
                    {item.earning
                        ? (item.earning.amount >= dailyGoal
                            ? formatCurrency(item.earning.amount - dailyGoal)
                            : `-${formatCurrency(dailyGoal - item.earning.amount, { isDebt: true })}`)
                        : `-${formatCurrency(dailyGoal, { isDebt: true })} (Debt)`
                    }
                </Text>
            </View>

            {item.earning?.notes && (
                <Text style={[styles.notes, { color: colors.placeholder }]}>
                    {item.earning.notes}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    dayCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    dayInfo: {
        flex: 1,
    },
    dayDate: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dayDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    goal: {
        fontSize: 14,
    },
    difference: {
        fontSize: 14,
        fontWeight: '600',
    },
    notes: {
        fontSize: 14,
        marginTop: 8,
        fontStyle: 'italic',
    },
});
