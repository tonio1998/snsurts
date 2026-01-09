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
} from '../services/cache/dashboardCache';
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

			const fresh = await getDashData({ fiscalYear });
			setDashboardData(fresh);

			const savedAt = await saveDashboardToCache(
				user.id,
				fiscalYear,
				fresh
			);

			setLastUpdated(savedAt);

			console.log("fresh: ", fresh)
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

	const handleSearchSubmit = () => {
		executeSearch();
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
							<Icon name="search-outline" size={18} color="#999" />

							<TextInput
								placeholder="Search records, QR code, sender…"
								value={query}
								onChangeText={setQuery}
								onSubmitEditing={handleSearchSubmit}
								returnKeyType="search"
								style={styles.searchInput}
								placeholderTextColor="#999"
							/>

							{query.length > 0 && (
								<TouchableOpacity
									onPress={() => {
										setQuery('');
										setResults([]);
									}}
								>
									<Icon
										name="close-circle"
										size={18}
										color="#bbb"
									/>
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
									transform: [
										{
											translateY:
												searchAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [40, 0],
												}),
										},
									],
								},
							]}
						>
							<View style={styles.searchHandle} />

							{searching ? (
								<View style={styles.searchLoading}>
									<ShimmerPlaceHolder
										style={{
											height: 60,
											borderRadius: 12,
										}}
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
											<View
												style={
													styles.searchIconWrap
												}
											>
												<Icon
													name="document-text-outline"
													size={18}
													color={
														theme.colors
															.light.primary
													}
												/>
											</View>

											<View style={{ flex: 1 }}>
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
									ListEmptyComponent={
										<View
											style={styles.emptySearch}
										>
											<CText>
												No results found
											</CText>
										</View>
									}
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
									theme.colors.light.primary,
									theme.colors.light.primary_dark,
								]}
								style={styles.heroCard}
							>
								<View style={styles.bgCircleLarge} />
								<View style={styles.bgCircleSmall} />

								<View style={globalStyles.cardRow}>
									<CText style={styles.heroLabel}>Overview</CText>
									<View style={globalStyles.cardRow}>
										<CText style={styles.heroLabel}>Avg TAT (hrs) </CText>
										<CText fontSize={20} style={{ color: '#fff'}} fontStyle={'SB'}>{dashboardData?.avgTatHours}</CText>
									</View>
								</View>

								<View style={styles.heroTopRow}>
									<View style={styles.heroTopItem}>
										<CText style={styles.heroValue}>
											{formatNumber(dashboardData?.totalLogs || 0)}
										</CText>
										<CText style={styles.heroSub}>Total Logs</CText>
									</View>

									<View style={styles.heroTopItem}>
										<CText style={styles.heroValue}>
											{formatNumber(
												dashboardData?.stats?.totalCount || 0
											)}
										</CText>
										<CText style={styles.heroSub}>Total Documents</CText>
									</View>
								</View>

								<View style={styles.heroDivider} />

								{/* STATUS COUNTS */}
								<View style={styles.heroStatsRow}>
									{[
										{
											label: 'Incoming',
											value: dashboardData?.stats?.Incoming,
										},
										{
											label: 'Completed',
											value: dashboardData?.stats?.Done,
										},
										{
											label: 'Outgoing',
											value: dashboardData?.stats?.Outgoing,
										},
										{
											label: 'Overdue',
											value: dashboardData?.stats?.Overdue,
										},
									].map((item, idx) => (
										<View key={idx} style={styles.heroStat}>
											<CText style={styles.heroStatValue}>
												{formatNumber(item.value || 0)}
											</CText>
											<CText style={styles.heroStatLabel}>
												{item.label}
											</CText>
										</View>
									))}
								</View>
							</LinearGradient>
						</View>


						<View style={styles.section}>
							<CText fontStyle="B" fontSize={18}>
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
												item.record
													?.QRCODE,
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
								<CText
									style={styles.offlineText}
								>
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
	heroTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	heroTopItem: {
		flex: 1,
	},

	searchBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginTop: 14,
		elevation: 3,
	},
	searchInput: {
		flex: 1,
		marginHorizontal: 8,
		fontSize: 14,
		color: '#000',
	},

	searchOverlay: {
		position: 'absolute',
		top: '22%',
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: theme.colors.light.card,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		zIndex: 20,
	},
	searchHandle: {
		width: 40,
		height: 4,
		backgroundColor: '#ccc',
		borderRadius: 2,
		alignSelf: 'center',
		marginVertical: 10,
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
	searchIconWrap: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#F3F6FA',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	emptySearch: {
		alignItems: 'center',
		marginTop: 40,
	},
	meta: {
		fontSize: 12,
		color: '#777',
		marginTop: 2,
	},

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
		fontSize: 35,
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
		flex: 1,
		alignItems: 'center',
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

	section: {
		paddingHorizontal: 16,
	},
	activityRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 14,
		padding: 14,
		marginTop: 12,
		elevation: 1,
	},

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

	bgCircleLarge: {
		position: 'absolute',
		width: 220,
		height: 220,
		borderRadius: 110,
		backgroundColor: 'rgba(255,255,255,0.1)',
		top: -80,
		right: -60,
	},
	bgCircleSmall: {
		position: 'absolute',
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: 'rgba(255,255,255,0.1)',
		bottom: -40,
		left: -30,
	},
});
