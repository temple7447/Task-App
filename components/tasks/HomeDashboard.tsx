import { Task } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HomeDashboardProps {
    tasks: Task[];
    colors: any;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ tasks, colors }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dueToday = tasks.filter(t => {
        const taskDate = new Date(t.dateTime);
        return taskDate.getFullYear() === today.getFullYear() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getDate() === today.getDate() &&
            t.status !== 'completed';
    });

    const overdue = tasks.filter(t => new Date(t.dateTime) < now && t.status !== 'completed' && t.status !== 'cancelled');
    const inProgress = tasks.filter(t => t.status === 'inProgress');

    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: colors.primary }]}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>Today's Focus 🎯</Text>
                    <Text style={styles.date}>{now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{dueToday.length}</Text>
                        <Text style={styles.statLabel}>Due Today</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{inProgress.length}</Text>
                        <Text style={styles.statLabel}>In Progress</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: overdue.length > 0 ? '#FFD700' : 'white' }]}>
                            {overdue.length}
                        </Text>
                        <Text style={styles.statLabel}>Overdue</Text>
                    </View>
                </View>

                {overdue.length > 0 && (
                    <View style={styles.urgentBanner}>
                        <Ionicons name="warning" size={16} color="white" />
                        <Text style={styles.urgentText}>You have items that need attention!</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    card: {
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    date: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    urgentBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
    },
    urgentText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
});
