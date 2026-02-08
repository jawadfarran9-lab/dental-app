/**
 * Clinic AI Router Hook
 * Manages AI response routing based on clinic-specific rules
 * Handles emergency routing, staff assignment, and specialty-based responses
 */

import { useClinic } from '@/src/context/ClinicContext';
import { useCallback } from 'react';
import { ClinicStaff, useClinicAI } from './useClinicAI';

export type RouteAction = 
	| 'chat-response'      // Regular chat response
	| 'emergency-alert'    // Route to emergency contact
	| 'staff-assignment'   // Assign to specific staff member
	| 'escalation'         // Escalate to higher level
	| 'appointment-book';  // Route to appointment booking

export interface RoutingDecision {
	action: RouteAction;
	assignedStaff?: ClinicStaff;
	priority: 'normal' | 'high' | 'emergency';
	reason: string;
	shouldNotifyStaff: boolean;
}

export interface ClinicAIRouterResult {
	routeMessage: (userMessage: string, category: string) => RoutingDecision;
	getStaffForSpecialty: (specialty: string) => ClinicStaff[];
	isEmergencySituation: (category: string) => boolean;
	getResponsePersonality: () => string;
}

export function useClinicAIRouter(): ClinicAIRouterResult {
	const clinicContext = useClinic();
	const { config, staff } = useClinicAI();

	// Determine if message indicates emergency
	const isEmergencySituation = useCallback((category: string): boolean => {
		return category === 'emergency';
	}, []);

	// Get staff members for specific specialty
	const getStaffForSpecialty = useCallback((specialty: string): ClinicStaff[] => {
		if (!staff) return [];
		return staff.filter(
			s => s.active && 
			     (s.specialization?.toLowerCase().includes(specialty.toLowerCase()) || 
			      s.role === 'dentist')
		);
	}, [staff]);

	// Get clinic's AI response personality
	const getResponsePersonality = useCallback((): string => {
		return config?.aiPersonality || 'professional';
	}, [config]);

	// Route message based on content and clinic configuration
	const routeMessage = useCallback((userMessage: string, category: string): RoutingDecision => {
		const message = userMessage.toLowerCase();
		
		// Check for emergency keywords
		const emergencyKeywords = [
			'emergency',
			'severe pain',
			'severe bleeding',
			'trauma',
			'accident',
			'knocked out',
			'difficulty breathing',
			'swelling in throat',
		];

		const isEmergency = emergencyKeywords.some(keyword => message.includes(keyword)) || 
		                    category === 'emergency';

		// Emergency routing
		if (isEmergency && config?.enableEmergencyRouting) {
			return {
				action: 'emergency-alert',
				priority: 'emergency',
				reason: 'Emergency situation detected',
				shouldNotifyStaff: true,
			};
		}

		// Appointment booking request
		const appointmentKeywords = ['book', 'appointment', 'schedule', 'available', 'time'];
		if (appointmentKeywords.some(keyword => message.includes(keyword))) {
			return {
				action: 'appointment-book',
				priority: 'normal',
				reason: 'Appointment booking requested',
				shouldNotifyStaff: false,
			};
		}

		// Specialty-based routing
		if (config?.specialties && config.specialties.length > 0) {
			for (const specialty of config.specialties) {
				if (message.includes(specialty.toLowerCase())) {
					const specialistStaff = getStaffForSpecialty(specialty);
					if (specialistStaff.length > 0) {
						return {
							action: 'staff-assignment',
							assignedStaff: specialistStaff[0],
							priority: 'high',
							reason: `Routed to ${specialty} specialist`,
							shouldNotifyStaff: true,
						};
					}
				}
			}
		}

		// Default: Regular chat response
		return {
			action: 'chat-response',
			priority: 'normal',
			reason: 'Standard AI chat response',
			shouldNotifyStaff: false,
		};
	}, [config, getStaffForSpecialty]);

	return {
		routeMessage,
		getStaffForSpecialty,
		isEmergencySituation,
		getResponsePersonality,
	};
}
