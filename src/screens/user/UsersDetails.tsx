import {
    SafeAreaView,
    StyleSheet,
    View,
    Image,
    ScrollView,
    RefreshControl, ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import LinearGradient from "react-native-linear-gradient";

import { globalStyles } from "../../theme/styles";
import { theme } from "../../theme";
import { CText } from "../../components/common/CText";
import UnauthorizedView from "../../components/UnauthorizedView";
import BackHeader from "../../components/layout/BackHeader";

import { useAccess } from "../../hooks/useAccess";
import { useAuth } from "../../context/AuthContext";
import { useFiscalYear } from "../../context/FiscalYearContext";

import {getUserData, getUserDetails} from "../../api/modules/userApi";
import { handleApiError } from "../../utils/errorHandler";
import { formatNumber } from "../../utils/format";

import { FILE_BASE_URL } from "../../../env";
import {loadUserFromCache, saveUserToCache} from "../../services/cache/userCache.ts";
import CButton from "../../components/buttons/CButton.tsx";
import {AsyncValue} from "../../components/AsyncValue.tsx";

export default function UsersDetails({ route, navigation }) {
    const { user } = useAuth();
    const { hasRole } = useAccess();
    const { fiscalYear } = useFiscalYear();

    const userDetails = route.params?.item;

    const [userData, setUserData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadUserDetails = async (id, force = false) => {
        try {
            if (!force) {
                const cached = await loadUserFromCache(id);
                if (cached) {
                    setUserData(cached);
                }
            }

            const fresh = await getUserData(id);
            console.log(fresh);
            setUserData(fresh);
            await saveUserToCache(id, fresh);
        } catch (e) {
            handleApiError(e, "Failed to load user details");
        }
    };

    useEffect(() => {
        if (userDetails?.id && user?.id) {
            loadUserDetails(userDetails.id);
        }
    }, [userDetails?.id, user?.id]);

    const onRefresh = async () => {
        if (!userDetails?.id) return;
        setRefreshing(true);
        await loadUserDetails(userDetails.id, true);
        setRefreshing(false);
    };

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
            <BackHeader />

            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.light.primary}
                    />
                }
            >
                <View style={styles.profileHeader}>
                    <Image
                        source={
                            userDetails?.profile_pic
                                ? { uri: `${FILE_BASE_URL}/${userDetails.profile_pic}`, cache: "force-cache" }
                                : userDetails?.avatar
                                    ? { uri: userDetails.avatar, cache: "force-cache" }
                                    : {
                                        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                            userDetails?.name || "User"
                                        )}&background=random`,
                                        cache: "force-cache",
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

                    {/*<View style={globalStyles.mt_3}>*/}
                    {/*    <CButton*/}
                    {/*        type="secondary"*/}
                    {/*        icon="chatbubble-ellipses"*/}
                    {/*        title="Chat"*/}
                    {/*        onPress={() =>*/}
                    {/*            navigation.navigate("ChatRoom", {*/}
                    {/*                id: userDetails.id,*/}
                    {/*                item: userDetails,*/}
                    {/*            })*/}
                    {/*        }*/}
                    {/*    />*/}
                    {/*</View>*/}
                </View>


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
                            <CText style={globalStyles.heroLabel}>
                                Avg TAT (hrs)
                            </CText>

                            <AsyncValue
                                value={userData?.avgTatHours}
                                textStyle={{ color: '#fff', fontSize: 20, marginLeft: 10 }}
                            />
                        </View>
                    </View>

                    <View style={globalStyles.heroTopRow}>
                        <View style={globalStyles.heroTopItem}>
                            <AsyncValue
                                value={userData?.totalLogs}
                                formatter={formatNumber}
                                textStyle={{ color: '#fff', fontSize: 20, marginLeft: 10, fontWeight: 'bold' }}
                            />
                            <CText style={globalStyles.heroSub}>
                                Total Logs
                            </CText>
                        </View>

                        <View style={globalStyles.heroTopItem}>
                            <AsyncValue
                                value={userData?.stats?.totalCount}
                                formatter={formatNumber}
                                textStyle={{ color: '#fff', fontSize: 20, marginLeft: 10, fontWeight: 'bold' }}
                            />
                            <CText style={globalStyles.heroSub}>
                                Total Documents
                            </CText>
                        </View>
                    </View>

                    <View style={globalStyles.heroDivider} />

                    <View style={globalStyles.heroStatsRow}>
                        {[
                            { label: 'Incoming', value: userData?.stats?.Incoming || 0 },
                            { label: 'Completed', value: userData?.stats?.Done  || 0},
                            { label: 'Outgoing', value: userData?.stats?.Outgoing  || 0},
                            { label: 'Overdue', value: userData?.stats?.Overdue   || 0},
                        ].map((item, idx) => (
                            <View key={idx} style={globalStyles.heroStat}>
                                <AsyncValue
                                    value={item.value}
                                    formatter={formatNumber}
                                    textStyle={globalStyles.heroStatValue}
                                />
                                <CText style={globalStyles.heroStatLabel}>
                                    {item.label}
                                </CText>
                            </View>
                        ))}
                    </View>
                </LinearGradient>



                <View style={[globalStyles.card, { marginHorizontal: 0 }]}>
                    <CText style={styles.section} fontStyle={"SB"}>
                        Account Details
                    </CText>

                    <View style={styles.infoRow}>
                        <CText>Email</CText>
                        <CText>{userDetails.email}</CText>
                    </View>
                </View>
            </ScrollView>
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
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    profileEmail: {
        fontSize: 13,
        color: "#666",
        marginTop: 2,
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
