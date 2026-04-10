/**
 * Face Detection Service
 *
 * Detects faces in camera snapshots for smart tap-to-focus.
 * Backend: Google Cloud Vision API (falls back to stub if API key missing).
 *
 * Usage:
 *   const result = await FaceDetectionService.detectFacesFromSnapshot(imageUri);
 *   if (result.success && result.faces.length > 0) {
 *     // Use result.faces to adjust focus
 *   }
 */

/**
 * Represents a detected face and its properties
 */
export interface DetectedFace {
  /** Normalized position in image space (0-1) */
  x: number;
  y: number;
  /** Normalized size relative to image (0-1) */
  width: number;
  height: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Optional: detailed landmarks if available */
  landmarks?: FaceLandmarks;
}

/**
 * Facial landmarks for precise focus targeting
 */
export interface FaceLandmarks {
  /** Left eye position (normalized 0-1) */
  leftEye?: { x: number; y: number };
  /** Right eye position (normalized 0-1) */
  rightEye?: { x: number; y: number };
  /** Nose tip (normalized 0-1) */
  nose?: { x: number; y: number };
  /** Mouth center (normalized 0-1) */
  mouth?: { x: number; y: number };
}

/**
 * Result of face detection operation
 */
export interface FaceDetectionResult {
  /** Whether detection succeeded (not necessarily faces found, but process ran) */
  success: boolean;
  /** List of detected faces */
  faces: DetectedFace[];
  /** Optional error message if detection failed */
  error?: string;
  /** Timestamp of detection for debugging */
  timestamp: number;
  /** Which backend performed the detection */
  backend: 'stub' | 'google-vision' | 'tensorflow' | 'firebase-ml';
}

/**
 * Google Cloud Vision API response types (internal use only)
 */
interface VisionVertex {
  x: number;
  y: number;
}

interface VisionLandmark {
  type: string;
  position: { x: number; y: number; z?: number };
}

interface VisionFaceAnnotation {
  boundingPoly?: { vertices: VisionVertex[] };
  landmarks?: VisionLandmark[];
  detectionConfidence?: number;
}

interface VisionApiResponse {
  responses?: Array<{
    faceAnnotations?: VisionFaceAnnotation[];
  }>;
  error?: { message: string; code?: number };
}

/** Timeout for the Vision API network request (ms) */
const VISION_API_TIMEOUT_MS = 5000;

/**
 * Face Detection Service
 */
class FaceDetectionServiceImpl {
  private isInitialized = false;
  private backend: 'stub' | 'google-vision' | 'tensorflow' | 'firebase-ml' = 'stub';

