import React from 'react';
import {
	View,
	StyleSheet,
	StatusBar,
	Image,
	ImageBackground,
	SafeAreaView,
	TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { CText } from '../components/common/CText';
import { globalStyles } from '../theme/styles';
import { APP_NAME, TAGLINE } from '../../env';

export default function UnauthorizedScreen() {
	const navigation = useNavigation();

	const handleGoBack = () => {
		navigation.goBack();
	};

	const handleLogout = () => {
		// replace with your actual logout logic
		// authLogout();
		navigation.reset({
			index: 0,
			routes: [{ name: 'Login' }],
		});
	};

	return (
		<>
			<StatusBar barStyle="light-content" translucent />
			<SafeAreaView style={styles.safeArea}>
				<ImageBackground
					source={require('../../assets/img/app.png')}
					style={styles.bg}
					resizeMode="cover"
				>
					<View style={styles.overlay}>

						<View style={styles.center}>
							<Image
								source={require('../../assets/img/ic_launcher.png')}
								style={styles.logo}
							/>

							<CText fontSize={36} fontStyle="SB" style={styles.title}>
								{APP_NAME}
							</CText>

							<CText fontSize={14} fontStyle="R" style={styles.tagline}>
								{TAGLINE}
							</CText>

							<CText fontSize={18} fontStyle="SB" style={styles.errorTitle}>
								Unauthorized Access
							</CText>

							<CText fontSize={14} fontStyle="R" style={styles.errorText}>
								You do not have permission to access this section of the
								application. Please go back or sign out and switch accounts.
							</CText>
						</View>

						<View style={styles.actions}>
							<TouchableOpacity
								style={[styles.button, styles.backButton]}
								onPress={handleGoBack}
							>
								<CText fontSize={15} fontStyle="M" style={styles.backText}>
									Go Back
								</CText>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.logoutButton]}
								onPress={handleLogout}
							>
								<CText fontSize={15} fontStyle="M" style={styles.logoutText}>
									Logout
								</CText>
							</TouchableOpacity>
						</View>

						<View style={globalStyles.bgBottomCircle} />
					</View>
				</ImageBackground>
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: theme.colors.light.primary,
	},
	bg: {
		flex: 1,
	},
	overlay: {
		flex: 1,
		paddingHorizontal: 24,
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	logo: {
		width: 110,
		height: 110,
		marginBottom: 16,
	},
	title: {
		color: '#fff',
		marginBottom: 4,
		...globalStyles.shadowText,
	},
	tagline: {
		color: 'rgba(255,255,255,0.85)',
		marginBottom: 20,
		textAlign: 'center',
	},
	errorTitle: {
		color: '#fff',
		marginBottom: 10,
	},
	errorText: {
		color: 'rgba(255,255,255,0.85)',
		textAlign: 'center',
		maxWidth: 300,
	},
	actions: {
		marginBottom: 70,
	},
	button: {
		height: 48,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 12,
	},
	backButton: {
		backgroundColor: 'rgba(255,255,255,0.2)',
	},
	logoutButton: {
		backgroundColor: '#fff',
	},
	backText: {
		color: '#fff',
	},
	logoutText: {
		color: theme.colors.light.primary,
	},
});
