import { Task, ThemeColors } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProjectTaskItemProps {
  task: Task;
  colors: ThemeColors;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string, title: string) => void;
  formatDate: (date: Date) => string;
}

export const ProjectTaskItem: React.FC<ProjectTaskItemProps> = ({
  task,
  colors,
  onToggle,
  onDelete,
  formatDate,
}) => {
  return (
    <View style={[styles.taskCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <View style={styles.taskHeader}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle(task.id, task.isChecked)}
          style={styles.checkbox}
        >
          <Ionicons
            name={task.isChecked ? "checkbox" : "square-outline"}
            size={24}
            color={task.isChecked ? colors.completed : colors.placeholder}
          />
        </TouchableOpacity>

        <View style={styles.taskInfo}>
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

          <Text
            style={[
              styles.taskDescription,
              { color: colors.placeholder },
              task.isChecked && styles.taskDescriptionChecked
            ]}
            numberOfLines={1}
          >
            {task.description || 'No description'}
          </Text>

          <Text style={[styles.taskDate, { color: colors.placeholder }]}>
            {formatDate(task.dateTime)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(task.id, task.title)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  taskCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    padding: 4,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  taskDate: {
    fontSize: 12,
  },
  taskTitleChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskDescriptionChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  deleteButton: {
    padding: 8,
  },
});
