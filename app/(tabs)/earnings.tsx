/**
 * Earnings Screen - Daily Income Tracker
 * 
 * Track daily earnings with a goal of 28,000 Naira per day.
 * Days without entries are automatically marked as debt.
 * 
 * Features:
 * - Daily earning entry
 * - Monthly statistics
 * - Debt tracking
 * - Calendar view
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DailyEarning, EarningStatistics } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAILY_GOAL = 28000; // Naira
const STORAGE_KEY = 'taskmaster_earnings';

export default function EarningsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // State
    const [earnings, setEarnings] = useState<DailyEarning[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Form states
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());

    /**
     * Load earnings on focus
     */
    useFocusEffect(
        useCallback(() => {
            loadEarnings();
        }, [])
    );

    /**
     * Load all earnings from storage
     */
    const loadEarnings = async () => {
        try {
            setIsLoading(true);
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                const earningsWithDates = parsed.map((e: any) => ({
                    ...e,
                    date: new Date(e.date),
                    createdAt: new Date(e.createdAt),
                    updatedAt: new Date(e.updatedAt),
                }));
                setEarnings(earningsWithDates);
            }
        } catch (error) {
            console.error('Error loading earnings:', error);
            Alert.alert('Error', 'Failed to load earnings');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    /**
     * Save earnings to storage
     */
    const saveEarnings = async (newEarnings: DailyEarning[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEarnings));
        } catch (error) {
            console.error('Error saving earnings:', error);
            throw error;
        }
    };

    /**
   * Add new earning entry with automatic debt payment
   */
    const addEarning = async () => {
        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum < 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        // Check if entry already exists for this date
        const dateStr = normalizeDate(selectedDate).toISOString();
        const exists = earnings.some(e => normalizeDate(e.date).toISOString() === dateStr);

        if (exists) {
            Alert.alert('Entry Exists', 'An entry already exists for this date. Please edit it instead.');
            return;
        }

        try {
            const newEarning: DailyEarning = {
                id: Date.now().toString(),
                date: normalizeDate(selectedDate),
                amount: amountNum,
                goal: DAILY_GOAL,
                notes: notes.trim(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            let updatedEarnings = [...earnings, newEarning];

            // Automatic debt payment: if surplus exists, fill previous debt days
            if (amountNum > DAILY_GOAL) {
                const surplus = amountNum - DAILY_GOAL;
                updatedEarnings = applyDebtPayment(updatedEarnings, newEarning.id, surplus);
            }

            const sorted = updatedEarnings.sort((a, b) => b.date.getTime() - a.date.getTime());
            await saveEarnings(sorted);
            setEarnings(sorted);

            setShowAddModal(false);
            setAmount('');
            setNotes('');
            setSelectedDate(new Date());

            const paidDebt = amountNum > DAILY_GOAL;
            Alert.alert(
                'Success',
                paidDebt
                    ? `Earning added! Surplus of ₦${(amountNum - DAILY_GOAL).toLocaleString()} applied to debt.`
                    : 'Earning added successfully!'
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to add earning');
        }
    };

    /**
     * Apply surplus to pay off previous debt days
     */
    const applyDebtPayment = (allEarnings: DailyEarning[], currentId: string, surplus: number): DailyEarning[] => {
        // Get all days from start of month to today
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const debtDays: Date[] = [];

        // Find all debt days (days without entries)
        for (let d = new Date(startOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = normalizeDate(new Date(d)).toISOString();
            const hasEntry = allEarnings.some(e => normalizeDate(e.date).toISOString() === dateStr);
            if (!hasEntry) {
                debtDays.push(new Date(d));
            }
        }

        // Sort debt days oldest first
        debtDays.sort((a, b) => a.getTime() - b.getTime());

        // Apply surplus to debt days
        let remainingSurplus = surplus;
        const newEntries: DailyEarning[] = [];

        for (const debtDay of debtDays) {
            if (remainingSurplus <= 0) break;

            const paymentAmount = Math.min(remainingSurplus, DAILY_GOAL);

            newEntries.push({
                id: `debt_payment_${Date.now()}_${Math.random()}`,
                date: normalizeDate(debtDay),
                amount: paymentAmount,
                goal: DAILY_GOAL,
                notes: `Auto-paid from surplus (${formatDate(selectedDate)})`,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            remainingSurplus -= paymentAmount;
        }

        return [...allEarnings, ...newEntries];
    };

    /**
     * Delete earning
     */
    const deleteEarning = (id: string) => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const updated = earnings.filter(e => e.id !== id);
                            await saveEarnings(updated);
                            setEarnings(updated);
                            Alert.alert('Success', 'Entry deleted');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete entry');
                        }
                    },
                },
            ]
        );
    };

    /**
     * Normalize date to start of day
     */
    const normalizeDate = (date: Date): Date => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    /**
     * Get earnings for current month
     */
    const getMonthEarnings = (): DailyEarning[] => {
        return earnings.filter(e => {
            const earningDate = new Date(e.date);
            return earningDate.getMonth() === currentMonth.getMonth() &&
                earningDate.getFullYear() === currentMonth.getFullYear();
        });
    };

    /**
     * Calculate monthly statistics
     */
    const getMonthlyStats = (): EarningStatistics => {
        const monthEarnings = getMonthEarnings();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const today = new Date();
        const isCurrentMonth = currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
        const daysPassed = isCurrentMonth ? today.getDate() : daysInMonth;

        const totalEarned = monthEarnings.reduce((sum, e) => sum + e.amount, 0);
        const daysTracked = monthEarnings.length;
        const daysMissed = daysPassed - daysTracked;
        const totalGoal = daysPassed * DAILY_GOAL;
        const totalDebt = daysMissed * DAILY_GOAL;
        const averageDaily = daysTracked > 0 ? totalEarned / daysTracked : 0;
        const bestDay = monthEarnings.length > 0 ? Math.max(...monthEarnings.map(e => e.amount)) : 0;
        const worstDay = monthEarnings.length > 0 ? Math.min(...monthEarnings.map(e => e.amount)) : 0;

        return {
            totalEarned,
            totalGoal,
            totalDebt,
            daysTracked,
            daysMissed,
            averageDaily,
            bestDay,
            worstDay,
        };
    };

    /**
     * Get status for a day
     */
    const getDayStatus = (earning?: DailyEarning): 'met' | 'partial' | 'debt' => {
        if (!earning) return 'debt';
        if (earning.amount >= earning.goal) return 'met';
        return 'partial';
    };

    /**
     * Format currency
     */
    const formatCurrency = (amount: number): string => {
        return `₦${amount.toLocaleString()}`;
    };

    /**
     * Format date
     */
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    /**
     * Navigate month
     */
    const changeMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(currentMonth);
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1);
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1);
        }
        setCurrentMonth(newMonth);
    };

    /**
     * Get days in current month with earnings
     */
    const getMonthDays = () => {
        const monthEarnings = getMonthEarnings();
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const today = new Date();
        const isCurrentMonth = currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();

        const days = [];
        for (let day = 1; day <= (isCurrentMonth ? today.getDate() : daysInMonth); day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const earning = monthEarnings.find(e =>
                normalizeDate(e.date).toISOString() === normalizeDate(date).toISOString()
            );
            days.push({ date, earning });
        }
        return days.reverse();
    };

    /**
     * Render day item
     */
    const renderDayItem = ({ item }: { item: { date: Date; earning?: DailyEarning } }) => {
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
                        <TouchableOpacity onPress={() => deleteEarning(item.earning!.id)}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.dayDetails}>
                    <Text style={[styles.amount, { color: statusColor }]}>
                        {item.earning ? formatCurrency(item.earning.amount) : formatCurrency(0)}
                    </Text>
                    <Text style={[styles.goal, { color: colors.placeholder }]}>
                        Goal: {formatCurrency(DAILY_GOAL)}
                    </Text>
                    <Text style={[styles.difference, { color: statusColor }]}>
                        {item.earning
                            ? (item.earning.amount >= DAILY_GOAL
                                ? `+${formatCurrency(item.earning.amount - DAILY_GOAL)}`
                                : `-${formatCurrency(DAILY_GOAL - item.earning.amount)}`)
                            : `-${formatCurrency(DAILY_GOAL)} (Debt)`
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

    const stats = getMonthlyStats();
    const monthDays = getMonthDays();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => changeMonth('prev')}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.monthText, { color: colors.text }]}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => changeMonth('next')}>
                    <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Statistics Card */}
            <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Earned</Text>
                        <Text style={[styles.statValue, { color: colors.completed }]}>
                            {formatCurrency(stats.totalEarned)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Goal</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {formatCurrency(stats.totalGoal)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Debt</Text>
                        <Text style={[styles.statValue, { color: colors.error }]}>
                            {formatCurrency(stats.totalDebt)}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Days Tracked</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {stats.daysTracked}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Days Missed</Text>
                        <Text style={[styles.statValue, { color: colors.error }]}>
                            {stats.daysMissed}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: colors.placeholder }]}>Average</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {formatCurrency(Math.round(stats.averageDaily))}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Days List */}
            <FlatList
                data={monthDays}
                keyExtractor={(item) => item.date.toISOString()}
                renderItem={renderDayItem}
                contentContainerStyle={styles.daysList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => {
                            setIsRefreshing(true);
                            loadEarnings();
                        }}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cash-outline" size={64} color={colors.placeholder} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No entries yet</Text>
                        <Text style={[styles.emptyDescription, { color: colors.placeholder }]}>
                            Start tracking your daily earnings!
                        </Text>
                    </View>
                }
            />

            {/* Add Earning Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Earning</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <Text style={[styles.label, { color: colors.text }]}>Amount (₦) *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="28000"
                                    placeholderTextColor={colors.placeholder}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />

                                <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
                                <TextInput
                                    style={[styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Optional notes..."
                                    placeholderTextColor={colors.placeholder}
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    numberOfLines={3}
                                />

                                <Text style={[styles.infoText, { color: colors.placeholder }]}>
                                    Daily Goal: {formatCurrency(DAILY_GOAL)}
                                </Text>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.cancelButton, { borderColor: colors.border }]}
                                    onPress={() => setShowAddModal(false)}
                                >
                                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                    onPress={addEarning}
                                >
                                    <Text style={styles.saveButtonText}>Add Entry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    monthText: {
        fontSize: 18,
        fontWeight: '600',
    },
    statsCard: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    daysList: {
        paddingHorizontal: 16,
        flexGrow: 1,
    },
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    infoText: {
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
