import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

export interface SelectedLocation {
  id: string;
  name: string;
  cityName?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

interface LocationSelectionContextType {
  selectedLocation: SelectedLocation | null;
  selectLocation: (location: SelectedLocation) => void;
  clearLocation: () => void;
}

const LocationSelectionContext = createContext<LocationSelectionContextType | undefined>(undefined);

export function LocationSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);

  const selectLocation = useCallback((location: SelectedLocation) => {
    setSelectedLocation(location);
  }, []);

  const clearLocation = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  return (
    <LocationSelectionContext.Provider value={{ selectedLocation, selectLocation, clearLocation }}>
      {children}
    </LocationSelectionContext.Provider>
  );
}

export function useLocationSelection() {
  const context = useContext(LocationSelectionContext);
  if (context === undefined) {
    throw new Error('useLocationSelection must be used within a LocationSelectionProvider');
  }
  return context;
}
