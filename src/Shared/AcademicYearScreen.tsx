import React, { useEffect, useState } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	SafeAreaView,
	StatusBar,
	Text,
} from 'react-native';
import { CText } from '../components/common/CText.tsx';
import { globalStyles } from '../theme/styles.ts';
import { theme } from '../theme';
import CanvaHeaderBackground from '../components/CanvaBackground.tsx';
import { useFiscalYear } from '../context/FiscalYearContext.tsx';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function FiscalYearScreen({ navigation }) {
	const { fiscalYear, setFiscalYear } = useFiscalYear();

	const DEFAULT_YEAR = String(new Date().getFullYear());
	const [selectedYear, setSelectedYear] = useState(
		fiscalYear || DEFAULT_YEAR
	);

	const currentYear = new Date().getFullYear();
	const startYear = currentYear - 4;

	const years = Array.from({ length: 5 }, (_, i) =>
		String(startYear + i)
	).reverse();

	useEffect(() => {
		if (fiscalYear) {
			setSelectedYear(fiscalYear);
		}
	}, [fiscalYear]);

	const handleSave = async () => {
		await setFiscalYear(selectedYear);
		AsyncStorage.setItem('FiscalYear', String(selectedYear));
		navigation.goBack();
	};

	return (
		<>
			<StatusBar barStyle="dark-content" />
			<SafeAreaView style={[globalStyles.safeArea, styles.safeArea]}>
					<Text>{'\n\n\n\n\n\n'}</Text>

					<View style={styles.container}>
						<CText fontSize={20} fontStyle="B" style={{ marginBottom: 10 }}>
							Change Fiscal Year
						</CText>

						<View style={styles.buttonGroup}>
							{years.map((year) => (
								<TouchableOpacity
									key={year}
									style={[
										styles.button,
										selectedYear === year && styles.selectedButton,
									]}
									onPress={() => setSelectedYear(year)}
								>
									<CText
										fontSize={14}
										fontStyle="M"
										style={
											selectedYear === year
												? styles.selectedText
												: styles.buttonText
										}
									>
										{year}
									</CText>
								</TouchableOpacity>
							))}
						</View>

						<TouchableOpacity onPress={handleSave} style={styles.saveButton}>
							<CText fontSize={16} fontStyle="SB" style={styles.saveButtonText}>
								Save
							</CText>
						</TouchableOpacity>
					</View>
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		paddingTop: 0,
	},
	container: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 16,
		width: '100%',
	},
	buttonGroup: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
	},
	button: {
		backgroundColor: '#ccc',
		borderRadius: theme.radius.sm,
		paddingVertical: 8,
		paddingHorizontal: 14,
		margin: 6,
	},
	selectedButton: {
		backgroundColor: theme.colors.light.primary,
	},
	buttonText: {
		color: '#fff',
	},
	selectedText: {
		color: '#fff',
	},
	saveButton: {
		backgroundColor: theme.colors.light.primary,
		borderRadius: theme.radius.sm,
		paddingVertical: 12,
		paddingHorizontal: 30,
		marginTop: 30,
		position: 'absolute',
		bottom: 20,
		left: 20,
		right: 20,
	},
	saveButtonText: {
		color: '#fff',
		textAlign: 'center',
	},
});
