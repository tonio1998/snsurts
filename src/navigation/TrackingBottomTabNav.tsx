// TrackingBottomTabNav.jsx
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { useAccess } from '../hooks/useAccess.ts';
import { CText } from '../components/common/CText.tsx';
import ScanQRDetailsScreen from "../screens/Scanner/ScanQRDetailsScreen.tsx";
import HistoryScreen from '../screens/Scanner/HistoryScreen.tsx';
import AttachmentScreen from "../screens/Scanner/AttachmentScreen.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { TrackingProvider, useTracking } from "../context/TrackingContext.tsx";

const Tab = createBottomTabNavigator();
const currentColors = theme.colors.light;

function useOrientation() {
	const [isLandscape, setIsLandscape] = useState(
		Dimensions.get('window').width > Dimensions.get('window').height
	);

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ window }) => {
			setIsLandscape(window.width > window.height);
		});
		return () => subscription?.remove?.();
	}, []);

	return isLandscape;
}

export default function TrackingBottomTabNav({ route }) {
	return (
		<TrackingProvider qr_code={route.params.qr_code}>
			<TrackingTabContent />
		</TrackingProvider>
	);
}

function TrackingTabContent() {
	const isLandscape = useOrientation();
	const { user } = useAuth();
	const { record, loading } = useTracking();
	const isCreator = record?.created_by === user?.id;
	console.log('TrackingTabContent', isCreator);

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ color, size, focused }) => {
					let iconName = 'ellipse-outline';
					switch (route.name) {
						case 'Action':
							iconName = focused ? 'flash' : 'flash-outline';
							break;
						case 'History':
							iconName = focused ? 'time' : 'time-outline';
							break;
						case 'Attachment':
							iconName = focused ? 'document-text' : 'document-text-outline';
							break;
						default:
							iconName = focused ? 'help-circle' : 'help-circle-outline';
							break;
					}
					return <Icon name={iconName} size={20} color={focused ? currentColors.primary : '#9F9F9F'} />;
				},
				tabBarLabel: ({ color, focused }) => (
					<CText
						numberOfLines={1}
						style={{
							color: focused ? currentColors.primary : '#9F9F9F',
							fontWeight: focused ? 'bold' : 'normal',
							fontSize: 12,
							textAlign: 'center',
						}}
					>
						{route.name}
					</CText>
				),
				tabBarLabelPosition: isLandscape ? 'beside-icon' : 'below-icon',
				tabBarActiveTintColor: currentColors.primary,
				tabBarInactiveTintColor: '#9F9F9F',
				headerShown: false,
				tabBarStyle: {
					backgroundColor: currentColors.card,
					height: isLandscape ? 55 : 65,
					paddingTop: 4,
					paddingBottom: isLandscape ? 4 : 10,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: -2 },
					shadowOpacity: 0.1,
					shadowRadius: 10,
					borderColor: '#ccc',
					flexDirection: isLandscape ? 'row' : 'column',
				},
			})}
		>
			<Tab.Screen name="Action" component={ScanQRDetailsScreen} />
			{isCreator && (
				<Tab.Screen name="Attachment" component={AttachmentScreen} />
			)}
			<Tab.Screen name="History" component={HistoryScreen} />
		</Tab.Navigator>
	);
}
