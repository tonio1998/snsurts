import React, { useContext, useEffect, useRef, useState } from 'react';
import {
	View,
	StyleSheet,
	SafeAreaView,
	RefreshControl,
	TouchableOpacity,
	TextInput,
	FlatList,
	ScrollView,
	Animated,
	Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';

import { globalStyles } from '../theme/styles';
import { CText } from '../components/common/CText';
import { theme } from '../theme';
import CustomHomeHeader from '../components/layout/CustomHomeHeader';
import { useAuth } from '../context/AuthContext';
import { NetworkContext } from '../context/NetworkContext';
import { formatDate } from '../utils/dateFormatter';
import { formatNumber, getDisplayName } from '../utils/format';
import { getGreeting } from '../utils/greetings';
import { useFiscalYear } from '../context/FiscalYearContext';
import { getDashData, searchRecords } from '../api/modules/logsApi';

const HomeScreen = ({ navigation }) => {
	const { user } = useAuth();
	const network = useContext(NetworkContext);
	const { fiscalYear } = useFiscalYear();

	const [dashboardData, setDashboardData] = useState<any>({});
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [query, setQuery] = useState('');
	const [results, setResults] = useState<any[]>([]);
	const [searching, setSearching] = useState(false);

	const searchTimer = useRef<any>(null);
	const searchAnim = useRef(new Animated.Value(0)).current;

	const isSearchMode = query.trim().length > 0;

	useEffect(() => {
		Animated.timing(searchAnim, {
			toValue: isSearchMode ? 1 : 0,
			duration: 250,
			easing: Easing.out(Easing.cubic),
			useNativeDriver: true,
		}).start();
	}, [query]);

	const loadDashboard = async () => {
		try {
			setLoading(true);
			const data = await getDashData(fiscalYear);
			setDashboardData(data);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		loadDashboard();
	}, []);

	const handleSearch = (text: string) => {
		setQuery(text);
		if (searchTimer.current) clearTimeout(searchTimer.current);

		if (!text.trim()) {
			setResults([]);
			return;
		}

		searchTimer.current = setTimeout(async () => {
			try {
				setSearching(true);
				const res = await searchRecords(text);
				setResults(res?.data ?? []);
			} finally {
				setSearching(false);
			}
		}, 400);
	};

	const activeCount =
		(dashboardData?.stats?.Incoming ?? 0) +
		(dashboardData?.stats?.Outgoing ?? 0);

	return (
		<>
			<CustomHomeHeader />
			<SafeAreaView style={globalStyles.safeArea}>
				<View style={{ flex: 1 }}>

					{/* HEADER */}
					<View style={globalStyles.p_3}>
						<CText fontSize={22} fontStyle="B">
							{getGreeting()}, {getDisplayName(user?.name)}
						</CText>
						<CText style={styles.subtle}>
							Document Tracking • FY {fiscalYear}
						</CText>
=
						<View style={styles.searchBox}>
							<Icon name="search-outline" size={18} color="#888" />
							<TextInput
								placeholder="Search QR code, description, sender…"
								value={query}
								onChangeText={handleSearch}
								style={styles.searchInput}
								placeholderTextColor="#ccc"
							/>
							{query.length > 0 && (
								<TouchableOpacity onPress={() => setQuery('')}>
									<Icon name="close" size={24} color="#aaa" />
								</TouchableOpacity>
							)}
						</View>
					</View>

					{isSearchMode && (
						<Animated.View
							style={[
								styles.searchOverlay,
								{
									opacity: searchAnim,
									transform: [{ translateY: searchAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [20, 0],
										})}],
								},
							]}
						>
							{searching ? (
								<View style={styles.searchLoading}>
									<ShimmerPlaceHolder style={{ height: 60 }} />
								</View>
							) : (
								<FlatList
									data={results}
									keyExtractor={i => i.id.toString()}
									renderItem={({ item }) => (
										<TouchableOpacity
											style={styles.searchRow}
											onPress={() =>
												navigation.navigate('ScanQRDetails', {
													qr_code: item.QRCODE,
												})
											}
										>
											<Icon
												name="document-text-outline"
												size={18}
												color={theme.colors.light.primary}
											/>
											<View style={{ marginLeft: 12 }}>
												<CText fontStyle="B">{item.Description}</CText>
												<CText style={styles.meta}>{item.QRCODE}</CText>
											</View>
										</TouchableOpacity>
									)}
								/>
							)}
						</Animated.View>
					)}

					<ScrollView
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={loadDashboard} />
						}
						contentContainerStyle={{ paddingBottom: 120 }}
					>
						{/* HERO */}
						<View style={styles.heroWrap}>
							<LinearGradient
								colors={[
									theme.colors.light.primary,
									theme.colors.light.primary_dark,
								]}
								style={styles.heroCard}
							>
								<CText style={styles.heroLabel}>Active Documents</CText>
								<CText style={styles.heroValue}>
									{formatNumber(activeCount)}
								</CText>

								<View style={styles.heroMeta}>
									<CText style={styles.heroMetaText}>
										{dashboardData?.stats?.Incoming} Incoming
									</CText>
									<CText style={styles.heroMetaDot}>•</CText>
									<CText style={styles.heroMetaText}>
										{dashboardData?.stats?.Outgoing} Outgoing
									</CText>
								</View>
							</LinearGradient>
						</View>

						{/* ACTIONS */}
						<View style={styles.actionStrip}>
							<Action icon="scan-outline" label="Scan" onPress={() => navigation.navigate('Scan')} />
							<Action icon="add-outline" label="New" onPress={() => navigation.navigate('AddRecord')} />
						</View>

						{/* RECENT ACTIVITY */}
						<View style={styles.section}>
							<CText fontStyle="B">Recent Activity</CText>

							{dashboardData?.latestLogs?.map(item => (
								<TouchableOpacity
									key={item.id}
									style={styles.activityRow}
									onPress={() =>
										navigation.navigate('ScanQRDetails', {
											qr_code: item.record?.QRCODE,
										})
									}
								>
									<Icon
										name="document-text-outline"
										size={18}
										color={theme.colors.light.primary}
									/>
									<View style={{ flex: 1, marginLeft: 12 }}>
										<CText fontStyle="B" numberOfLines={1}>
											{item.record?.Description}
										</CText>
										<CText style={styles.meta}>
											{formatDate(item.created_at)}
										</CText>
									</View>
									<CText style={styles.status(item.TrailStatus)}>
										{item.TrailStatus}
									</CText>
								</TouchableOpacity>
							))}
						</View>

						{/* OFFLINE */}
						{network?.isConnected === false && (
							<View style={styles.offline}>
								<Icon name="cloud-offline-outline" size={16} color="#fff" />
								<CText style={styles.offlineText}>Offline mode</CText>
							</View>
						)}
					</ScrollView>
				</View>
			</SafeAreaView>
		</>
	);
};

