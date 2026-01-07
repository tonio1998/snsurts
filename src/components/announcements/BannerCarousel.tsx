import React, {useEffect, useState, useRef, useCallback} from "react";
import {
    Animated,
    View,
    Image,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    Easing,
    Linking,
    RefreshControl,
    ScrollView,
    ActivityIndicator, ImageBackground,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { getAnnouncements } from "../../api/modules/announcements.ts";
import { theme } from "../../theme";
import { CText } from "../common/CText.tsx";
import { globalStyles } from "../../theme/styles.ts";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActivityIndicator2 from "../loaders/ActivityIndicator2.tsx";
import {isTablet} from "../../utils/responsive";

const { width } = Dimensions.get("window");

const ANNOUNCEMENTS_CACHE_KEY = "announcements";

export default function BannerCarousel({ loading }) {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<Animated.ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTouched, setIsTouched] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchAnnouncements = async() => {
        try {
            const data = await getAnnouncements();
            if (data) {
                setAnnouncements(data);
                // console.log("🔍 Fetching announcements from cache", JSON.parse(data));
                await AsyncStorage.setItem(ANNOUNCEMENTS_CACHE_KEY, JSON.stringify(data));
            }
        } catch (err) {
            console.error("Fetch error:", err);
            const cachedData = await AsyncStorage.getItem(ANNOUNCEMENTS_CACHE_KEY);
            if (cachedData) setAnnouncements(JSON.parse(cachedData));
        } finally {
            setRefreshing(false);
        }
    };


    const localAnnouncements = useCallback(async () => {
        try {
            const cachedData = await AsyncStorage.getItem(ANNOUNCEMENTS_CACHE_KEY);
            if (cachedData) {
                setAnnouncements(JSON.parse(cachedData));
                fetchAnnouncements();
            } else {
                fetchAnnouncements();
            }
        } catch (err) {}
    }, []);

    useEffect(() => {
        localAnnouncements();
        console.log("🔍 Local announcements", announcements);
    }, []);

    useEffect(() => {
        if (announcements.length === 0) return;

        const interval = setInterval(() => {
            if (!isTouched) {
                const nextIndex = (currentIndex + 1) % announcements.length;
                setCurrentIndex(nextIndex);

                Animated.timing(scrollX, {
                    toValue: nextIndex * (width * 0.9 + 16),
                    duration: 1600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }).start(() => {
                    scrollRef.current?.scrollTo({
                        x: nextIndex * (width * 0.9 + 16),
                        animated: true,
                    });
                });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [currentIndex, announcements, isTouched]);


    const Banner = ({ a }) => {
        return (
            <View style={styles.container}>
                <ImageBackground
                    source={{ uri: a.image_url }}
                    style={styles.background}
                    blurRadius={10}
                    resizeMode="cover"
                />
                <Image
                    source={{ uri: a.image_url }}
                    style={styles.foreground}
                    resizeMode="contain"
                />
            </View>
        );
    };

    return (
        <>
            {loading && (
                <ActivityIndicator2 />
            )}
            <Animated.ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
                scrollEventThrottle={16}
                onTouchStart={() => setIsTouched(true)}
                onTouchEnd={() => setIsTouched(false)}
                onScrollBeginDrag={() => setIsTouched(true)}
                onScrollEndDrag={() => setIsTouched(false)}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchAnnouncements();
                        }}
                        colors={[theme.colors.light.primary]}
                    />
                }
            >
                {announcements.map((a) => (
                    <TouchableOpacity
                        key={a.id}
                        activeOpacity={0.9}
                        onPress={() => {
                            if (a.cta_action === "url" && a.cta_target) {
                                Linking.openURL(a.cta_target).catch((err) =>
                                    console.error("Failed to open URL:", err)
                                );
                            }
                            if (a.cta_action === "route" && a.cta_target) {
                                try {
                                    navigation.navigate(a.cta_target as never);
                                } catch (err) {
                                    console.error("Navigation error:", err);
                                }
                            }
                        }}
                    >
                        {a.image_url ? (
                            <Image
                                source={{ uri: a.image_url }}
                                style={[
                                    styles.bannerImage,
                                    {
                                        width: isTablet() ? width * 0.3 : width,
                                    }
                                ]}
                                resizeMode="contain"
                            />
                        ) : (
                            <LinearGradient
                                colors={[theme.colors.light.primary + "99", theme.colors.light.primary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.gradientBanner}
                            >
                                <View style={{ marginTop: 5 }}>
                                    <View style={{ width: width - 200 }}>
                                        <CText fontSize={19} numberOfLines={2} fontStyle={"SB"} style={[globalStyles.shadowText, { color: "#fff" }]}>
                                            {a.title}
                                        </CText>
                                        <CText fontSize={12} numberOfLines={3} fontStyle={"SB"} style={[globalStyles.shadowText, { color: "#fff" }]}>
                                            {a.body}
                                        </CText>
                                    </View>
                                </View>
                                {a.cta_target && (
                                    <View style={{ position: "absolute", bottom: 15, left: 10 }}>
                                        <View
                                            style={{
                                                backgroundColor: theme.colors.light.card,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                borderRadius: theme.radius.sm,
                                                paddingHorizontal: 15,
                                                paddingVertical: 5,
                                            }}
                                        >
                                            <CText fontSize={15} fontStyle={"SB"} style={{ color: "#000", marginRight: 5 }}>
                                                {a.cta_text}
                                            </CText>
                                            <Icon name="arrow-forward" size={20} color="#000" />
                                        </View>
                                    </View>
                                )}
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                ))}
            </Animated.ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    foreground: {
        width: '80%',
        height: '80%',
    },
    scrollContainer: {
        flexDirection: "row",
        gap: 16,
        paddingHorizontal: 10,
        paddingBottom: 15,
        // backgroundColor: theme.colors.light.primary_light,
    },
    bannerImage: {
        // width: isTablet() ? width * 0.3 : width ,
        height: 230,
        borderRadius: theme.radius.sm,
        elevation: 10,
        backgroundColor: theme.colors.light.card,
        shadowColor: theme.colors.light.primary,
        shadowOpacity: 0.8,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
    },
    gradientBanner: {
        marginHorizontal: 10,
        borderRadius: theme.radius.sm,
        padding: 10,
        height: 200,
        width: width * 0.9,
        overflow: "hidden",
        elevation: 10,
        shadowColor: theme.colors.light.primary,
        shadowOpacity: 0.8,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
    },
});
