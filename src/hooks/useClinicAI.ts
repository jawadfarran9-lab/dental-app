/**
 * useClinicAI Hook
 * Manages clinic-specific AI configuration and data
 * Supports custom staff, clinic-specific behavior, and routing
 */

import { useClinic } from '@/src/context/ClinicContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface ClinicStaff {
	id: string;
	name: string;
	role: string; // 'dentist' | 'hygienist' | 'assistant' | 'admin'
	specialization?: string;
	bio?: string;
	active: boolean;
}

export interface ClinicAIConfig {
	clinicId: string;
	clinicName: string;
	staffDirectory: ClinicStaff[];
	aiPersonality: 'professional' | 'friendly' | 'formal'; // Can be extended
	responseLanguagePreference: 'user-language' | 'clinic-default';
	enableEmergencyRouting: boolean;
	emergencyContactPhone?: string;
	clinicAddress?: string;
	clinicHours?: string;
	specialties: string[]; // e.g., ['implants', 'orthodontics', 'pediatrics']
}

interface UseClinicAIResult {
	config: ClinicAIConfig | null;
	staff: ClinicStaff[];
	isLoading: boolean;
	error: string | null;
	updateClinicConfig: (config: Partial<ClinicAIConfig>) => Promise<void>;
	addStaff: (staff: ClinicStaff) => Promise<void>;
	removeStaff: (staffId: string) => Promise<void>;
	updateStaff: (staffId: string, updates: Partial<ClinicStaff>) => Promise<void>;
}

export function useClinicAI(): UseClinicAIResult {
	const clinicContext = useClinic();
	const [config, setConfig] = useState<ClinicAIConfig | null>(null);
	const [staff, setStaff] = useState<ClinicStaff[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const clinicId = clinicContext?.clinicId;

	// Load clinic AI configuration from AsyncStorage
	useEffect(() => {
		if (!clinicId) {
			setIsLoading(false);
			setConfig(null);
			setStaff([]);
			return;
		}

		const loadClinicConfig = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Try to load existing config
				const configKey = `clinicAI:${clinicId}:config`;
				const staffKey = `clinicAI:${clinicId}:staff`;

				const [configData, staffData] = await Promise.all([
					AsyncStorage.getItem(configKey),
					AsyncStorage.getItem(staffKey),
				]);

				if (configData) {
					setConfig(JSON.parse(configData));
				} else {
					// Create default config if none exists
					const defaultConfig: ClinicAIConfig = {
						clinicId,
						clinicName: 'My Clinic',
						staffDirectory: [],
						aiPersonality: 'professional',
						responseLanguagePreference: 'user-language',
						enableEmergencyRouting: true,
						specialties: [],
					};
					setConfig(defaultConfig);
				}

				if (staffData) {
					setStaff(JSON.parse(staffData));
				} else {
					setStaff([]);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load clinic config');
				setConfig(null);
				setStaff([]);
			} finally {
				setIsLoading(false);
			}
		};

		loadClinicConfig();
	}, [clinicId]);

	// Update clinic configuration
	const updateClinicConfig = async (updates: Partial<ClinicAIConfig>) => {
		if (!clinicId || !config) {
			throw new Error('No clinic selected');
		}

		try {
			const updatedConfig: ClinicAIConfig = {
				...config,
				...updates,
				clinicId, // Ensure clinicId is not changed
			};

			const configKey = `clinicAI:${clinicId}:config`;
			await AsyncStorage.setItem(configKey, JSON.stringify(updatedConfig));
			setConfig(updatedConfig);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to update config';
			setError(errorMsg);
			throw err;
		}
	};

	// Add a staff member
	const addStaff = async (newStaff: ClinicStaff) => {
		if (!clinicId) {
			throw new Error('No clinic selected');
		}

		try {
			const updatedStaff = [...staff, newStaff];
			const staffKey = `clinicAI:${clinicId}:staff`;
			await AsyncStorage.setItem(staffKey, JSON.stringify(updatedStaff));
			setStaff(updatedStaff);

			// Also update config's staffDirectory
			if (config) {
				await updateClinicConfig({
					...config,
					staffDirectory: updatedStaff,
				});
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to add staff';
			setError(errorMsg);
			throw err;
		}
	};

	// Remove a staff member
	const removeStaff = async (staffId: string) => {
		if (!clinicId) {
			throw new Error('No clinic selected');
		}

		try {
			const updatedStaff = staff.filter(s => s.id !== staffId);
			const staffKey = `clinicAI:${clinicId}:staff`;
			await AsyncStorage.setItem(staffKey, JSON.stringify(updatedStaff));
			setStaff(updatedStaff);

			// Also update config's staffDirectory
			if (config) {
				await updateClinicConfig({
					...config,
					staffDirectory: updatedStaff,
				});
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to remove staff';
			setError(errorMsg);
			throw err;
		}
	};

	// Update a staff member
	const updateStaff = async (staffId: string, updates: Partial<ClinicStaff>) => {
		if (!clinicId) {
			throw new Error('No clinic selected');
		}

		try {
			const updatedStaff = staff.map(s =>
				s.id === staffId ? { ...s, ...updates } : s,
			);

			const staffKey = `clinicAI:${clinicId}:staff`;
			await AsyncStorage.setItem(staffKey, JSON.stringify(updatedStaff));
			setStaff(updatedStaff);

			// Also update config's staffDirectory
			if (config) {
				await updateClinicConfig({
					...config,
					staffDirectory: updatedStaff,
				});
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to update staff';
			setError(errorMsg);
			throw err;
		}
	};

	return {
		config,
		staff,
		isLoading,
		error,
		updateClinicConfig,
		addStaff,
		removeStaff,
		updateStaff,
	};
}
