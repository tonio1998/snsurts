import React, {useCallback, useEffect, useState} from 'react';
import {
	View,
	Text,
	StyleSheet,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	SafeAreaView,
	ImageBackground,
	Alert,
	Dimensions, StatusBar,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {useFocusEffect, useNavigation, useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { loginWithBiometric } from '../../hooks/useBiometrics.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLoading } from '../../context/LoadingContext.tsx';
import { authLogin, loginWithGoogle } from '../../api/modules/auth.ts';
import checkBiometricSupport from '../../services/checkBiometricSupport.ts';
import { CText } from '../../components/common/CText.tsx';
import { handleApiError } from '../../utils/errorHandler.ts';
import * as Keychain from 'react-native-keychain';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { APP_NAME, GOOGLE_CLIENT_ID, TAGLINE } from '../../../env.ts';
import LinearGradient from "react-native-linear-gradient";
import useResponsive from "../../hooks/useResponsive";
import {isPhone, isTablet} from "../../utils/responsive";
import {useAlert} from "../../components/CAlert.tsx";
import {globalStylesDark} from "../../theme/darkstyles.ts";
import {globalStyles} from "../../theme/styles.ts";
const { width } = Dimensions.get('window');

GoogleSignin.configure({
	webClientId: GOOGLE_CLIENT_ID,
	offlineAccess: true,
	scopes: [
		'https://www.googleapis.com/auth/calendar',
		'https://www.googleapis.com/auth/calendar.events',
		'profile',
		'email',
	],
});
export default function LoginOptionsScreen() {
	const { themes, toggleTheme } = useTheme();
	const navigation = useNavigation();
	const { user } = useAuth();
	const { loginAuth } = useAuth();
	const { showAlert } = useAlert();
	const { showLoading, hideLoading } = useLoading();
	const [loading, setLoading] = useState(false);
	const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
	const [version, setVersion] = useState('');


	useEffect(() => {
		const appVersion = DeviceInfo.getVersion();
		setVersion(appVersion);

	}, []);

	useFocusEffect(
		useCallback(() => {
			StatusBar.setBarStyle('light-content');
			StatusBar.setBackgroundColor('#1e1e1e');
			return () => {
				StatusBar.setBarStyle('dark-content');
				StatusBar.setBackgroundColor('#ffffff');
			};
		}, [])
	);

	useEffect(() => {
		(async () => {
			const email = await AsyncStorage.getItem('biometricUserEmail');
			const flagKey = `biometricEnabled:${email}`;
			const flag = await AsyncStorage.getItem(flagKey);
			const result = await checkBiometricSupport();
			setIsBiometricEnabled(result.supported && flag === 'true');
		})();
	}, []);

	const handleBiometricLogin = async () => {
		try {

			const session = await loginWithBiometric();
			if (session) {
				showLoading('Logging in...');

				await new Promise(resolve => setTimeout(resolve, 1500));

				await loginAuth(session);
				console.log("response", session);
				await AsyncStorage.setItem('isLoggedIn', 'true');
				await AsyncStorage.setItem('mobile', session.token);
			}
		} catch (err) {
			handleApiError(err, 'Biometric');
		} finally {
			hideLoading();
		}
	};


	const handleGoogleLogin = async () => {
		try {
			await GoogleSignin.hasPlayServices();
			await GoogleSignin.signOut();

			const userInfo = await GoogleSignin.signIn();
			const tokens = await GoogleSignin.getTokens();

			const accessToken = tokens.accessToken;
			const idToken = tokens.idToken;
			const user = userInfo?.data?.user;

			if (!accessToken) throw new Error('No access token retrieved from Google Sign-In.');

			showLoading('Logging in...');

			await AsyncStorage.setItem(`googleAccessToken_${user.email}`, accessToken);

			const response = await loginWithGoogle({
				token: idToken,
				name: user.name,
				email: user.email,
				photo: user.photo,
			});

			console.log('Backend login response:', response);

			await loginAuth(response.data);
		} catch (error) {
			console.error('Google login failed:', error.response?.data || error.message);

			const message =
				error?.response?.data?.message ||
				error?.message ||
				'Something went wrong during Google login.';

			showAlert('error', 'Error', message);
			handleApiError(error, 'Google Login');
		} finally {
			hideLoading();
		}
	};


	const AuthContent = () => (
		<>
			<CText style={styles.loginLabel} fontStyle="" fontSize={16}>
				Sign in to continue
			</CText>

			<TouchableOpacity style={styles.authButton} onPress={handleGoogleLogin}>
				<Icon name="logo-google" size={22} color="#DB4437" />
				<CText style={styles.authText}>Continue with Google</CText>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.authButtonOutline}
				onPress={() => navigation.navigate('Login')}
			>
				<Icon name="key-outline" size={22} color="#fff" />
				<CText style={styles.authTextWhite}>Login with Password</CText>
			</TouchableOpacity>

			{isBiometricEnabled && (
				<TouchableOpacity
					onPress={handleBiometricLogin}
					style={styles.fingerprint}
				>
					<Icon
						name="finger-print-outline"
						size={40}
						color="#fff"
						style={{
							textShadowColor: 'rgba(255,255,255,0.6)',
							textShadowOffset: { width: 0, height: 0 },
							textShadowRadius: 10,
						}}
					/>
					<CText style={styles.bioText}>Use Biometrics</CText>
				</TouchableOpacity>
			)}

			<View style={styles.footer}>
				<CText fontSize={11} style={styles.footerText}>
					Developed by SNSU - ICT fgWorkz
				</CText>
				<CText fontSize={11} style={styles.footerText}>
					Version {version } • © 2025 All rights reserved
				</CText>
			</View>
		</>
	);

	{isPhone() ? (
		<LinearGradient
			colors={[
				'transparent',
				theme.colors.light.secondary,
				theme.colors.light.secondary,
				theme.colors.light.primary,
			]}
			style={styles.authSection}
		>
			<AuthContent />
		</LinearGradient>
	) : (
		<View style={styles.authSection}>
			<AuthContent />
		</View>
	)}


	return (
		<>
			<StatusBar
				barStyle="light-content"
				backgroundColor="transparent"
				translucent={true}
				hidden={false}
			/>

			<SafeAreaView style={[styles.container,
				themes === "dark" ? globalStylesDark.safeArea : '',
				{
					backgroundColor: theme.colors.light.background,
				}
			]}>
				<LinearGradient
					colors={[theme.colors.light.primary, theme.colors.light.primary]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={StyleSheet.absoluteFill}
				/>

				<ImageBackground
					source={require('../../../assets/img/app.png')}
					style={styles.container}
					imageStyle={{ opacity: 1 }}
					resizeMode="cover"
				>
					<View style={styles.wrapper}>
						<View style={styles.center}>
							<Image
								source={require('../../../assets/img/ic_launcher.png')}
								style={styles.logo}
							/>

							<CText fontSize={42} fontStyle="SB" style={[globalStyles.whiteText, globalStyles.shadowText]}>
								{APP_NAME}
							</CText>

							<CText fontSize={13} fontStyle="R" style={styles.tagline}>
								{TAGLINE}
							</CText>
						</View>

						{isPhone() ? (
							<View
								style={styles.authSection}
							>
								<AuthContent />
							</View>
						) : (
							<View style={styles.authSection}>
								<AuthContent />
							</View>
						)}
					</View>
				</ImageBackground>
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: 'center',
	},
	authButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: theme.radius.sm,
		// width: width * 0.8,
		elevation: 4,
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 3 },

	},
	authButtonOutline: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: '#fff',
		borderWidth: 1,
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: theme.radius.sm,
		width: width * 0.8,
		backgroundColor: 'rgba(255,255,255,0.05)',
	},
	container: {
		flex: 1,
		// backgroundColor: theme.colors.light.primary,
	},
	wrapper: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 70,
		paddingHorizontal: 28,
		width: isTablet() ? '50%' : '100%',
		maxWidth: isTablet() ? '100%' : '100%',
		alignSelf: 'center',
	},
	header: {
		alignItems: 'center',
	},
	logo: {
		width: 90,
		height: 90,
		marginBottom: 12,
	},
	appName: {
		color: '#fff',
		textAlign: 'center',
		marginBottom: 4,
	},
	tagline: {
		color: '#fff',
		textAlign: 'center',
	},
	authSection: {
		alignItems: 'center',
		gap: 16,
		alignSelf: 'center',
		...(isTablet() && {
			width: '100%',
			position: 'absolute',
			bottom: '20%',
			// left: '10%',
			// right: '10%',
			maxWidth: '120%',
			// backgroundColor: theme.colors.light.primary,
		}),
		...(isPhone() && {
			position: 'absolute',
			bottom: -20,
			left: 0,
			right: 0,
			maxWidth: '120%',
			// backgroundColor: theme.colors.light.primary,
			borderRadius: theme.radius.sm,
			marginBottom: 10,
			zIndex: 10,
			padding: 45,
			paddingTop: 100,
			paddingBottom: 30,
		}),
	},
	loginLabel: {
		color: '#fff',
		marginBottom: 10,
	},
	authButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#fff',
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: theme.radius.sm,
		width: isTablet() ? '80%' : width * 0.8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 6,
		elevation: 2,
	},
	authButtonOutline: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: '#fff',
		borderWidth: 1,
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: theme.radius.sm,
		textAlign: 'center',
		// width: width * 0.8,
		width: isTablet() ? '80%' : width * 0.8,
	},
	authText: {
		marginLeft: 10,
		fontWeight: '600',
		color: '#333',
		fontSize: 15,
	},
	authTextWhite: {
		marginLeft: 10,
		fontWeight: '600',
		color: '#fff',
		fontSize: 15,
	},
	fingerprint: {
		alignItems: 'center',
		marginTop: 0,
		marginBottom: 20,
	},
	bioText: {
		marginTop: 8,
		color: '#fff',
		fontSize: 14,
	},
	loadingContainer: {
		alignItems: 'center',
	},
	loadingText: {
		color: '#fff',
		marginTop: 10,
		fontSize: 15,
	},
	footer: {
		alignItems: 'center',
		marginTop: 10,
		marginBottom: 30,
	},
	footerText: {
		color: '#fff',
		textAlign: 'center',
	},
});
