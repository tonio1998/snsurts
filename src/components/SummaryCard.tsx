import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CText } from './common/CText';
import { theme } from '../theme';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
}

export const SummaryCard = ({
                                title,
                                value,
                                icon,
                                color = theme.colors.light.primary,
                            }: SummaryCardProps) => {
    return (
        <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
                <Icon name={icon} size={22} color={color} />
            </View>

            <CText fontStyle="B" fontSize={22}>
                {value}
            </CText>

            <CText style={styles.title}>{title}</CText>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 13,
        color: '#777',
        marginTop: 4,
    },
});
