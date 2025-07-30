import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import api from '../../api/api.ts';

function getNestedValue(obj, keyPath) {
	return keyPath.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}


export default function SmartSelectPicker({
	                                          value,
	                                          onValueChange,
	                                          apiUrl,
	                                          items = [],
	                                          labelKey = 'label',
	                                          valueKey = 'value',
	                                          placeholder = 'Select one',
											  onLoad,
                                          }) {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [tempOptions, setTempOptions] = useState([]);

	useEffect(() => {
		const debounce = setTimeout(() => {
			if (apiUrl && searchText.length >= 2) {
				api.get(`${apiUrl}?search=${encodeURIComponent(searchText)}`).then((res) => {
					const formatted = res.data.map((item) => ({
						label: getNestedValue(item, labelKey) || 'Unnamed',
						value: String(getNestedValue(item, valueKey)),
					}));
					setTempOptions(formatted);
				});
			}
		}, 500);

		return () => clearTimeout(debounce);
	}, [searchText]);

	useEffect(() => {
		if (open && searchText.length >= 2) {
			setOptions(tempOptions);
		}
	}, [tempOptions, open]);


	useEffect(() => {
		if (apiUrl) {
			api.get(apiUrl).then((res) => {
				console.log("res.data: ", res.data)
				const formatted = res.data.map((item) => ({
					label: getNestedValue(item, labelKey) || 'Unnamed',
					value: String(getNestedValue(item, valueKey)),
				}));

				setOptions(formatted);

				if (typeof onLoad === 'function') {
					onLoad(res.data);
				}
			});
		} else {
			const formatted = items.map((item) => ({
				label: item[labelKey],
				value: String(item[valueKey]),
			}));
			setOptions(formatted);

			if (typeof onLoad === 'function') {
				onLoad(items);
			}
		}
	}, [apiUrl]);

	return (
		<View style={styles.container}>
			<DropDownPicker
				open={open}
				setOpen={setOpen}
				value={String(value)}
				setValue={(callback) => {
					const result = typeof callback === 'function' ? callback(value) : callback;
					onValueChange?.(String(result));
				}}
				items={options}
				searchable={true}
				searchTextInputProps={{
					value: searchText,
					onChangeText: (text) => setSearchText(text),
				}}
				listMode="MODAL"
				setItems={setOptions}
				placeholder={placeholder}
				style={styles.pickerSelectStyles}
				dropDownContainerStyle={{
					maxHeight: 150,
					borderColor: 'lightgray',
					zIndex: 10000,
					elevation: 10
				}}
				zIndex={9999999}
			/>

		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		// marginBottom: 20,
	},
	pickerSelectStyles: {
		borderColor: '#ccc',
		borderRadius: 6,
		minHeight: 45,
	},
});
