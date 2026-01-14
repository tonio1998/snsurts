import React from 'react';
import {
    View,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { CText } from './common/CText.tsx';
import {theme} from "../theme";

const LoadingState = () => {
    return (
        <>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <ActivityIndicator size="large" color={theme.colors.light.primary} />
                    <CText
                        style={{
                            marginTop: 10,
                            fontSize: 15,
                            opacity: 0.6,
                        }}
                    >
                        Loading…
                    </CText>
                </View>
            </SafeAreaView>
        </>
    );
};

export default LoadingState;
