import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { CText } from '../common/CText';
import { theme } from '../../theme';

type Props = {
    icon?: string;
    message?: string;
    style?: object;
};

export default function NoData({ icon = 'help-circle-outline', message = 'No data', style }: Props) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconWrap}>
                <Icon name={icon} size={36} color={theme.colors.light.primary} />
            </View>
            <CText style={styles.message}>{message}</CText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
    },
    iconWrap: {
        backgroundColor: theme.colors.light.primary + '22',
        padding: 12,
        borderRadius: 999,
        marginBottom: 10,
    },
    message: {
        color: '#777',
        fontSize: 14,
        textAlign: 'center',
    },
});
