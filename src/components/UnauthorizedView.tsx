import React from 'react';
import { View, SafeAreaView } from 'react-native';
import CustomHomeHeader from "./layout/CustomHomeHeader.tsx";
import {globalStyles} from "../theme/styles.ts";
import Icon from "react-native-vector-icons/Ionicons";
import {CText} from "./common/CText.tsx";

interface UnauthorizedViewProps {
    title?: string;
    message?: string;
    iconName?: string;
    iconSize?: number;
    iconColor?: string;
    showHeader?: boolean;
}

const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
                                                               title = 'Unauthorized Access',
                                                               message = 'You do not have permission to access this section of the application. Please go back or sign out and switch accounts.',
                                                               iconName = 'lock-closed-outline',
                                                               iconSize = 64,
                                                               iconColor = '#999',
                                                               showHeader = true,
                                                           }) => {
    return (
        <>
            {showHeader && <CustomHomeHeader />}

            <SafeAreaView style={[globalStyles.safeArea, { flex: 1 }]}>
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 16,
                    }}
                >
                    <Icon
                        name={iconName}
                        size={iconSize}
                        color={iconColor}
                        style={{ marginBottom: 16 }}
                    />

                    <CText fontSize={18} fontStyle="B" style={{ textAlign: 'center' }}>
                        {title}
                    </CText>

                    <CText
                        fontSize={14}
                        fontStyle="R"
                        style={{ textAlign: 'center', marginTop: 8 }}
                    >
                        {message}
                    </CText>
                </View>
            </SafeAreaView>
        </>
    );
};

export default UnauthorizedView;
