import { Task } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TaskCardProps {
    task: Task;
    colors: any;
    projectName: string | null;
    onToggleCheckbox: (taskId: string, currentChecked: boolean) => void;
    onUpdateStatus: (taskId: string, newStatus: Task['status']) => void;
    onDelete: (taskId: string, taskTitle: string) => void;
    formatDate: (date: Date) => string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    colors,
    projectName,
    onToggleCheckbox,
    onUpdateStatus,
    onDelete,
    formatDate,
}) => {
    const getStatusColor = (status: Task['status']): string => {
        const statusColors = {
            pending: colors.pending,
            inProgress: colors.inProgress,
            completed: colors.completed,
            cancelled: colors.cancelled,
        };
        return statusColors[status] || colors.placeholder;
    };

    const getStatusIcon = (status: Task['status']): keyof typeof Ionicons.glyphMap => {
        const statusIcons = {
            pending: 'time-outline',
            inProgress: 'play-circle-outline',
            completed: 'checkmark-circle',
            cancelled: 'close-circle-outline',
        } as const;
        return statusIcons[status] || 'help-circle-outline';
    };

    const getNextStatus = (currentStatus: Task['status']): Task['status'] => {
        const statusFlow = {
            pending: 'inProgress',
            inProgress: 'completed',
            completed: 'pending',
            cancelled: 'pending',
        } as const;
        return statusFlow[currentStatus];
    };

    /**
     * Calculate relative time (e.g., "In 2 hours", "Overdue by 1 day")
     */
    const getRelativeTime = (date: Date): string => {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const absDiff = Math.abs(diff);

        const minutes = Math.floor(absDiff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (diff > 0) {
            if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
            if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
            return `In ${minutes} min${minutes > 1 ? 's' : ''}`;
        } else {
            if (days > 0) return `Overdue ${days} day${days > 1 ? 's' : ''}`;
            if (hours > 0) return `Overdue ${hours} hour${hours > 1 ? 's' : ''}`;
            return `Overdue ${minutes} min${minutes > 1 ? 's' : ''}`;
        }
    };

    const getCategoryIcon = (category?: string): keyof typeof Ionicons.glyphMap => {
        switch (category) {
            case 'work': return 'briefcase-outline';
            case 'personal': return 'person-outline';
            case 'errand': return 'cart-outline';
            case 'health': return 'fitness-outline';
            case 'finance': return 'cash-outline';
            default: return 'list-outline';
        }
    };

    const isOverdue = new Date() > task.dateTime && task.status !== 'completed';
    const completedSubtasks = task.subTasks?.filter(st => st.isCompleted).length || 0;
    const totalSubtasks = task.subTasks?.length || 0;

    return (
        <View style={[styles.taskCard, {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
        }]}>
            <View style={styles.taskHeader}>
                {/* Checkbox */}
                <TouchableOpacity
                    onPress={() => onToggleCheckbox(task.id, task.isChecked)}
                    style={styles.checkbox}
                >
                    <Ionicons
                        name={task.isChecked ? "checkbox" : "square-outline"}
                        size={24}
                        color={task.isChecked ? colors.completed : colors.placeholder}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.taskInfo}
                    onPress={() => {
                        Alert.alert(
                            task.title,
                            `${task.description}\n\nDue: ${formatDate(task.dateTime)}\nStatus: ${task.status}${projectName ? `\nProject: ${projectName}` : ''}`,
                            [{ text: 'OK' }]
                        );
                    }}
                >
                    <View style={styles.titleRow}>
                        <Ionicons name={getCategoryIcon(task.category)} size={16} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text
                            style={[
                                styles.taskTitle,
                                { color: colors.text },
                                task.isChecked && styles.taskTitleChecked
                            ]}
                            numberOfLines={1}
                        >
                            {task.title}
                        </Text>
                    </View>

                    <View style={styles.taskMetaRow}>
                        <View style={styles.statusContainer}>
                            <Ionicons
                                name={getStatusIcon(task.status)}
                                size={16}
                                color={getStatusColor(task.status)}
                            />
                            <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Text>
                        </View>

                        {projectName && (
                            <View style={[styles.projectBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="briefcase-outline" size={12} color={colors.primary} />
                                <Text style={[styles.projectBadgeText, { color: colors.primary }]} numberOfLines={1}>
                                    {projectName}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <View style={styles.taskActions}>
                    <TouchableOpacity
                        onPress={() => onUpdateStatus(task.id, getNextStatus(task.status))}
                        style={styles.actionButton}
                    >
                        <Ionicons name="refresh" size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => onDelete(task.id, task.title)}
                        style={styles.actionButton}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <Text
                style={[
                    styles.taskDescription,
                    { color: colors.placeholder },
                    task.isChecked && styles.taskDescriptionChecked
                ]}
                numberOfLines={1}
            >
                {task.description}
            </Text>

            {/* Subtasks Summary */}
            {totalSubtasks > 0 && (
                <View style={styles.subtaskSummary}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: colors.completed,
                                    width: `${(completedSubtasks / totalSubtasks) * 100}%`
                                }
                            ]}
                        />
                    </View>
                    <Text style={[styles.subtaskText, { color: colors.placeholder }]}>
                        {completedSubtasks}/{totalSubtasks} subtasks
                    </Text>
                </View>
            )}

            <View style={styles.taskMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={isOverdue ? colors.error : colors.placeholder} />
                    <Text style={[styles.metaText, { color: isOverdue ? colors.error : colors.placeholder }]}>
                        {getRelativeTime(task.dateTime)} ({formatDate(task.dateTime)})
                    </Text>
                </View>

                {task.location && (
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color={colors.placeholder} />
                        <Text style={[styles.metaText, { color: colors.placeholder }]} numberOfLines={1}>
                            {task.location}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    taskCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkbox: {
        padding: 4,
        marginRight: 8,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    taskTitleChecked: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    subtaskSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    subtaskText: {
        fontSize: 11,
        fontWeight: '700',
    },
    taskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    projectBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
        maxWidth: 120,
    },
    projectBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    taskActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        padding: 4,
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 12,
    },
    taskDescriptionChecked: {
        opacity: 0.6,
    },
    taskMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f040',
        paddingTop: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
