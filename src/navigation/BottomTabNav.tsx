import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../theme';
import { CText } from '../components/common/CText';

import HomeScreen from '../Shared/HomeScreen';
import ScanScreen from '../screens/Scanner/ScanScreen';
import RecordsScreen from '../screens/Records/RecordsScreen';
import AddDocumentScreen from '../screens/Records/AddRecordScreen';

const Tab = createBottomTabNavigator();
const colors = theme.colors.light;

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

export default function BottomTabNav() {
	const isLandscape = useOrientation();
	const insets = useSafeAreaInsets();

	const TAB_HEIGHT = isLandscape ? 52 : 64;

	const getIcon = (route: string, focused: boolean) => {
		switch (route) {
			case 'Home':
				return focused ? 'home' : 'home-outline';
			case 'Record':
				return focused
					? 'document-text'
					: 'document-text-outline';
			case 'Scan':
				return focused ? 'qr-code' : 'qr-code-outline';
			case 'Add':
				return focused ? 'add-circle' : 'add-circle-outline';
			default:
				return 'ellipse-outline';
		}
	};

	return (
		<Tab.Navigator
			initialRouteName="Home"
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarIcon: ({ focused }) => (
					<View>
						<Icon
							name={getIcon(route.name, focused)}
							size={22}
							color={focused ? colors.primary : '#A0A0A0'}
						/>
					</View>
				),
				tabBarLabel: ({ focused }) => (
					<CText
						style={{
							fontSize: 10,
							fontWeight: '400',
							marginTop: 2,
							color: focused ? colors.primary : '#A0A0A0',
						}}
					>
						{route.name}
					</CText>
				),
				tabBarStyle: {
					height: TAB_HEIGHT + insets.bottom,
					paddingBottom: Math.max(insets.bottom, 8),
					paddingTop: 8,
					backgroundColor: colors.card,
					borderTopWidth: 0.5,
					borderTopColor: '#E5E5E5',
					elevation: 4,
				},
			})}
		>
			<Tab.Screen name="Home" component={HomeScreen} />
			<Tab.Screen name="Scan" component={ScanScreen} />
			<Tab.Screen name="Record" component={RecordsScreen} />
			{/*<Tab.Screen name="Add" component={AddDocumentScreen} />*/}
		</Tab.Navigator>
	);
}
