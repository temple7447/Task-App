/**
 * Earnings Screen - Enhanced Financial Tracker
 * 
 * Features:
 * - Daily earning entry & Debt tracking
 * - Component-based architecture
 * - Expense tracking & Net profit calculation
 * - Savings Jar for surplus (when debt is zero)
 * - Achievement Streaks for goal consistency
 * - Progress bars & Privacy toggles
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DailyEarning, EarningStatistics, Expense } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Modular Components
import { AddEarningModal } from '@/components/earnings/AddEarningModal';
import { DayItem } from '@/components/earnings/DayItem';
import { ExpenseModal } from '@/components/earnings/ExpenseModal';
import { MonthNavigator } from '@/components/earnings/MonthNavigator';
import { SavingsJar } from '@/components/earnings/SavingsJar';
import { StatsCard } from '@/components/earnings/StatsCard';

const DAILY_GOAL = 28000;
const STORAGE_KEYS = {
    EARNINGS: 'taskmaster_earnings',
    EXPENSES: 'taskmaster_expenses',
    SAVINGS: 'taskmaster_savings_jar',
};

export default function EarningsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // State
    const [earnings, setEarnings] = useState<DailyEarning[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [savings, setSavings] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showPrivateData, setShowPrivateData] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Form states
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');

    /**
     * Load data on focus
     */
    useFocusEffect(
        useCallback(() => {
            loadAllData();
        }, [])
    );

    const loadAllData = async () => {
        try {
            setIsLoading(true);
            const [eData, exData, sData] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.EARNINGS),
                AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
                AsyncStorage.getItem(STORAGE_KEYS.SAVINGS),
            ]);

            if (eData) {
                const parsed = JSON.parse(eData);
                setEarnings(parsed.map((e: any) => ({
                    ...e,
                    date: new Date(e.date),
                    createdAt: new Date(e.createdAt),
                    updatedAt: new Date(e.updatedAt),
                })));
            }

            if (exData) {
                const parsed = JSON.parse(exData);
                setExpenses(parsed.map((e: any) => ({
                    ...e,
                    date: new Date(e.date),
                    createdAt: new Date(e.createdAt),
                    updatedAt: new Date(e.updatedAt),
                })));
            }

            if (sData) setSavings(parseFloat(sData) || 0);

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    /**
     * Storage Helpers
     */
    const saveData = async (key: string, data: any) => {
        try {
            await AsyncStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
        }
    };

    /**
     * Logic: Add Earning with Debt/Savings distribution
     */
    const addEarning = async () => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        try {
            const today = new Date();
            const newEarning: DailyEarning = {
                id: Date.now().toString(),
                date: normalizeDate(today),
                amount: amountNum,
                goal: DAILY_GOAL,
                notes: notes.trim(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            let updatedEarnings = [...earnings, newEarning];
            let newSavings = savings;

            // Distribution Logic
            if (amountNum > DAILY_GOAL) {
                const surplus = amountNum - DAILY_GOAL;
                const stats = calculateStats(earnings, expenses, currentMonth);

                if (stats.totalDebt > 0) {
                    // Pay debt first
                    updatedEarnings = applyDebtPayment(updatedEarnings, surplus);
                } else {
                    // Add to savings if no debt
                    newSavings += surplus;
                }
            }

            const sorted = updatedEarnings.sort((a, b) => b.date.getTime() - a.date.getTime());

            await Promise.all([
                saveData(STORAGE_KEYS.EARNINGS, sorted),
                saveData(STORAGE_KEYS.SAVINGS, newSavings.toString()),
            ]);

            setEarnings(sorted);
            setSavings(newSavings);
            setShowAddModal(false);
            setAmount('');
            setNotes('');

            Alert.alert('Success', 'Earning added successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to add earning');
        }
    };

    /**
     * Logic: Add Expense
     */
    const addExpense = async (amt: number, cat: string, note: string) => {
        const newExpense: Expense = {
            id: Date.now().toString(),
            amount: amt,
            category: cat,
            notes: note,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const updated = [newExpense, ...expenses];
        await saveData(STORAGE_KEYS.EXPENSES, updated);
        setExpenses(updated);
        Alert.alert('Success', 'Expense logged');
    };

    /**
     * Helper: Debt Payment Logic
     */
    const applyDebtPayment = (allEarnings: DailyEarning[], surplus: number): DailyEarning[] => {
        // Simplified debt payment for refactor
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const debtDays: Date[] = [];

        for (let d = new Date(startOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = normalizeDate(new Date(d)).toISOString();
            const hasEntry = allEarnings.some(e => normalizeDate(e.date).toISOString() === dateStr);
            if (!hasEntry) debtDays.push(new Date(d));
        }

        debtDays.sort((a, b) => a.getTime() - b.getTime());

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
                notes: `Auto-paid from surplus`,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            remainingSurplus -= paymentAmount;
        }

        return [...allEarnings, ...newEntries];
    };

    /**
     * Statistics Calculation
     */
    const calculateStats = (eList: DailyEarning[], exList: Expense[], month: Date): EarningStatistics => {
        const monthEarnings = eList.filter(e =>
            e.date.getMonth() === month.getMonth() && e.date.getFullYear() === month.getFullYear()
        );
        const monthExpenses = exList.filter(ex =>
            ex.date.getMonth() === month.getMonth() && ex.date.getFullYear() === month.getFullYear()
        );

        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const isCurrentMonth = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear();
        const daysPassed = isCurrentMonth ? new Date().getDate() : daysInMonth;

        const totalEarned = monthEarnings.reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = monthExpenses.reduce((sum, ex) => sum + ex.amount, 0);
        const daysTracked = monthEarnings.length;
        const totalGoal = daysPassed * DAILY_GOAL;
        const totalDebt = (daysPassed - daysTracked) * DAILY_GOAL;

        return {
            totalEarned,
            totalGoal,
            totalDebt,
            totalExpenses,
            netProfit: totalEarned - totalExpenses,
            totalSavings: savings,
            daysTracked,
            daysMissed: daysPassed - daysTracked,
            averageDaily: daysTracked > 0 ? totalEarned / daysTracked : 0,
            bestDay: monthEarnings.length > 0 ? Math.max(...monthEarnings.map(e => e.amount)) : 0,
            worstDay: monthEarnings.length > 0 ? Math.min(...monthEarnings.map(e => e.amount)) : 0,
        };
    };

    /**
     * Streak Calculation
     */
    const getStreak = (): number => {
        let count = 0;
        const sorted = [...earnings].sort((a, b) => b.date.getTime() - a.date.getTime());
        const today = normalizeDate(new Date());

        let checkDate = new Date(today);

        for (const e of sorted) {
            const eDate = normalizeDate(e.date);
            if (eDate.getTime() === checkDate.getTime()) {
                if (e.amount >= e.goal) {
                    count++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else break;
            } else if (eDate.getTime() < checkDate.getTime()) {
                break;
            }
        }
        return count;
    };

    /**
     * Formatting Helpers (Moved to main to share showPrivateData state)
     */
    const formatCurrency = (amount: number, options?: { forceShow?: boolean; isDebt?: boolean }): string => {
        if (options?.isDebt || options?.forceShow || showPrivateData) {
            return `₦${amount.toLocaleString()}`;
        }
        return '₦••••';
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const normalizeDate = (date: Date): Date => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const stats = calculateStats(earnings, expenses, currentMonth);
    const displayedDays = (() => {
        const monthDays = [];
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth();
        const maxDay = isCurrentMonth ? new Date().getDate() : daysInMonth;

        for (let d = 1; d <= maxDay; d++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
            const earning = earnings.find(e => normalizeDate(e.date).getTime() === normalizeDate(date).getTime());
            monthDays.push({ date, earning });
        }
        return monthDays.reverse();
    })();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings</Text>
                    <TouchableOpacity onPress={() => setShowPrivateData(!showPrivateData)}>
                        <Ionicons
                            name={showPrivateData ? "eye-outline" : "eye-off-outline"}
                            size={24}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: colors.error }]}
                        onPress={() => setShowExpenseModal(true)}
                    >
                        <Ionicons name="receipt-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowAddModal(true)}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Top Stats: Savings & Streaks */}
            <SavingsJar
                savings={savings}
                streak={getStreak()}
                colors={colors}
                formatCurrency={(amt) => formatCurrency(amt, { forceShow: true })}
            />

            <MonthNavigator
                currentMonth={currentMonth}
                onPrev={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                onNext={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                colors={colors}
            />

            <FlatList
                data={displayedDays}
                keyExtractor={(item) => item.date.toISOString()}
                ListHeaderComponent={
                    <StatsCard
                        stats={stats}
                        colors={colors}
                        formatCurrency={formatCurrency}
                        currentMonth={currentMonth}
                        showPrivateData={showPrivateData}
                    />
                }
                renderItem={({ item }) => (
                    <View style={styles.listItem}>
                        <DayItem
                            item={item}
                            colors={colors}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            dailyGoal={DAILY_GOAL}
                            onDelete={(id) => {
                                Alert.alert('Delete', 'Remove this entry?', [
                                    { text: 'Cancel' },
                                    {
                                        text: 'Delete', style: 'destructive', onPress: async () => {
                                            const updated = earnings.filter(e => e.id !== id);
                                            await saveData(STORAGE_KEYS.EARNINGS, updated);
                                            setEarnings(updated);
                                        }
                                    }
                                ]);
                            }}
                        />
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={loadAllData} tintColor={colors.primary} />}
            />

            <AddEarningModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={addEarning}
                amount={amount}
                setAmount={setAmount}
                notes={notes}
                setNotes={setNotes}
                colors={colors}
                dailyGoal={DAILY_GOAL}
                formatCurrency={(amt) => formatCurrency(amt, { forceShow: true })}
            />

            <ExpenseModal
                visible={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                onSave={addExpense}
                colors={colors}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    actionBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 100 },
    listItem: { paddingHorizontal: 16 },
});