const Action = ({ icon, label, onPress }) => (
	<TouchableOpacity style={styles.action} onPress={onPress}>
		<Icon name={icon} size={20} color={theme.colors.light.primary} />
		<CText fontStyle="B">{label}</CText>
	</TouchableOpacity>
);

export default HomeScreen;
const styles = StyleSheet.create({
	subtle: {
		color: '#777',
		marginTop: 4,
	},

	/* ================= SEARCH ================= */

	searchBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 14,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginTop: 14,
		elevation: 2,
	},

	searchInput: {
		flex: 1,
		marginHorizontal: 8,
		color: '#000',
	},

	searchOverlay: {
		position: 'absolute',
		top: '23%',
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: theme.colors.light.card,
		zIndex: 10,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 10,
		elevation: 10,
	},

	searchLoading: {
		paddingHorizontal: 16,
		paddingTop: 20,
	},

	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 14,
		marginHorizontal: 16,
		marginBottom: 10,
		elevation: 1,
	},

	/* ================= HERO ================= */

	heroWrap: {
		marginHorizontal: 16,
		marginBottom: 16,
	},

	heroCard: {
		borderRadius: 20,
		padding: 20,
	},

	heroLabel: {
		color: '#fff',
		fontSize: 13,
		opacity: 0.85,
	},

	heroValue: {
		color: '#fff',
		fontSize: 42,
		fontWeight: '700',
		marginVertical: 6,
	},

	heroMeta: {
		flexDirection: 'row',
		alignItems: 'center',
	},

	heroMetaText: {
		color: '#fff',
		fontSize: 12,
		opacity: 0.85,
	},

	heroMetaDot: {
		color: '#fff',
		marginHorizontal: 8,
		opacity: 0.6,
	},

	/* ================= ACTIONS ================= */

	actionStrip: {
		flexDirection: 'row',
		marginHorizontal: 16,
		backgroundColor: '#fff',
		borderRadius: 16,
		elevation: 2,
		marginBottom: 18,
	},

	action: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 14,
	},

	actionText: {
		marginTop: 6,
		fontSize: 12,
	},

	/* ================= SECTIONS ================= */

	section: {
		paddingHorizontal: 16,
	},

	sectionTitle: {
		marginBottom: 10,
	},

	/* ================= ACTIVITY ================= */

	activityRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		elevation: 1,
	},

	meta: {
		fontSize: 12,
		color: '#777',
		marginTop: 2,
	},
	status: (status: string) => ({
		fontSize: 12,
		fontWeight: '600',
		color:
			status === 'Done'
				? theme.colors.light.success
				: status === 'Incoming'
					? theme.colors.light.info
					: theme.colors.light.warning,
	}),

	empty: {
		alignItems: 'center',
		paddingVertical: 20,
	},

	/* ================= OFFLINE ================= */

	offline: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.light.danger,
		margin: 16,
		padding: 10,
		borderRadius: 10,
		justifyContent: 'center',
	},

	offlineText: {
		color: '#fff',
		marginLeft: 6,
	},
});
