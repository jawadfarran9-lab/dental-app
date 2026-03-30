/**
 * Clinic Profile Media — Type Definition
 *
 * Represents a single media item on a clinic's profile grid.
 * Stored in: clinics/{clinicId}/media
 */
export interface ClinicMedia {
  id: string;
  /** 'post' = image/carousel, 'reel' = short video */
  type: 'post' | 'reel';
  /** Thumbnail URL (square preview) */
  thumbnailUrl: string;
  /** Full-resolution media URL (primary / single image or video) */
  mediaUrl?: string;
  /** Array of full-res URLs for carousel posts (length > 1 = carousel) */
  mediaUrls?: string[];
  /** Number of images in a carousel (undefined or 1 = single) */
  mediaCount?: number;
  /** Whether the primary media is a video */
  isVideo?: boolean;
  /** Caption / description */
  caption?: string;
  /** Clinic display name (denormalised for viewer header) */
  clinicName?: string;
  /** Parent clinic document ID (denormalised for service calls) */
  clinicId?: string;
  /** Cached like count (managed by engagementService) */
  likeCount?: number;
  /** Unix timestamp (ms) */
  createdAt: number;
}