  /**
   * Initialize the face detection service
   */
  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  /**
   * Detect faces in an image snapshot from camera tap
   *
   * Phase 300.6: Real implementation using Google Cloud Vision API
   * Falls back to stub behavior if API key not configured
   *
   * @param imageUri - URI of the image to analyze (file:// or base64 data URI)
   * @param options - Detection options (reserved for future use)
   * @returns Face detection result with detected faces or error info
   */
  async detectFacesFromSnapshot(
    imageUri: string,
    options?: { scaleFactor?: number; minConfidence?: number },
  ): Promise<FaceDetectionResult> {
    const timestamp = Date.now();

    // Validate input
    if (!imageUri || typeof imageUri !== 'string') {
      return {
        success: false,
        faces: [],
        error: 'Invalid image URI provided',
        timestamp,
        backend: 'google-vision',
      };
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

    // Fallback to stub if no API key configured
    if (!apiKey) {
      return {
        success: true,
        faces: [],
        timestamp,
        backend: 'stub',
      };
    }

    try {
      // STEP 1: Fetch image and convert to base64
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);

      // STEP 2: Call Google Cloud Vision API (with timeout protection)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), VISION_API_TIMEOUT_MS);

      let visionResponse: Response;
      try {
        visionResponse = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: [
                {
                  image: { content: base64 },
                  features: [{ type: 'FACE_DETECTION', maxResults: 5 }],
                },
              ],
            }),
            signal: controller.signal,
          },
        );
      } finally {
        clearTimeout(timeoutId);
      }

      if (!visionResponse.ok) {
        throw new Error(`Vision API error: ${visionResponse.status}`);
      }

      const data: VisionApiResponse = await visionResponse.json();

      // STEP 3: Parse and validate response
      if (data.error) {
        throw new Error(`Vision API returned error: ${data.error.message}`);
      }

      const faceAnnotations: VisionFaceAnnotation[] =
        data.responses?.[0]?.faceAnnotations || [];

      // STEP 4: Map Google Vision response to DetectedFace structure
      const imageWidth = 1080;
      const imageHeight = 1920;

      const faces: DetectedFace[] = faceAnnotations
        .map((face: VisionFaceAnnotation) => {
          const vertices: VisionVertex[] = face.boundingPoly?.vertices || [];
          if (vertices.length < 4) return null;

          const xs = vertices.map((v) => v.x || 0);
          const ys = vertices.map((v) => v.y || 0);

          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);

          const x = minX / imageWidth;
          const y = minY / imageHeight;
          const width = (maxX - minX) / imageWidth;
          const height = (maxY - minY) / imageHeight;

          // Extract landmarks if available
          let landmarks: FaceLandmarks | undefined;
          if (face.landmarks && face.landmarks.length > 0) {
            landmarks = {};
            for (const lm of face.landmarks) {
              const type = lm.type?.toLowerCase() || '';
              const pos = lm.position || { x: 0, y: 0 };

              if (type.includes('left_eye')) {
                landmarks.leftEye = { x: pos.x / imageWidth, y: pos.y / imageHeight };
              } else if (type.includes('right_eye')) {
                landmarks.rightEye = { x: pos.x / imageWidth, y: pos.y / imageHeight };
              } else if (type.includes('nose')) {
                landmarks.nose = { x: pos.x / imageWidth, y: pos.y / imageHeight };
              } else if (type.includes('mouth')) {
                landmarks.mouth = { x: pos.x / imageWidth, y: pos.y / imageHeight };
              }
            }
          }

          const confidence = Math.min(1, Math.max(0, face.detectionConfidence ?? 0.5));

          return {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y)),
            width: Math.max(0, Math.min(1, width)),
            height: Math.max(0, Math.min(1, height)),
            confidence,
            landmarks: landmarks && Object.keys(landmarks).length > 0 ? landmarks : undefined,
          } as DetectedFace;
        })
        .filter((f): f is DetectedFace => f !== null);

      // STEP 5: Return success result
      return {
        success: true,
        faces,
        timestamp,
        backend: 'google-vision' as const,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.name === 'AbortError'
            ? 'timeout'
            : error.message
          : 'Unknown detection error';

      if (message !== 'timeout') {
        console.log('[FaceDetectionService] Google Vision error:', message);
      }

      return {
        success: false,
        faces: [],
        error: message,
        timestamp,
        backend: 'google-vision' as const,
      };
    }
  }

  /**
   * Helper: Convert blob to base64 string
   * Compatible with React Native and browser environments
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 content after "data:..." prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read blob as base64'));
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get the primary face from detection results (e.g., largest or highest confidence)
   *
   * Useful for focusing on the most prominent face in the frame
   *
   * @param result - Result from detectFacesFromSnapshot
   * @returns The primary face, or null if none found
   */
  getPrimaryFace(result: FaceDetectionResult): DetectedFace | null {
    if (!result.success || result.faces.length === 0) {
      return null;
    }

    // Return highest confidence face
    return result.faces.reduce((primary, current) =>
      current.confidence > primary.confidence ? current : primary,
    );
  }

  /**
   * Convert normalized face coordinates to screen pixel coordinates
   *
   * Useful for positioning focus ring or other UI elements
   *
   * @param normalizedFace - Face with normalized coordinates (0-1)
   * @param screenWidth - Actual screen width in pixels
   * @param screenHeight - Actual screen height in pixels
   * @returns Face coordinates in screen pixels
   */
  toScreenCoordinates(
    normalizedFace: DetectedFace,
    screenWidth: number,
    screenHeight: number,
  ): DetectedFace {
    return {
      x: normalizedFace.x * screenWidth,
      y: normalizedFace.y * screenHeight,
      width: normalizedFace.width * screenWidth,
      height: normalizedFace.height * screenHeight,
      confidence: normalizedFace.confidence,
      landmarks: normalizedFace.landmarks
        ? {
            leftEye: normalizedFace.landmarks.leftEye
              ? {
                  x: normalizedFace.landmarks.leftEye.x * screenWidth,
                  y: normalizedFace.landmarks.leftEye.y * screenHeight,
                }
              : undefined,
            rightEye: normalizedFace.landmarks.rightEye
              ? {
                  x: normalizedFace.landmarks.rightEye.x * screenWidth,
                  y: normalizedFace.landmarks.rightEye.y * screenHeight,
                }
              : undefined,
            nose: normalizedFace.landmarks.nose
              ? {
                  x: normalizedFace.landmarks.nose.x * screenWidth,
                  y: normalizedFace.landmarks.nose.y * screenHeight,
                }
              : undefined,
            mouth: normalizedFace.landmarks.mouth
              ? {
                  x: normalizedFace.landmarks.mouth.x * screenWidth,
                  y: normalizedFace.landmarks.mouth.y * screenHeight,
                }
              : undefined,
          }
        : undefined,
    };
  }

  /**
   * Check if the service is ready to use
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current backend name
   */
  getBackend(): string {
    return this.backend;
  }

  /**
   * Phase 300.3: Select the best face candidate for a given tap point
   *
   * Scores faces by distance from tap point to face center.
   * Prefers higher confidence if distances are very similar.
   *
   * @param faces - Array of detected faces (normalized coordinates 0-1)
   * @param tapX - Tap X coordinate in screen pixels
   * @param tapY - Tap Y coordinate in screen pixels
   * @param screenWidth - Screen width in pixels
   * @param screenHeight - Screen height in pixels
   * @returns Best face candidate, or null if no valid faces
   *
   * Pure function: deterministic, no side effects
   */
  getBestDetectedFace(
    faces: DetectedFace[],
    tapX: number,
    tapY: number,
    screenWidth: number,
    screenHeight: number,
  ): DetectedFace | null {
    if (!faces || faces.length === 0) {
      return null;
    }

    // Convert tap point from screen to normalized coordinates
    const normalizedTapX = tapX / screenWidth;
    const normalizedTapY = tapY / screenHeight;

    // Find face closest to tap point
    let bestFace = faces[0];
    let bestDistance = Infinity;

    for (const face of faces) {
      // Face center in normalized coordinates
      const faceX = face.x + face.width / 2;
      const faceY = face.y + face.height / 2;

      // Distance squared (avoid sqrt for perf)
      const dx = faceX - normalizedTapX;
      const dy = faceY - normalizedTapY;
      const distSquared = dx * dx + dy * dy;

      // Accept if closer, or if same distance but higher confidence
      const isBetter =
        distSquared < bestDistance ||
        (distSquared === bestDistance && face.confidence > bestFace.confidence);

      if (isBetter) {
        bestDistance = distSquared;
        bestFace = face;
      }
    }

    return bestFace;
  }

  /**
   * Phase 300.3: Compute the best smart focus point from a detected face
   *
   * Priority:
   * 1) Nose landmark (most stable)
   * 2) Midpoint between left and right eyes
   * 3) Face center (fallback)
   *
   * @param face - Detected face with normalized coordinates
   * @param screenWidth - Screen width in pixels
   * @param screenHeight - Screen height in pixels
   * @returns Smart focus point in screen pixel coordinates, or null if invalid
   *
   * Pure function: deterministic, no side effects
   */
  getSmartFocusPointFromFace(
    face: DetectedFace,
    screenWidth: number,
    screenHeight: number,
  ): { x: number; y: number } | null {
    if (!face) return null;

    let targetX: number | null = null;
    let targetY: number | null = null;

    // Priority 1: Nose landmark
    if (face.landmarks?.nose) {
      targetX = face.landmarks.nose.x;
      targetY = face.landmarks.nose.y;
    }
    // Priority 2: Eye midpoint
    else if (
      face.landmarks?.leftEye &&
      face.landmarks.rightEye &&
      typeof face.landmarks.leftEye.x === 'number' &&
      typeof face.landmarks.leftEye.y === 'number' &&
      typeof face.landmarks.rightEye.x === 'number' &&
      typeof face.landmarks.rightEye.y === 'number'
    ) {
      targetX = (face.landmarks.leftEye.x + face.landmarks.rightEye.x) / 2;
      targetY = (face.landmarks.leftEye.y + face.landmarks.rightEye.y) / 2;
    }
    // Priority 3: Face center (always available)
    else {
      targetX = face.x + face.width / 2;
      targetY = face.y + face.height / 2;
    }

    // Validate and convert to screen coordinates
    if (targetX === null || targetY === null || isNaN(targetX) || isNaN(targetY)) {
      return null;
    }

    // Convert from normalized to screen pixels
    let screenX = targetX * screenWidth;
    let screenY = targetY * screenHeight;

    // Clamp to screen bounds
    screenX = Math.max(0, Math.min(screenX, screenWidth));
    screenY = Math.max(0, Math.min(screenY, screenHeight));

    return { x: screenX, y: screenY };
  }

  /**
   * Phase 300.3: Validate that a focus point has valid coordinates
   *
   * @param point - Point to validate { x, y } or null
   * @returns true if point is valid and within expected numeric ranges
   *
   * Pure function: deterministic, no side effects
   */
  isValidFocusPoint(point: { x: number; y: number } | null): boolean {
    if (!point) return false;
    return (
      typeof point.x === 'number' &&
      typeof point.y === 'number' &&
      !isNaN(point.x) &&
      !isNaN(point.y) &&
      point.x >= 0 &&
      point.y >= 0
    );
  }
}

// Singleton instance
const FaceDetectionService = new FaceDetectionServiceImpl();

export default FaceDetectionService;
