import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SavingsJarProps {
    savings: number;
    streak: number;
    colors: any;
    formatCurrency: (amount: number) => string;
}

export const SavingsJar: React.FC<SavingsJarProps> = ({ savings, streak, colors, formatCurrency }) => {
    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.iconContainer}>
                    <Ionicons name="storefront-outline" size={32} color={colors.primary} />
                </View>
                <View style={styles.info}>
                    <Text style={[styles.label, { color: colors.placeholder }]}>Savings Jar</Text>
                    <Text style={[styles.value, { color: colors.primary }]}>{formatCurrency(savings)}</Text>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.iconContainer}>
                    <Ionicons name="flame" size={32} color="#FF6B6B" />
                </View>
                <View style={styles.info}>
                    <Text style={[styles.label, { color: colors.placeholder }]}>Goal Streak</Text>
                    <Text style={[styles.value, { color: "#FF6B6B" }]}>{streak} Days</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    card: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    iconContainer: {
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
