import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {Dimensions, StatusBar, TouchableOpacity} from 'react-native';
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
import RecordsScreen from "../screens/Records/RecordsScreen.tsx";
import AddDocumentScreen from "../screens/Records/AddRecordScreen.tsx";

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
				initialRouteName="Home"
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
									case 'Records':
										iconName = focused ? 'list' : 'list-outline';
										break;
										case 'Add':
											iconName = focused ? 'add-circle' : 'add-circle-outline';
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
				<Tab.Screen name="Records" component={RecordsScreen} />
				<Tab.Screen
					name="Scan"
					component={ScanScreen}
					options={{
						tabBarLabel: () => null,
						tabBarIcon: () => null,
						tabBarButton: (props) => (
							<TouchableOpacity
								{...props}
								style={{
									top: -35,
									justifyContent: 'center',
									alignItems: 'center',
									shadowColor: currentColors.primary,
									shadowOffset: { width: 0, height: 5 },
									shadowOpacity: 0.3,
									shadowRadius: 5,
									elevation: 5,
									// backgroundColor: currentColors.primary,
									width: 65,
									height: 65,
									borderRadius: 30,
								}}
							>
								<Icon name="scan-circle" size={70} color={currentColors.primary} />
							</TouchableOpacity>
						),
					}}
				/>
				<Tab.Screen name="Add" component={AddDocumentScreen} />
				<Tab.Screen name="Recordss" component={RecordsScreen} />
				{/*<Tab.Screen name="Recordsss" component={RecordsScreen} />*/}
				{/*<Tab.Screen name="Grades" component={GradesScreen} />*/}
			</Tab.Navigator>
		</>
	);
}