import React, { useContext, useEffect, useState } from 'react';
import {
	View,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	KeyboardAvoidingView,
	SafeAreaView,
	Platform,
	Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { NetworkContext } from '../../context/NetworkContext';
import { loginWithBiometric } from '../../hooks/useBiometrics';
import { authLogin, loginWithGoogle } from '../../api/modules/auth';
import { theme } from '../../theme';
import { CText } from '../../components/common/CText';
import BackHeader from '../../components/layout/BackHeader';
import checkBiometricSupport from '../../services/checkBiometricSupport';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ID } from '../../../env';
import { handleApiError } from '../../utils/errorHandler';

GoogleSignin.configure({
	webClientId: GOOGLE_CLIENT_ID,
	offlineAccess: true,
});

const SigninForm = ({ navigation }: any) => {
	const { isOnline } = useContext(NetworkContext);
	const { loginAuth } = useAuth();
	const { showLoading, hideLoading } = useLoading();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

	useEffect(() => {
		(async () => {
			const storedEmail = await AsyncStorage.getItem('biometricUserEmail');
			const supported = await checkBiometricSupport();
			const flag = await AsyncStorage.getItem(`biometricEnabled:${storedEmail}`);
			setIsBiometricEnabled(supported.supported && flag === 'true');
			await restoreSession();
		})();
	}, []);

	const restoreSession = async () => {
		try {
			const cached = await Keychain.getGenericPassword();
			if (!cached) return;
			const user = JSON.parse(cached.username);
			const token = await AsyncStorage.getItem('mobile');
			await loginAuth({
				user,
				token,
				roles: user.roles,
				permissions: user.permissions,
			});
		} catch {}
	};

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert('Missing Information', 'Please enter email and password.');
			return;
		}
		try {
			showLoading('Signing in...');
			const res = await authLogin({ email, password });
			await loginAuth(res.data);
		} catch (err) {
			handleApiError(err, 'Login');
		} finally {
			hideLoading();
		}
	};

	const handleBiometricLogin = async () => {
		try {
			const session = await loginWithBiometric();
			if (session) await loginAuth(session);
		} catch (err) {
			handleApiError(err, 'Biometric');
		}
	};

	const handleGoogleLogin = async () => {
		try {
			await GoogleSignin.hasPlayServices();
			await GoogleSignin.signOut();
			const info = await GoogleSignin.signIn();
			showLoading('Signing in...');
			const res = await loginWithGoogle({
				token: info.data?.idToken,
				name: info.data?.user?.name,
				email: info.data?.user?.email,
				photo: info.data?.user?.photo,
			});
			await loginAuth(res.data);
		} catch (err) {
			handleApiError(err, 'Google Login');
		} finally {
			hideLoading();
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<BackHeader />

				<View style={styles.wrapper}>
					<View style={styles.card}>
						<CText style={styles.title}>Welcome Back</CText>
						<CText style={styles.subtitle}>Sign in to continue</CText>

						<View style={styles.inputGroup}>
							<TextInput
								placeholder="Email"
								placeholderTextColor="#9CA3AF"
								value={email}
								onChangeText={setEmail}
								style={styles.input}
								keyboardType="email-address"
								autoCapitalize="none"
							/>

							<TextInput
								placeholder="Password"
								placeholderTextColor="#9CA3AF"
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								style={styles.input}
							/>
						</View>

						<TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
							<CText style={styles.primaryText}>Sign In</CText>
						</TouchableOpacity>

						<View style={styles.dividerRow}>
							<View style={styles.line} />
							<CText style={styles.orText}>OR</CText>
							<View style={styles.line} />
						</View>

						<View style={styles.altActions}>
							<TouchableOpacity onPress={handleGoogleLogin} style={styles.iconBtn}>
								<Icon name="logo-google" size={22} color="#DB4437" />
							</TouchableOpacity>

							{isBiometricEnabled && (
								<TouchableOpacity
									onPress={handleBiometricLogin}
									style={styles.iconBtn}
								>
									<Icon
										name="finger-print"
										size={26}
										color={theme.colors.light.primary}
									/>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	wrapper: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 20,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 24,
		padding: 24,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 24,
		shadowOffset: { width: 0, height: 8 },
		// elevation: 6,
	},
	title: {
		fontSize: 30,
		fontWeight: '800',
		color: '#111827',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 14,
		color: '#6B7280',
		textAlign: 'center',
		marginTop: 6,
		marginBottom: 28,
	},
	inputGroup: {
		gap: 14,
	},
	input: {
		height: 54,
		borderRadius: 16,
		backgroundColor: '#F3F4F6',
		paddingHorizontal: 18,
		fontSize: 15,
		color: '#111827',
	},
	primaryButton: {
		marginTop: 24,
		height: 54,
		borderRadius: 16,
		backgroundColor: theme.colors.light.primary,
		justifyContent: 'center',
		alignItems: 'center',
	},
	primaryText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '700',
	},
	dividerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 24,
	},
	line: {
		flex: 1,
		height: 1,
		backgroundColor: '#E5E7EB',
	},
	orText: {
		marginHorizontal: 12,
		color: '#9CA3AF',
		fontSize: 12,
		fontWeight: '600',
	},
	altActions: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 20,
	},
	iconBtn: {
		width: 54,
		height: 54,
		borderRadius: 27,
		backgroundColor: '#FFFFFF',
		borderWidth: 1,
		borderColor: '#E5E7EB',
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default SigninForm;
