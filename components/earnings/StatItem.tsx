import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatItemProps {
    label: string;
    value: string;
    valueColor: string;
    labelColor: string;
}

export const StatItem: React.FC<StatItemProps> = ({ label, value, valueColor, labelColor }) => {
    return (
        <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
            <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
