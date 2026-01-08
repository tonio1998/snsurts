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
import { handleApiError } from '../utils/errorHandler';
import {
	loadDashboardFromCache,
	saveDashboardToCache,
} from '../utils/cache/dashboardCache';
import { LastUpdatedBadge } from '../components/common/LastUpdatedBadge';
import { useAccess } from '../hooks/useAccess';
import UnauthorizedView from '../components/UnauthorizedView';

const HomeScreen = ({ navigation }) => {
	const { user } = useAuth();
	const { hasRole } = useAccess();
	const network = useContext(NetworkContext);
	const { fiscalYear } = useFiscalYear();

	const [dashboardData, setDashboardData] = useState<any>({});
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
	}, [isSearchMode]);

	const loadDashboard = async (force = false) => {
		if (!user?.id) return;

		try {
			setLoading(true);

			if (!force) {
				const { data, date } = await loadDashboardFromCache(
					user.id,
					fiscalYear
				);
				if (data) {
					setDashboardData(data);
					setLastUpdated(date);
					return;
				}
			}

			const fresh = await getDashData(fiscalYear);
			setDashboardData(fresh);

			const savedAt = await saveDashboardToCache(
				user.id,
				fiscalYear,
				fresh
			);

			console.log(fresh)
			setLastUpdated(savedAt);
		} catch (err) {
			handleApiError(err);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		loadDashboard();
	}, [fiscalYear]);

	const onRefresh = () => {
		setRefreshing(true);
		loadDashboard(true);
	};

	const executeSearch = async () => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		try {
			setSearching(true);
			const res = await searchRecords(query);
			setResults(res?.data ?? []);
		} catch (err) {
			handleApiError(err);
		} finally {
			setSearching(false);
		}
	};


	const handleSearchChange = (text: string) => {
		setQuery(text);
	};

	const handleSearchSubmit = () => {
		if (searchTimer.current) {
			clearTimeout(searchTimer.current);
		}
		executeSearch(query);
	};


	if (hasRole('STUD')) {
		return <UnauthorizedView />;
	}

	return (
		<>
			<CustomHomeHeader />
			<SafeAreaView style={globalStyles.safeArea}>
				<View style={{ flex: 1 }}>
					<View style={globalStyles.p_3}>
						<CText fontSize={22} fontStyle="B">
							{getGreeting()}, {getDisplayName(user?.name)}!
						</CText>

						<LastUpdatedBadge
							date={lastUpdated}
							onReload={onRefresh}
						/>

						<View style={styles.searchBox}>
							<Icon name="search-outline" size={18} color="#888" />

							<TextInput
								placeholder="Search QR code, description, sender…"
								value={query}
								onChangeText={handleSearchChange}
								onSubmitEditing={handleSearchSubmit}
								returnKeyType="search"
								style={styles.searchInput}
								placeholderTextColor="#ccc"
							/>

							{query.length > 0 && (
								<TouchableOpacity
									onPress={() => {
										setQuery('');
										setResults([]);
									}}
									style={{ marginRight: 15}}
								>
									<Icon name="close" size={22} color="#aaa" />
								</TouchableOpacity>
							)}

							<TouchableOpacity onPress={handleSearchSubmit}>
								<Icon name="arrow-forward-circle" size={26} color={theme.colors.light.primary} />
							</TouchableOpacity>
						</View>

					</View>

					{isSearchMode && (
						<Animated.View
							style={[
								styles.searchOverlay,
								{
									opacity: searchAnim,
									transform: [
										{
											translateY:
												searchAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [20, 0],
												}),
										},
									],
								},
							]}
						>
							{searching ? (
								<View style={styles.searchLoading}>
									<ShimmerPlaceHolder
										style={{ height: 60 }}
									/>
								</View>
							) : (
								<FlatList
									data={results}
									keyExtractor={i =>
										i.id.toString()
									}
									renderItem={({ item }) => (
										<TouchableOpacity
											style={styles.searchRow}
											onPress={() =>
												navigation.navigate(
													'ScanQRDetails',
													{
														qr_code:
														item.QRCODE,
													}
												)
											}
										>
											<Icon
												name="document-text-outline"
												size={18}
												color={
													theme.colors.light
														.primary
												}
											/>
											<View
												style={{
													marginLeft: 12,
													flex: 1,
												}}
											>
												<CText fontStyle="B">
													{item.Description}
												</CText>
												<CText
													style={styles.meta}
												>
													{item.QRCODE}
												</CText>
											</View>
										</TouchableOpacity>
									)}
								/>
							)}
						</Animated.View>
					)}

					<ScrollView
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={onRefresh}
							/>
						}
						contentContainerStyle={{
							paddingBottom: 120,
						}}
					>
						<View style={styles.heroWrap}>
							<LinearGradient
								colors={[
									theme.colors.light.primary_light,
									theme.colors.light.primary,
								]}
								style={styles.heroCard}
							>
								<View style={styles.bgCircleLarge} />
								<View style={styles.bgCircleSmall} />
								<CText style={styles.heroLabel}>Overview</CText>

								<CText style={styles.heroValue}>
									{formatNumber(dashboardData?.totalLogs || 0)}
								</CText>
								<CText style={styles.heroSub}>Total Logs</CText>

								<View style={styles.heroDivider} />

								<View style={styles.heroStatsRow}>
									<View style={styles.heroStat}>
										<CText style={styles.heroStatValue}>
											{formatNumber(dashboardData?.stats?.Incoming || 0)}
										</CText>
										<CText style={styles.heroStatLabel}>Incoming</CText>
									</View>

									<View style={styles.heroStat}>
										<CText style={styles.heroStatValue}>
											{formatNumber(dashboardData?.stats?.Done || 0)}
										</CText>
										<CText style={styles.heroStatLabel}>Completed</CText>
									</View>

									<View style={styles.heroStat}>
										<CText style={styles.heroStatValue}>
											{formatNumber(dashboardData?.stats?.Outgoing || 0)}
										</CText>
										<CText style={styles.heroStatLabel}>Outgoing</CText>
									</View>
								</View>
							</LinearGradient>
						</View>


						<View style={styles.section}>
							<CText fontStyle="B" fontSize={18} style={{ marginBottom: 15}}>
								Recent Activity
							</CText>

							{dashboardData?.latestLogs?.map(item => (
								<TouchableOpacity
									key={item.id}
									style={styles.activityRow}
									onPress={() =>
										navigation.navigate(
											'ScanQRDetails',
											{
												qr_code:
												item.record?.QRCODE,
											}
										)
									}
								>
									<Icon
										name="document-text-outline"
										size={18}
										color={
											theme.colors.light.primary
										}
									/>
									<View
										style={{
											flex: 1,
											marginLeft: 12,
										}}
									>
										<CText
											fontStyle="B"
											numberOfLines={1}
										>
											{
												item.record
													?.Description
											}
										</CText>
										<CText style={styles.meta}>
											{formatDate(
												item.created_at
											)}
										</CText>
									</View>
								</TouchableOpacity>
							))}
						</View>

						{network?.isConnected === false && (
							<View style={styles.offline}>
								<Icon
									name="cloud-offline-outline"
									size={16}
									color="#fff"
								/>
								<CText style={styles.offlineText}>
									Offline mode
								</CText>
							</View>
						)}
					</ScrollView>
				</View>
			</SafeAreaView>
		</>
	);
};

