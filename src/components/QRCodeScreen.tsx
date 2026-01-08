import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Props = {
    value?: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    quietZone?: number;
};

const QRCodeScreen: React.FC<Props> = ({
                                           value,
                                           size = 160,
                                           color = '#000',
                                           backgroundColor = '#fff',
                                           quietZone = 12,
                                       }) => {
    if (!value) return null;

    return (
        <View style={styles.qrBox}>
            <QRCode
                value={value}
                size={size}
                color={color}
                backgroundColor={backgroundColor}
                quietZone={quietZone}
            />
        </View>
    );
};

export default QRCodeScreen;
const styles = StyleSheet.create({

    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0d47a1', // GCash-style deep blue
        marginBottom: 12,
    },

    qrBox: {
        backgroundColor: '#f8f9fb',
        padding: 14,
        borderRadius: 16,
        marginBottom: 12,
    },

    hint: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
    },
});
