import {
    SafeAreaView,
    StyleSheet,
    View,
    Image,
} from "react-native";
import React, {useEffect, useState} from "react";
import Icon from "react-native-vector-icons/Ionicons";

import { globalStyles } from "../../theme/styles";
import CustomHomeHeader from "../../components/layout/CustomHomeHeader";
import { theme } from "../../theme";
import { CText } from "../../components/common/CText";
import UnauthorizedView from "../../components/UnauthorizedView";
import { useAccess } from "../../hooks/useAccess";
import { useAuth } from "../../context/AuthContext";
import { useFiscalYear } from "../../context/FiscalYearContext";
import {getUserDetails} from "../../api/modules/userApi.ts";
import {handleApiError} from "../../utils/errorHandler.ts";
import LinearGradient from "react-native-linear-gradient";
import {formatNumber} from "../../utils/format.ts";
import BackHeader from "../../components/layout/BackHeader.tsx";
import {FILE_BASE_URL} from "../../../env.ts";

export default function UsersDetails({ route }) {
    const { user } = useAuth();
    const { hasRole } = useAccess();
    const { fiscalYear } = useFiscalYear();

    const [userData, setUserData] = useState(null);

    const userDetails = route.params?.item;

    const loadUserDetails = async (id) => {
        try {
            const data = await getUserDetails(id);
            console.log(data);
            setUserData(data);
        } catch (e) {
            handleApiError(e, 'Failed to load user details');
        }
    };

    useEffect(() => {
        if (userDetails && user?.id) {
            loadUserDetails(userDetails.id);
        }
    }, [userDetails, user?.id]);

    if (hasRole("STUD")) {
        return <UnauthorizedView />;
    }

    if (!userDetails) {
        return (
            <SafeAreaView style={globalStyles.safeArea}>
                <BackHeader />
                <View style={styles.container}>
                    <CText>No user data available</CText>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <BackHeader/>

            <View style={styles.container}>
                <View style={styles.profileHeader}>
                    <Image
                        source={
                            userDetails?.avatar
                                ? { uri: `${FILE_BASE_URL}/${userDetails.profile_pic}`, cache: 'force-cache' }
                                : userDetails?.avatar
                                    ? { uri: userDetails?.avatar, cache: 'force-cache' }
                                    : {
                                        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            userDetails?.name || 'User'
                                        )}&background=random`,
                                        cache: 'force-cache'
                                    }
                        }
                        style={styles.profileAvatar}
                    />

                    <CText style={styles.profileName}>
                        {userDetails.name}
                    </CText>

                    <CText style={styles.profileEmail}>
                        {userDetails.email}
                    </CText>
                </View>

                <View>
                    <LinearGradient
                        colors={[
                            theme.colors.light.primary,
                            theme.colors.light.primary_dark,
                        ]}
                        style={globalStyles.heroCard}
                    >
                        <View style={globalStyles.bgCircleLarge} />
                        <View style={globalStyles.bgCircleSmall} />

                        <View style={globalStyles.cardRow}>
                            <CText style={globalStyles.heroLabel}>Overview</CText>
                            <View style={globalStyles.cardRow}>
                                <CText style={globalStyles.heroLabel}>Avg TAT (hrs) </CText>
                                <CText fontSize={20} style={{ color: '#fff'}} fontStyle={'SB'}>{userData?.avgTatHours}</CText>
                            </View>
                        </View>

                        <View style={globalStyles.heroTopRow}>
                            <View style={globalStyles.heroTopItem}>
                                <CText style={globalStyles.heroValue} fontSize={30}>
                                    {formatNumber(userData?.totalLogs || 0)}
                                </CText>
                                <CText style={globalStyles.heroSub}>Total Logs</CText>
                            </View>

                            <View style={globalStyles.heroTopItem}>
                                <CText style={globalStyles.heroValue}  fontSize={30}>
                                    {formatNumber(
                                        userData?.stats?.totalCount || 0
                                    )}
                                </CText>
                                <CText style={globalStyles.heroSub}>Total Documents</CText>
                            </View>
                        </View>

                        <View style={globalStyles.heroDivider} />

                        <View style={globalStyles.heroStatsRow}>
                            {[
                                {
                                    label: 'Incoming',
                                    value: userData?.stats?.Incoming,
                                },
                                {
                                    label: 'Completed',
                                    value: userData?.stats?.Done,
                                },
                                {
                                    label: 'Outgoing',
                                    value: userData?.stats?.Outgoing,
                                },
                                {
                                    label: 'Overdue',
                                    value: userData?.stats?.Overdue,
                                },
                            ].map((item, idx) => (
                                <View key={idx} style={globalStyles.heroStat}>
                                    <CText style={globalStyles.heroStatValue}>
                                        {formatNumber(item.value || 0)}
                                    </CText>
                                    <CText style={globalStyles.heroStatLabel}>
                                        {item.label}
                                    </CText>
                                </View>
                            ))}
                        </View>
                    </LinearGradient>
                </View>

                <View style={[globalStyles.card, {marginHorizontal: 0}]}>
                    <CText style={styles.section} fontStyle={'SB'}>Account Details</CText>
                    <View style={styles.infoRow}>
                        <CText>Email</CText>
                        <CText>{userDetails.email}</CText>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 14,
        paddingTop: 10,
    },

    profileHeader: {
        alignItems: "center",
        marginBottom: 24,
    },

    profileAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#eee",
        marginBottom: 12,
    },

    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: "uppercase",
    },

    profileEmail: {
        fontSize: 13,
        color: "#666",
        marginTop: 2,
    },

    card: {
        backgroundColor: theme.colors.light.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },

    section: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 12,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E5EA",
    },
});
