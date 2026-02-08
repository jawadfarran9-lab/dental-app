/**
 * STEP G - Patient Imaging Types
 * 
 * All interfaces for patient imaging + annotations
 */

export type ImageType = 'xray' | 'photo';

export interface ImageStroke {
  id: string;
  color: string;      // Default: "#FFD700"
  width: number;      // Default: 3
  points: Array<{ x: number; y: number }>; // NORMALIZED 0..1
}

export interface ImageText {
  id: string;
  text: string;
  x: number;         // NORMALIZED 0..1
  y: number;         // NORMALIZED 0..1
  color: string;     // Default: "#FFD700"
}

export interface ImageAnnotations {
  version: 1;
  strokes: ImageStroke[];
  texts: ImageText[];
}

export interface PatientImage {
  id?: string;
  clinicId: string;
  patientId: string;
  imageId: string;
  type: ImageType;
  storagePathOriginal: string;
  storagePathPreview?: string;
  downloadUrlOriginal?: string;
  downloadUrlPreview?: string;
  width: number;
  height: number;
  createdAt: any;
  createdByUid: string;
  annotations: ImageAnnotations;
}

export interface UploadProgress {
  imageId: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}
