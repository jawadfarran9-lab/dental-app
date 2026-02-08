// Patient Media & Annotation Types

export interface PatientMedia {
  id: string; // imageId = timestamp_uuid
  patientId: string;
  clinicId: string;
  
  // Storage URLs
  originalUrl: string; // clinics/{clinicId}/patients/{patientId}/images/{id}.jpg
  annotatedUrl?: string; // clinics/{clinicId}/patients/{patientId}/images/{id}_annotated_v1.jpg
  
  // Metadata
  hasAnnotation: boolean;
  createdAt: number; // timestamp
  uploadedBy: 'clinic'; // Only clinic can upload
  
  // Optional: Session grouping
  sessionId?: string;
  
  // For display
  thumbnailUrl?: string; // Usually same as originalUrl/annotatedUrl
}

export interface AnnotationData {
  id: string;
  mediaId: string;
  version: number; // v1, v2, etc.
  
  // Drawing data
  strokes: StrokeData[];
  textOverlays?: TextOverlay[];
  
  // Metadata
  createdAt: number;
  createdBy: 'clinic';
  clinicId: string;
  patientId: string;
}

export interface StrokeData {
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  timestamp: number;
}

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  timestamp: number;
}

export interface PatientSession {
  id: string;
  clinicId: string;
  patientId: string;
  
  // Session info
  title: string; // e.g., "Initial Consultation"
  description?: string;
  date: number; // timestamp
  
  // Images in this session
  mediaIds: string[]; // Array of media IDs
  
  // Metadata
  createdAt: number;
  createdBy: string; // clinicId or clinic name
  updatedAt: number;
  lastEditedAt?: number; // PHASE AA-3: For visual edit indicators
}

export interface TimelineEntry {
  id: string;
  type: 'visit' | 'session' | 'image_upload' | 'image_annotated';
  patientId: string;
  clinicId: string;
  
  timestamp: number;
  
  // Payload depends on type
  relatedSessionId?: string;
  relatedMediaId?: string;
  
  title: string;
  description?: string;
  
  // For sorting (latest first)
  sortKey: number; // Use timestamp, inverted for descending
}

/**
 * Clinic Settings & Branding
 * Stores clinic profile, branding, and preferences
 */
export interface ClinicSettings {
  id: string; // clinicId
  
  // Clinic Profile
  clinicName: string;
  country?: string;
  city?: string;
  phoneNumber?: string;
  email?: string;
  workingHours?: string; // e.g., "9:00 AM - 5:00 PM"
  
  // Branding
  logoUrl?: string; // Firebase Storage URL
  primaryColor?: string; // Hex color code (default: #D4AF37)
  secondaryColor?: string; // Hex color code (default: #0B0F1A)
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  ownerUid: string; // Only owner can edit
}
