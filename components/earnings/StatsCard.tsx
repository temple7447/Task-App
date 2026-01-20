import { EarningStatistics } from '@/types/task-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatItem } from './StatItem';

interface StatsCardProps {
    stats: EarningStatistics;
    colors: any;
    formatCurrency: (amount: number, options?: { forceShow?: boolean; isDebt?: boolean }) => string;
    currentMonth: Date;
    showPrivateData: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    stats,
    colors,
    formatCurrency,
    currentMonth,
    showPrivateData
}) => {
    const isMonthPast = new Date() > new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const progress = stats.totalGoal > 0 ? Math.min(stats.totalEarned / stats.totalGoal, 1) : 0;

    return (
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: colors.placeholder }]}>Monthly Progress</Text>
                    <Text style={[styles.progressValue, { color: colors.text }]}>
                        {Math.round(progress * 100)}%
                    </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                backgroundColor: colors.primary,
                                width: `${progress * 100}%`
                            }
                        ]}
                    />
                </View>
            </View>

            <View style={styles.statsRow}>
                <StatItem
                    label="Earned"
                    value={formatCurrency(stats.totalEarned, { forceShow: isMonthPast })}
                    valueColor={colors.completed}
                    labelColor={colors.placeholder}
                />
                <StatItem
                    label="Goal"
                    value={formatCurrency(stats.totalGoal)}
                    valueColor={colors.primary}
                    labelColor={colors.placeholder}
                />
                <StatItem
                    label="Debt"
                    value={formatCurrency(stats.totalDebt, { isDebt: true })}
                    valueColor={colors.error}
                    labelColor={colors.placeholder}
                />
            </View>

            <View style={styles.statsRow}>
                <StatItem
                    label="Days Tracked"
                    value={stats.daysTracked.toString()}
                    valueColor={colors.text}
                    labelColor={colors.placeholder}
                />
                <StatItem
                    label="Days Missed"
                    value={stats.daysMissed.toString()}
                    valueColor={colors.error}
                    labelColor={colors.placeholder}
                />
                <StatItem
                    label="Average"
                    value={formatCurrency(Math.round(stats.averageDaily))}
                    valueColor={colors.text}
                    labelColor={colors.placeholder}
                />
            </View>

            {/* Net Profit and Expenses (if implemented) */}
            {(stats.totalExpenses > 0 || showPrivateData) && (
                <View style={[styles.statsRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <StatItem
                        label="Expenses"
                        value={formatCurrency(stats.totalExpenses)}
                        valueColor={colors.error}
                        labelColor={colors.placeholder}
                    />
                    <StatItem
                        label="Net Profit"
                        value={formatCurrency(stats.netProfit, { forceShow: isMonthPast })}
                        valueColor={colors.completed}
                        labelColor={colors.placeholder}
                    />
                    <StatItem
                        label="Savings"
                        value={formatCurrency(stats.totalSavings)}
                        valueColor={colors.primary}
                        labelColor={colors.placeholder}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    statsCard: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
});
