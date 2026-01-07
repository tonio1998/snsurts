import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Image,
    StatusBar,
    Platform,
    Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme';
import { globalStyles } from '../../theme/styles';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, FILE_BASE_URL } from '../../../env';
import { navigate } from '../../utils/navigation';
import { CText } from '../common/CText';
import { getAcademicInfo } from '../../utils/getAcademicInfo';
import { formatAcad, getDisplayName } from '../../utils/format';
import Icon from "react-native-vector-icons/Ionicons";
import { BlurView } from "@react-native-community/blur";
import { isTablet } from "../../utils/responsive";
import { getGreeting } from "../../utils/greetings";
import {useFiscalYear} from "../../context/FiscalYearContext.tsx";

const generateCircles = (count = 3) => {
    const fixedPositions = [
        { top: 20, left: 20 },
        { top: 20, left: 100 },
        { top: 10, left: 200 },
        { top: 20, left: 250 },
    ];

    return Array.from({ length: count }).map((_, index) => {
        const size = Math.floor(Math.random() * 40) + 70;
        const { top, left } = fixedPositions[index] || { top: 0, left: 0 };
        return { key: `circle-${index}`, size, top, left };
    });
};


const CustomHomeHeader = ({ title = '', leftContent = null, rightContent = null }) => {
    const navigation = useNavigation();
    const { fiscalYear } = useFiscalYear();
    const { user } = useAuth();
    const [acad, setAcad] = useState(null);
    const circles = useMemo(() => generateCircles(), []);

    const fadeAnim = useMemo(() => new Animated.Value(0), []);
    const scaleAnim = useMemo(() => new Animated.Value(0.8), []);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const acadInfo = await getAcademicInfo();
                setAcad(acadInfo);
                console.log("acadInfo", acadInfo);
            })();

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();
        }, [fadeAnim, scaleAnim])
    );

    const handleProfile = () => navigate('Profile');
    const handleAcad = () => navigation.navigate('AcademicYear');

    return (
        <>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent={true}
                hidden={false}
            />

            <View style={styles.headerWrapper}>
                <View style={styles.headerContent}>
                    {/*<View style={styles.leftSection}>*/}
                    {/*    <Image*/}
                    {/*        source={require('../../../assets/img/ic_launcher.png')}*/}
                    {/*        style={{ width: 50, height: 50 }}*/}
                    {/*    />*/}
                    {/*</View>*/}
                    <View style={styles.rightSection}>
                        <TouchableOpacity
                            onPress={handleAcad}
                            style={styles.acadBtn}
                            activeOpacity={0.85}
                        >
                            <Icon name={'calendar-outline'} size={22} color={theme.colors.light.primary} />
                            <CText style={styles.acadText} fontStyle={'SB'} fontSize={16}>FY {fiscalYear}</CText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.leftSection} onPress={handleProfile}
                                          activeOpacity={0.8}>
                            <View
                                style={styles.avatarWrapper}
                            >
                                <Image
                                    source={
                                        user?.profile_pic
                                            ? { uri: `${FILE_BASE_URL}/${user.profile_pic}` }
                                            : user?.avatar
                                                ? { uri: user.avatar }
                                                : {
                                                    uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        user?.name || 'User'
                                                    )}&background=random`,
                                                }
                                    }
                                    style={styles.avatar}
                                />
                            </View>
                            {/*<View style={{ marginLeft: 10 }}>*/}
                            {/*    <CText fontSize={15} style={{ color: theme.colors.light.text }} fontStyle="SB">{getDisplayName(user?.name)}</CText>*/}
                            {/*    <View>*/}
                            {/*        <CText fontSize={12} style={{ flex: 1, color: theme.colors.light.text }} fontStyle="SB">{user?.email}</CText>*/}
                            {/*    </View>*/}
                            {/*</View>*/}
                        </TouchableOpacity>
                        {rightContent}
                    </View>
                </View>
            </View>

        </>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
        height: '40%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: -9,
    },

    gradientBg: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,   // adjust for intensity
    },

    fadeOverlay: {
        ...StyleSheet.absoluteFillObject,
    },

    blur: {
        ...StyleSheet.absoluteFillObject,
    },
    headerWrapper: {
        position: 'absolute',
        top: Platform.OS === 'android' ? ((StatusBar.currentHeight + 5) || 24) : 44,
        left: '0%',
        right: '0%',
        borderRadius: 100,
        overflow: 'hidden',
        zIndex: 1,
        // backgroundColor: theme.colors.light.primary + '11',
        // marginHorizontal: 10,
    },
    headerContent: {
        paddingHorizontal: 0,
        paddingVertical: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    circle: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    header: {
        position: 'absolute',
        top: Platform.OS === 'android' ? ((StatusBar.currentHeight) || 24) : 44,
        left: '3%',
        right: '3%',
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2,
        borderRadius: 100,
        backgroundColor: theme.colors.light.card,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        // flex: 1,
        // backgroundColor: theme.colors.light.card,
        padding: 2,
        marginHorizontal: 0,
        borderRadius: 100,
        marginRight: 14,
    },
    appName: {
        color: theme.colors.light.card,
        marginRight: 10,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    acadBtn: {
        paddingHorizontal: 15,
        paddingVertical: 7,
        borderRadius: 30,
        borderWidth: 0,
        backgroundColor: theme.colors.light.primary + '20',
        // marginRight: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10
    },
    acadText: {
        color: theme.colors.light.primary,
        marginLeft: 10,
        fontWeight: '600',
    },
    avatarWrapper: {
        width: 40,
        height: 40,
        borderRadius: 21,
        borderColor: theme.colors.light.primary,
        overflow: 'hidden',
        borderWidth: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
});

export default CustomHomeHeader;
