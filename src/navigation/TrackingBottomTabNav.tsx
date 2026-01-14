import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { CText } from '../components/common/CText';
import { useAuth } from '../context/AuthContext';
import { TrackingProvider, useTracking } from '../context/TrackingContext';

import ScanQRDetailsScreen from '../screens/Records/ScanQRDetailsScreen.tsx';
import HistoryScreen from '../screens/Records/HistoryScreen.tsx';
import AttachmentScreen from '../screens/Records/AttachmentScreen.tsx';
import DetailsScreen from "../screens/Records/DetailsScreen.tsx";

const Tab = createBottomTabNavigator();
const currentColors = theme.colors.light;

function useOrientation() {
	const [isLandscape, setIsLandscape] = useState(
		Dimensions.get('window').width > Dimensions.get('window').height
	);

	useEffect(() => {
		const sub = Dimensions.addEventListener('change', ({ window }) => {
			setIsLandscape(window.width > window.height);
		});
		return () => sub?.remove?.();
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
	const insets = useSafeAreaInsets();
	const { user } = useAuth();
	const { record } = useTracking();

	const isCreator = record?.created_by === user?.id;
	const TAB_HEIGHT = isLandscape ? 54 : 64;

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				headerShown: false,

				tabBarIcon: ({ focused }) => {
					let iconName: string;

					switch (route.name) {
						case 'Action':
							iconName = focused ? 'flash' : 'flash-outline';
							break;
						case 'History':
							iconName = focused ? 'time' : 'time-outline';
							break;
							case 'Details':
								iconName = focused ? 'list' : 'list-outline';
								break;
						case 'Attachment':
							iconName = focused
								? 'document-text'
								: 'document-text-outline';
							break;
						default:
							iconName = 'help-circle-outline';
					}

					return (
						<Icon
							name={iconName}
							size={22}
							color={focused ? currentColors.primary : '#9F9F9F'}
						/>
					);
				},

				tabBarLabel: ({ focused }) => (
					<CText
						numberOfLines={1}
						style={{
							fontSize: 12,
							fontWeight: focused ? '600' : '400',
							color: focused ? currentColors.primary : '#9F9F9F',
						}}
					>
						{route.name}
					</CText>
				),

				tabBarLabelPosition: isLandscape ? 'beside-icon' : 'below-icon',

				tabBarStyle: {
					height: TAB_HEIGHT + insets.bottom,
					paddingBottom: Math.max(insets.bottom, 8),
					paddingTop: 6,
					backgroundColor: currentColors.card,
					borderTopWidth: 0.5,
					borderTopColor: '#E0E0E0',
					shadowColor: '#000',
					shadowOffset: { width: 0, height: -2 },
					shadowOpacity: 0.08,
					shadowRadius: 6,
					elevation: 8,
				},
			})}
		>
			<Tab.Screen name="Details" component={DetailsScreen} />
			<Tab.Screen name="Action" component={ScanQRDetailsScreen} />

			{isCreator && (
				<Tab.Screen name="Attachment" component={AttachmentScreen} />
			)}

			<Tab.Screen name="History" component={HistoryScreen} />
		</Tab.Navigator>
	);
}
