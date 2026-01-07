import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { theme } from "../theme";

const StatusIndicator = () => {
	const [status, setStatus] = useState("online");
	const [speed, setSpeed] = useState(null); // Mbps value

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener(state => {
			const isConnected = state.isConnected;
			const isInternetReachable = state.isInternetReachable;
			const downlink = state.details?.downlink || 0;
			setSpeed(downlink);

			if (!isConnected || !isInternetReachable) {
				setStatus("offline");
				return;
			}

			if (downlink > 0 && downlink < 1) {
				setStatus("slow");
				return;
			}

			setStatus("online");

			console.log("NetInfo", state);
		});

		return () => unsubscribe();
	}, []);


	if (status === "offline") {
		return (
			<View style={[styles.statusContainer, { backgroundColor: theme.colors.light.danger }]}>
				<Text style={styles.statusText}>No Internet Connection…</Text>
			</View>
		);
	}

	if (status === "slow") {
		return (
			<View style={[styles.statusContainer, { backgroundColor: "orange" }]}>
				<Text style={styles.statusText}>
					Slow Internet: {speed?.toFixed(2)} Mbps
				</Text>
			</View>
		);
	}

	return null;
};

const styles = StyleSheet.create({
	statusContainer: {
		position: 'absolute',
		top: '5%',
		left: 0,
		right: 0,
		padding: 4,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 999,
		borderRadius: 6,
	},
	statusText: {
		fontSize: 12,
		fontWeight: 'bold',
		color: 'white',
		textAlign: 'center',
	},
});

export default StatusIndicator;