export default HomeScreen;


const styles = StyleSheet.create({
	bgCircleLarge: {
		position: 'absolute',
		width: 220,
		height: 220,
		borderRadius: 110,
		backgroundColor: 'rgba(255,255,255,0.15)',
		top: -80,
		right: -60,
	},

	bgCircleSmall: {
		position: 'absolute',
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: 'rgba(255,255,255,0.2)',
		bottom: -40,
		left: -30,
	},
	subtle: { color: '#777', marginTop: 4 },
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
	searchInput: { flex: 1, marginHorizontal: 8, color: '#000' },
	searchOverlay: {
		position: 'absolute',
		top: '25%',
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: theme.colors.light.card,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 10,
		elevation: 10,
		zIndex: 10,
	},
	searchLoading: { paddingHorizontal: 16, paddingTop: 20 },
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
	heroWrap: { marginHorizontal: 16, marginBottom: 16 },
	heroCard: { borderRadius: 16, padding: 20 },
	heroLabel: { color: '#fff', fontSize: 13, opacity: 0.85 },
	heroValue: {
		color: '#fff',
		fontSize: 42,
		fontWeight: '700',
		marginVertical: 6,
	},
	heroMeta: { flexDirection: 'row', alignItems: 'center' },
	heroMetaText: { color: '#fff', fontSize: 13, opacity: 0.85 },
	heroMetaDot: { color: '#fff', marginHorizontal: 8, opacity: 0.6 },
	actionStrip: {
		flexDirection: 'row',
		marginHorizontal: 16,
		backgroundColor: '#fff',
		borderRadius: 16,
		elevation: 2,
		marginBottom: 18,
	},
	action: { flex: 1, alignItems: 'center', paddingVertical: 14 },
	section: { paddingHorizontal: 16 },
	activityRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		elevation: 1,
	},
	meta: { fontSize: 12, color: '#777', marginTop: 2 },
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
	offline: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: theme.colors.light.danger,
		margin: 16,
		padding: 10,
		borderRadius: 10,
		justifyContent: 'center',
	},
	offlineText: { color: '#fff', marginLeft: 6 },
	heroWrap: {
		marginHorizontal: 16,
		marginBottom: 16,
	},
	heroCard: {
		borderRadius: 18,
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
		marginTop: 4,
	},
	heroSub: {
		color: '#fff',
		fontSize: 13,
		opacity: 0.8,
	},
	heroDivider: {
		height: 1,
		backgroundColor: 'rgba(255,255,255,0.25)',
		marginVertical: 14,
	},
	heroStatsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	heroStat: {
		alignItems: 'center',
		flex: 1,
	},
	heroStatValue: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '700',
	},
	heroStatLabel: {
		color: '#fff',
		fontSize: 12,
		opacity: 0.8,
		marginTop: 2,
	},

});
