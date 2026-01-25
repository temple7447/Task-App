import { ThemeColors } from '@/types/task-types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  colors: ThemeColors;
  subName: string;
  setSubName: (text: string) => void;
  subCost: string;
  setSubCost: (text: string) => void;
  subStartDate: Date;
  setSubStartDate: (date: Date) => void;
  subEndDate: Date;
  setSubEndDate: (date: Date) => void;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  visible,
  onClose,
  onSave,
  colors,
  subName,
  setSubName,
  subCost,
  setSubCost,
  subStartDate,
  setSubStartDate,
  subEndDate,
  setSubEndDate,
}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onStartChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSubStartDate(selectedDate);
    }
  };

  const onEndChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSubEndDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Subscription</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Subscription Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Adobe Creative Cloud, Hosting"
                placeholderTextColor={colors.placeholder}
                value={subName}
                onChangeText={setSubName}
                maxLength={100}
              />

              <Text style={[styles.label, { color: colors.text }]}>Monthly Cost (₦)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter amount"
                placeholderTextColor={colors.placeholder}
                value={subCost}
                onChangeText={setSubCost}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, justifyContent: 'center' }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={{ color: colors.text }}>
                  {subStartDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={subStartDate}
                  mode="date"
                  display="default"
                  onChange={onStartChange}
                />
              )}

              <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, justifyContent: 'center' }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={{ color: colors.text }}>
                  {subEndDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={subEndDate}
                  mode="date"
                  display="default"
                  onChange={onEndChange}
                />
              )}

              <Text style={{ fontSize: 12, color: colors.placeholder, marginTop: 4 }}>
                Tip: You can use a date in the future for renewal date.
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={onSave}
              >
                <Text style={styles.saveButtonText}>Add Sub</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
