import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Dimensions, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAccess } from '../hooks/useAccess.ts';
import { CText } from '../components/common/CText.tsx';
import GradesScreen from "./Grades/GradesScreen.tsx";
import ActivitiesScreen from "../screens/Student/Classes/ActivitiesScreen.tsx";
import QRCodeScreen from "../Shared/User/QRCodeScreen.tsx";
import HomeScreen from '../Shared/HomeScreen.tsx';
import ClassesScreen from '../screens/Student/Classes/ClassesScreen.tsx';
import {useAuth} from "../context/AuthContext.tsx";
import ClassesListScreen from "../screens/Faculty/Classes/ClassesListScreen.tsx";
import UserProfileScreen from "../Shared/User/UserProfileScreen.tsx";
import ScanScreen from "../screens/Scanner/ScanScreen.tsx";

const Tab = createBottomTabNavigator();
const ClassesStack = createNativeStackNavigator();
const FacClassesStack = createNativeStackNavigator();
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

export default function BottomTabNav() {
	const isLandscape = useOrientation();
	const { hasRole } = useAccess();
	const { user } = useAuth();

	return (
		<>
			<Tab.Navigator
				screenOptions={({ route }) => ({
					tabBarIcon: ({ color, size, focused }) => {
						let iconName = 'ellipse-outline';
						switch (route.name) {
							case 'Home':
								iconName = focused ? 'home' : 'home-outline';
								break;
								case 'Scan':
									iconName = focused ? 'qr-code' : 'qr-code';
									break;
							default:
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

				<Tab.Screen name="Home" component={HomeScreen} />
				{hasRole('FISEmployee') && (
					<>
						<Tab.Screen name="Scan" component={ScanScreen} />
					</>
				)}
				{/*<Tab.Screen name="Grades" component={GradesScreen} />*/}
			</Tab.Navigator>
		</>
	);
}