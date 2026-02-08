/**
 * Clinics Tab - Redirects to full Public Clinics Explorer
 * This tab simply imports and renders the PublicClinicsExplorer component
 * which has all the filtering, search, and navigation logic
 */

import React from 'react';
import PublicClinicsExplorer from '../public/clinics';

export default function ClinicsTab() {
  return <PublicClinicsExplorer />; 
}
