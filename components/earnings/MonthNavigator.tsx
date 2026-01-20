import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MonthNavigatorProps {
    currentMonth: Date;
    onPrev: () => void;
    onNext: () => void;
    colors: any;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({ currentMonth, onPrev, onNext, colors }) => {
    return (
        <View style={styles.monthNav}>
            <TouchableOpacity onPress={onPrev}>
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: colors.text }]}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={onNext}>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
});
