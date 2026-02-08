import { db } from '@/firebaseConfig';
import { encodeGeohash } from '@/src/utils/geohash';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

export type PublicClinic = {
  id: string;
  clinicId: string;
  ownerId: string;
  name: string;
  heroImage?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  geo?: { lat: number; lng: number };
  geohash?: string;
  isPublished: boolean;
  tier?: 'pro' | 'standard'; // G1: UI-only tier signal (defaults to standard)
  averageRating?: number; // Average rating from 1-5
  totalReviews?: number; // Total number of reviews
  specialty?: 'general' | 'orthodontics' | 'cosmetic' | 'pediatric' | 'surgery' | 'endodontics' | 'periodontics' | 'prosthodontics'; // Clinic specialty
};

export type DerivedPlace = {
  countryCode?: string; // ISO alpha-2 when available
  country?: string;
  city?: string;
};

export async function fetchPublishedClinics(): Promise<PublicClinic[]> {
  const qRef = query(collection(db, 'clinics_public'), where('isPublished', '==', true));
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PublicClinic[];
}

export async function fetchPublishedClinic(publicId: string): Promise<PublicClinic | null> {
  const ref = doc(db, 'clinics_public', publicId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  if (data.isPublished !== true) return null;
  return { id: snap.id, ...data } as PublicClinic;
}

export async function fetchClinicPublicOwner(publicId: string): Promise<PublicClinic | null> {
  const ref = doc(db, 'clinics_public', publicId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as PublicClinic;
}

export function ensureGeohash(c: PublicClinic): PublicClinic {
  if (c.geohash || !c.geo || typeof c.geo.lat !== 'number' || typeof c.geo.lng !== 'number') return c;
  return { ...c, geohash: encodeGeohash(c.geo.lat, c.geo.lng, 7) };
}

export async function reverseGeocode(lat?: number, lng?: number): Promise<DerivedPlace> {
  if (typeof lat !== 'number' || typeof lng !== 'number') return {};
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return {};
    const data = await res.json();
    const addr = data?.address || {};
    return {
      countryCode: addr.country_code?.toUpperCase?.(),
      country: addr.country,
      city: addr.city || addr.town || addr.village || addr.hamlet,
    };
  } catch {
    return {};
  }
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lng - a.lng);
  const la1 = deg2rad(a.lat);
  const la2 = deg2rad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function deg2rad(d: number) { return d * Math.PI / 180; }
