import React from 'react';
import {
	View,
	ActivityIndicator,
	StyleSheet,
	StatusBar,
	Image,
	ImageBackground,
	SafeAreaView,
} from 'react-native';
import { theme } from '../theme';
import { CText } from '../components/common/CText';
import { globalStyles } from '../theme/styles';
import { APP_NAME, TAGLINE } from '../../env';
import LinearGradient from 'react-native-linear-gradient';

export default function SplashScreen() {
	return (
		<>
			<StatusBar barStyle="light-content" translucent />
			<SafeAreaView style={styles.safeArea}>
				<ImageBackground
					source={require('../../assets/img/app.png')}
					style={styles.bg}
					resizeMode="cover"
					imageStyle={styles.bgImage}
				>
					<View style={styles.overlay}>

						<View style={styles.center}>
							<Image
								source={require('../../assets/img/ic_launcher.png')}
								style={styles.logo}
							/>

							<CText fontSize={42} fontStyle="SB" style={styles.title}>
								{APP_NAME}
							</CText>

							<CText fontSize={13} fontStyle="R" style={styles.tagline}>
								{TAGLINE}
							</CText>
						</View>

						<View style={styles.loaderContainer}>
							<ActivityIndicator
								size="large"
								color={theme.colors.light.card}
							/>
							<CText fontSize={14} fontStyle="M" style={styles.loadingText}>
								Loading, please wait…
							</CText>
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
	bgImage: {
		opacity: 1,
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
		width: 120,
		height: 120,
		marginBottom: 16,
	},
	title: {
		color: '#fff',
		marginBottom: 6,
		...globalStyles.shadowText,
	},
	tagline: {
		color: 'rgba(255,255,255,0.85)',
		textAlign: 'center',
		maxWidth: 260,
	},
	loaderContainer: {
		alignItems: 'center',
		marginBottom: 60,
	},
	loadingText: {
		color: 'rgba(255,255,255,0.85)',
		marginTop: 12,
	},
});
