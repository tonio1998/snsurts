import 'react-native-reanimated';
import 'react-native-gesture-handler';
import {LoadingProvider} from "./src/context/LoadingContext.tsx";
import {CAlert} from "./src/components/CAlert.tsx";
import NetworkProvider from "./src/context/NetworkContext.tsx";
import {AuthProvider, useAuth} from "./src/context/AuthContext.tsx";
import StatusIndicator from "./src/components/StatusIndicator.tsx";
import {LogBox, StatusBar, Vibration} from "react-native";
import {theme} from "./src/theme";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {AccessProvider} from "./src/context/AccessContext.tsx";
import {NavigationContainer} from "@react-navigation/native";
import {navigationRef} from "./src/utils/navigation.ts";
import {tryFlushPendingNavigation} from "./src/hooks/RootNavigation.ts";
import BottomTabNav from "./src/navigation/BottomTabNav.tsx";
import SplashScreen from "./src/Shared/SplashScreen.tsx";
import {useEffect, useState} from "react";
import {handleNotificationNavigation} from "./src/utils/handleNotificationNavigation.ts";
import notificationEmitter from "./src/utils/notificationEmitter.ts";
import {
    getInitialNotification,
    getMessaging,
    onMessage,
    onNotificationOpenedApp
} from "@react-native-firebase/messaging";
import Toast from "react-native-toast-message";
import {triggerAllSyncs} from "./src/utils/sqlite/syncManager";
import NetInfo from "@react-native-community/netinfo";
import SigninForm from "./src/Shared/Auth/SigninForm.tsx";
import LoginOptionsScreen from "./src/Shared/Auth/LoginOptionsScreen.tsx";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import UserProfileScreen from "./src/Shared/User/UserProfileScreen.tsx";
import TrackingBottomTabNav from "./src/navigation/TrackingBottomTabNav.tsx";
import AddRecordScreen from "./src/screens/Records/AddRecordScreen.tsx";
import ScannerValidator from './src/screens/Scanner/ScannerValidator.tsx';
import {GestureHandlerRootView} from "react-native-gesture-handler";
import AcademicYearScreen from "./src/Shared/AcademicYearScreen.tsx";
import {FiscalYearProvider} from "./src/context/FiscalYearContext.tsx";
import {useAccess} from "./src/hooks/useAccess.ts";
import AnauthorizedScreen from "./src/Shared/Anauthorized.tsx";
import UsersDetails from "./src/screens/user/UsersDetails.tsx";
const Stack = createNativeStackNavigator();
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

const UnauthenticatedStack = () => (
    <>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LoginOptions" component={LoginOptionsScreen} />
            <Stack.Screen name="Login" component={SigninForm} />
        </Stack.Navigator>
    </>
);

const AppNavigator = () => {
    const { user } = useAuth();
    const { hasRole } = useAccess();
    const [splashVisible, setSplashVisible] = useState(true);

    useEffect(() => {
        const unsubscribeNetInfo = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                triggerAllSyncs();
            }
        });

        const setupFCM = async () => {
            const app = getMessaging();

            onMessage(app, async remoteMessage => {
                console.log('Foreground notification:', remoteMessage);
                Vibration.vibrate([200]);

                Toast.show({
                    type: 'success',
                    text1: remoteMessage.notification?.title || 'New Message',
                    text2: remoteMessage.notification?.body || '',
                    position: 'top',
                    autoHide: true,
                    visibilityTime: 4000,
                    topOffset: 50,
                });

                if (remoteMessage?.data) {
                    notificationEmitter.emit('newMessage', remoteMessage.data);
                    handleNotificationNavigation(remoteMessage.data);
                }
            });

            onNotificationOpenedApp(app, remoteMessage => {
                if (remoteMessage?.data) {
                    console.log('onNotificationOpenedApp:', remoteMessage.data);
                    Vibration.vibrate([500, 1000, 500]);
                    notificationEmitter.emit('newMessage', remoteMessage.data);
                    handleNotificationNavigation(remoteMessage.data);
                }
            });

            const initialMessage = await getInitialNotification(app);
            if (initialMessage?.data) {
                const interval = setInterval(() => {
                    if (navigationRef.isReady()) {
                        console.log('Initial notification:', initialMessage.data);
                        notificationEmitter.emit('newMessage', initialMessage.data);
                        handleNotificationNavigation(initialMessage.data);
                        clearInterval(interval);
                    }
                }, 200);
            }
        };

        setupFCM();

        // Cleanup
        return () => {
            unsubscribeNetInfo();
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setSplashVisible(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (splashVisible) return <SplashScreen />;

    if (!user) {
        return (
            <>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <NavigationContainer>
                        <UnauthenticatedStack />
                    </NavigationContainer>
                </GestureHandlerRootView>
            </>
        );
    }

    return (
        <>
            <SafeAreaProvider>
                <AccessProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <NavigationContainer ref={navigationRef} onReady={tryFlushPendingNavigation}>
                            <Stack.Navigator screenOptions={{ headerShown: false }}>
                                <Stack.Screen
                                    name="MainTabs"
                                    component={BottomTabNav}
                                />
                                <Stack.Screen
                                    name="ScanQRDetails"
                                    component={TrackingBottomTabNav}
                                />
                                <Stack.Screen
                                    name="AddRecord"
                                    component={AddRecordScreen}
                                />
                                <Stack.Screen
                                    name="ScannerValidator"
                                    component={ScannerValidator}
                                />
                                <Stack.Screen
                                    name="Profile"
                                    component={UserProfileScreen}
                                />
                                <Stack.Screen
                                    name="AcademicYear"
                                    component={AcademicYearScreen}
                                />
                                <Stack.Screen name="UserDetails" component={UsersDetails} />
                                {/*{hasRole('STUD') ? (*/}
                                {/*    <Stack.Screen*/}
                                {/*        name="Unauthorized"*/}
                                {/*        component={AnauthorizedScreen}*/}
                                {/*    />*/}
                                {/*) : (*/}
                                {/*    <>*/}
                                {/*        <Stack.Screen*/}
                                {/*            name="MainTabs"*/}
                                {/*            component={BottomTabNav}*/}
                                {/*        />*/}
                                {/*        <Stack.Screen*/}
                                {/*            name="ScanQRDetails"*/}
                                {/*            component={TrackingBottomTabNav}*/}
                                {/*        />*/}
                                {/*        <Stack.Screen*/}
                                {/*            name="AddRecord"*/}
                                {/*            component={AddRecordScreen}*/}
                                {/*        />*/}
                                {/*        <Stack.Screen*/}
                                {/*            name="ScannerValidator"*/}
                                {/*            component={ScannerValidator}*/}
                                {/*        />*/}
                                {/*        <Stack.Screen*/}
                                {/*            name="Profile"*/}
                                {/*            component={UserProfileScreen}*/}
                                {/*        />*/}
                                {/*        <Stack.Screen*/}
                                {/*            name="AcademicYear"*/}
                                {/*            component={AcademicYearScreen}*/}
                                {/*        />*/}
                                {/*    </>*/}
                                {/*)}*/}
                            </Stack.Navigator>

                        </NavigationContainer>
                    </GestureHandlerRootView>
                </AccessProvider>
            </SafeAreaProvider>
        </>
    );
};

export default function App(): React.JSX.Element {
    return (
        <LoadingProvider>
            <CAlert>
                <NetworkProvider>
                    <AuthProvider>
                        <FiscalYearProvider>
                            <AppNavigator />
                        </FiscalYearProvider>
                    </AuthProvider>
                    <StatusIndicator />
                </NetworkProvider>
            </CAlert>
        </LoadingProvider>
    );
}
