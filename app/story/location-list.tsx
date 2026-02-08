import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '@/src/context/AuthContext';
import { useLocationSelection } from '@/src/context/LocationSelectionContext';
import { db } from '@/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// ========== Types ==========
interface LocationItem {
  id: string;
  name: string;
  address?: string;
  distance?: string;
  distanceMeters?: number;
  isClinic?: boolean;
  lat?: number;
  lng?: number;
  cityName?: string; // The actual city/locality name for the sticker
}

// Allowed place types for city-level locations
const ALLOWED_PLACE_TYPES = [
  'locality',
  'sublocality',
  'sublocality_level_1',
  'sublocality_level_2',
  'administrative_area_level_3',
  'administrative_area_level_2',
  'neighborhood',
  'postal_town',
];

// ========== Constants ==========
const GOOGLE_PLACES_API_KEY = 'AIzaSyB7aLO_UubjP3vw3xwc7xHb6mgGsQy5kWs';

// ========== Utility Functions ==========
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Return in meters
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

// ========== Reverse Geocoding - Get City Name from Coordinates ==========
const getCityFromCoordinates = async (
  lat: number,
  lng: number
): Promise<{ cityName: string; address?: string } | null> => {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}&result_type=locality|sublocality|administrative_area_level_3`;
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const result = data.results[0];
      // Extract the locality/city name from address components
      const addressComponents = result.address_components || [];
      
      // Priority order: locality > sublocality > admin_area_level_3 > admin_area_level_2
      const locality = addressComponents.find((c: any) => c.types.includes('locality'));
      const sublocality = addressComponents.find((c: any) => 
        c.types.includes('sublocality') || c.types.includes('sublocality_level_1')
      );
      const adminArea3 = addressComponents.find((c: any) => c.types.includes('administrative_area_level_3'));
      const adminArea2 = addressComponents.find((c: any) => c.types.includes('administrative_area_level_2'));

      const cityName = locality?.long_name || sublocality?.long_name || adminArea3?.long_name || adminArea2?.long_name;
      
      if (cityName) {
        return {
          cityName,
          address: result.formatted_address,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('[LOCATION] Reverse geocoding error:', error);
    return null;
  }
};

// ========== Fetch Nearby Cities/Localities ==========
const fetchNearbyCities = async (
  lat: number,
  lng: number,
  searchQuery?: string
): Promise<{ places: LocationItem[]; error?: string }> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log('[LOCATION] No Google Places API key configured');
    return { places: [], error: 'API key not configured' };
  }

  try {
    // Use Geocoding API to get nearby localities
    // Search in multiple radii to get a good variety of nearby places
    const radiuses = [1000, 5000, 10000, 25000]; // meters
    const allPlaces: LocationItem[] = [];
    const seenCities = new Set<string>();

    // First, get the current location's city
    const currentCity = await getCityFromCoordinates(lat, lng);
    if (currentCity) {
      allPlaces.push({
        id: 'current_city',
        name: currentCity.cityName,
        cityName: currentCity.cityName,
        address: currentCity.address,
        lat,
        lng,
        distanceMeters: 0,
        distance: '0m',
      });
      seenCities.add(currentCity.cityName.toLowerCase());
    }

    // Use Places API with type restrictions to find nearby localities
    if (searchQuery) {
      // Text search with city/region filter
      const endpoint = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery + ' city')}&location=${lat},${lng}&radius=50000&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        for (const place of data.results) {
          const types = place.types || [];
          // Only include if it has locality-related types
          const isLocality = types.some((t: string) => ALLOWED_PLACE_TYPES.includes(t));
          
          if (isLocality || types.includes('political')) {
            const placeName = place.name;
            if (!seenCities.has(placeName.toLowerCase())) {
              const placeLat = place.geometry?.location?.lat || lat;
              const placeLng = place.geometry?.location?.lng || lng;
              const distanceMeters = calculateDistance(lat, lng, placeLat, placeLng);
              
              allPlaces.push({
                id: place.place_id,
                name: placeName,
                cityName: placeName,
                address: place.formatted_address,
                lat: placeLat,
                lng: placeLng,
                distanceMeters,
                distance: formatDistance(distanceMeters),
              });
              seenCities.add(placeName.toLowerCase());
            }
          }
        }
      }
    } else {
      // Get cities at various distances using geocoding
      const offsets = [
        { lat: 0.02, lng: 0 },      // ~2km north
        { lat: -0.02, lng: 0 },     // ~2km south
        { lat: 0, lng: 0.02 },      // ~2km east
        { lat: 0, lng: -0.02 },     // ~2km west
        { lat: 0.05, lng: 0.05 },   // ~7km northeast
        { lat: -0.05, lng: -0.05 }, // ~7km southwest
        { lat: 0.1, lng: 0 },       // ~11km north
        { lat: -0.1, lng: 0 },      // ~11km south
        { lat: 0, lng: 0.15 },      // ~16km east
        { lat: 0.08, lng: -0.08 },  // ~11km northwest
      ];

      // Fetch cities at offset locations in parallel
      const cityPromises = offsets.map(offset => 
        getCityFromCoordinates(lat + offset.lat, lng + offset.lng)
      );
      const cityResults = await Promise.all(cityPromises);

      cityResults.forEach((result, index) => {
        if (result && !seenCities.has(result.cityName.toLowerCase())) {
          const offsetLat = lat + offsets[index].lat;
          const offsetLng = lng + offsets[index].lng;
          const distanceMeters = calculateDistance(lat, lng, offsetLat, offsetLng);
          
          allPlaces.push({
            id: `city_${index}`,
            name: result.cityName,
            cityName: result.cityName,
            address: result.address,
            lat: offsetLat,
            lng: offsetLng,
            distanceMeters,
            distance: formatDistance(distanceMeters),
          });
          seenCities.add(result.cityName.toLowerCase());
        }
      });
    }

    // Sort by distance
    allPlaces.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));

    return { places: allPlaces };
  } catch (error) {
    console.error('[LOCATION] Error fetching cities:', error);
    return { places: [], error: error instanceof Error ? error.message : 'Network error' };
  }
};

// ========== Location Item Component ==========
const LocationListItem = ({
  item,
  onSelect,
}: {
  item: LocationItem;
  onSelect: (item: LocationItem) => void;
}) => (
  <TouchableOpacity
    style={styles.locationItem}
    onPress={() => onSelect(item)}
    activeOpacity={0.7}
  >
    <View style={styles.locationIcon}>
      <Ionicons
        name={item.isClinic ? 'medical' : 'location'}
        size={20}
        color={item.isClinic ? '#4F5BD5' : '#262626'}
      />
    </View>
    <View style={styles.locationInfo}>
      <Text style={[styles.locationName, item.isClinic && styles.clinicName]} numberOfLines={1}>
        {item.name}
      </Text>
      {item.address && (
        <Text style={styles.locationAddress} numberOfLines={1}>
          {item.address}
        </Text>
      )}
    </View>
    {item.distance && (
      <Text style={styles.locationDistance}>{item.distance}</Text>
    )}
  </TouchableOpacity>
);

// ========== Section Header Component ==========
const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

// ========== Main Screen Component ==========
export default function LocationListScreen() {
  const router = useRouter();
  const { clinicId } = useAuth();
  const { selectLocation } = useLocationSelection();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [clinicLocation, setClinicLocation] = useState<LocationItem | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<LocationItem[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationItem[]>([]);

  // Fetch clinic location from Firestore
  const fetchClinicLocation = useCallback(async () => {
    if (!clinicId) return null;

    try {
      // Try clinics_public first for public location data
      const publicRef = doc(db, 'clinics_public', clinicId);
      const publicSnap = await getDoc(publicRef);

      if (publicSnap.exists()) {
        const data = publicSnap.data();
        if (data.name && (data.address || data.geo)) {
          return {
            id: 'clinic_location',
            name: data.name,
            address: data.address || 'Your clinic',
            isClinic: true,
            lat: data.geo?.lat,
            lng: data.geo?.lng,
          } as LocationItem;
        }
      }

      // Fallback to clinics collection
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnap = await getDoc(clinicRef);

      if (clinicSnap.exists()) {
        const data = clinicSnap.data();
        const name = data.clinicName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
        if (name) {
          return {
            id: 'clinic_location',
            name,
            address: data.address || data.city || 'Your clinic',
            isClinic: true,
          } as LocationItem;
        }
      }

      return null;
    } catch (error) {
      console.error('[LOCATION] Error fetching clinic:', error);
      return null;
    }
  }, [clinicId]);

  // Initialize location data
  useEffect(() => {
    const initializeLocations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch clinic location
        const clinic = await fetchClinicLocation();
        if (clinic) {
          setClinicLocation(clinic);
        }

        // Get current location
        const { status } = await Location.getForegroundPermissionsAsync();
        
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          const { latitude, longitude } = location.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // Update clinic distance if we have both locations
          if (clinic && clinic.lat && clinic.lng) {
            const distanceMeters = calculateDistance(latitude, longitude, clinic.lat, clinic.lng);
            setClinicLocation({
              ...clinic,
              distanceMeters,
              distance: formatDistance(distanceMeters),
            });
          }

          // Fetch nearby cities using Geocoding API
          const { places, error: apiError } = await fetchNearbyCities(latitude, longitude);
          
          if (apiError) {
            setError(apiError);
          }
          
          setNearbyLocations(places);
          setFilteredLocations(places);
        } else {
          // No location permission
          setError('Location permission not granted. Enable location to see nearby cities.');
          setNearbyLocations([]);
          setFilteredLocations([]);
        }
      } catch (error) {
        console.error('[LOCATION] Error initializing:', error);
        setError('Failed to load locations. Please try again.');
        setNearbyLocations([]);
        setFilteredLocations([]);
      } finally {
        setLoading(false);
      }
    };

    initializeLocations();
  }, [fetchClinicLocation]);

  // Filter locations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLocations(nearbyLocations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = nearbyLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.address?.toLowerCase().includes(query)
    );
    setFilteredLocations(filtered);
  }, [searchQuery, nearbyLocations]);

  // Handle search with Google Places API
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !userLocation) return;

    setLoading(true);
    setError(null);
    
    try {
      const { places, error: apiError } = await fetchNearbyCities(
        userLocation.lat,
        userLocation.lng,
        searchQuery
      );
      
      if (apiError) {
        setError(apiError);
      }
      
      setFilteredLocations(places);
    } catch (err) {
      console.error('[LOCATION] Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, userLocation]);

  // Handle location selection
  const handleSelectLocation = useCallback((location: LocationItem) => {
    // Always use cityName if available, otherwise use name
    const stickerName = location.cityName || location.name;
    
    // Store selected location in context and go back to edit screen
    selectLocation({
      id: location.id,
      name: stickerName,
      cityName: stickerName,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
    });
    
    // Navigate back to the edit screen
    router.back();
  }, [router, selectLocation]);

  // Handle close
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Render list item
  const renderItem = useCallback(({ item }: { item: LocationItem }) => (
    <LocationListItem item={item} onSelect={handleSelectLocation} />
  ), [handleSelectLocation]);

  // Get key for list items
  const keyExtractor = useCallback((item: LocationItem) => item.id, []);

  // Build list data with sections
  const listData = React.useMemo(() => {
    const data: (LocationItem | { type: 'header'; title: string })[] = [];

    if (clinicLocation) {
      data.push({ type: 'header', title: 'Your Clinic' } as any);
      data.push(clinicLocation);
    }

    if (filteredLocations.length > 0) {
      data.push({ type: 'header', title: 'Nearby Cities' } as any);
      data.push(...filteredLocations);
    }

    return data;
  }, [clinicLocation, filteredLocations]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Locations</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F5BD5" />
          <Text style={styles.loadingText}>Finding nearby cities...</Text>
        </View>
      ) : (
        /* Location List */
        <FlatList
          data={listData}
          renderItem={({ item }) => {
            if ('type' in item && item.type === 'header') {
              return <SectionHeader title={item.title} />;
            }
            return <LocationListItem item={item as LocationItem} onSelect={handleSelectLocation} />;
          }}
          keyExtractor={(item, index) => {
            if ('type' in item && item.type === 'header') {
              return `header_${item.title}`;
            }
            return (item as LocationItem).id;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={error ? 'alert-circle-outline' : 'location-outline'} 
                size={48} 
                color={error ? '#FF3B30' : '#C4C4C4'} 
              />
              <Text style={[styles.emptyText, error && styles.errorText]}>
                {error ? 'Something went wrong' : 'No locations found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {error || 'Try a different search term'}
              </Text>
              {error && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setError(null);
                    if (userLocation) {
                      setLoading(true);
                      fetchNearbyCities(userLocation.lat, userLocation.lng)
                        .then(({ places, error: apiError }) => {
                          if (apiError) setError(apiError);
                          setNearbyLocations(places);
                          setFilteredLocations(places);
                        })
                        .finally(() => setLoading(false));
                    }
                  }}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ========== Styles ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#262626',
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#262626',
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8E8E93',
  },
  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#262626',
  },
  clinicName: {
    color: '#4F5BD5',
  },
  locationAddress: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  locationDistance: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#262626',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#FF3B30',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4F5BD5',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
