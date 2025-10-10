import React from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '@/services/storage-service';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const resetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear your onboarding completion status and show the welcome screens again next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.setOnboardingCompleted(false);
              Alert.alert('Success', 'Onboarding has been reset. Restart the app to see the welcome screens.');
            } catch (error) {
              console.error('Error resetting onboarding:', error);
              Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
            }
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your tasks and reset the app to its initial state. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Success', 'All data has been cleared. Restart the app to start fresh.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear all data. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="gear"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">About TaskMaster</ThemedText>
        <ThemedText>TaskMaster is your personal task management companion. Create, organize, and track your tasks with ease.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Features</ThemedText>
        <ThemedView style={styles.featureList}>
          <ThemedView style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <ThemedText>Create tasks with titles, descriptions, dates, and locations</ThemedText>
          </ThemedView>
          <ThemedView style={styles.featureItem}>
            <Ionicons name="list" size={20} color={colors.primary} />
            <ThemedText>View and manage all your tasks in one place</ThemedText>
          </ThemedView>
          <ThemedView style={styles.featureItem}>
            <Ionicons name="filter" size={20} color={colors.warning} />
            <ThemedText>Sort and filter tasks by status or date</ThemedText>
          </ThemedView>
          <ThemedView style={styles.featureItem}>
            <Ionicons name="trending-up" size={20} color={colors.secondary} />
            <ThemedText>Track progress with status updates</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Actions</ThemedText>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.border }]}
          onPress={resetOnboarding}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <ThemedText style={styles.actionButtonText}>Reset Onboarding</ThemedText>
          <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton, { borderColor: colors.error }]}
          onPress={clearAllData}
        >
          <Ionicons name="trash" size={20} color={colors.error} />
          <ThemedText style={[styles.actionButtonText, { color: colors.error }]}>Clear All Data</ThemedText>
          <Ionicons name="chevron-forward" size={16} color={colors.error} />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Version</ThemedText>
        <ThemedText>TaskMaster v1.0.0</ThemedText>
        <ThemedText style={[styles.versionNote, { color: colors.placeholder }]}>
          Built with React Native & Expo
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  featureList: {
    gap: 12,
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  versionNote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
