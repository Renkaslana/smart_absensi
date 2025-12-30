/**
 * MediaPipe Service for Face Detection and Liveness Detection
 * 
 * Uses MediaPipe Face Detection and Face Mesh for:
 * - Real-time face detection in browser
 * - Blink detection (Eye Aspect Ratio - EAR)
 * - Head pose estimation (yaw, pitch, roll)
 * - Face presence validation
 * 
 * @author Luna (AbsensiAgent)
 * @date 30 December 2025
 */

import { FaceDetection, Results as FaceDetectionResults } from '@mediapipe/face_detection';
import { FaceMesh, Results as FaceMeshResults } from '@mediapipe/face_mesh';

// Types
export interface FaceDetectionResult {
  detected: boolean;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LivenessResult {
  isLive: boolean;
  blinkDetected: boolean;
  headMovementDetected: boolean;
  leftEAR: number;
  rightEAR: number;
  headPose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
}

export interface BlinkState {
  isBlinking: boolean;
  blinkCount: number;
  lastBlinkTime: number;
  earHistory: number[];
}

// Eye landmark indices for MediaPipe Face Mesh
// Left eye: 33, 160, 158, 133, 153, 144
// Right eye: 362, 385, 387, 263, 373, 380
const LEFT_EYE_INDICES = {
  outer: 33,
  innerTop: 160,
  innerBottom: 144,
  inner: 133,
  outerTop: 158,
  outerBottom: 153,
};

const RIGHT_EYE_INDICES = {
  outer: 263,
  innerTop: 385,
  innerBottom: 380,
  inner: 362,
  outerTop: 387,
  outerBottom: 373,
};

// Constants
const EAR_THRESHOLD = 0.21; // Threshold for blink detection
const EAR_CONSEC_FRAMES = 2; // Frames below threshold to count as blink
const HEAD_MOVEMENT_THRESHOLD = 15; // Degrees for head movement detection

class MediaPipeService {
  private faceDetection: FaceDetection | null = null;
  private faceMesh: FaceMesh | null = null;
  private isInitialized = false;
  private isInitializing = false;
  
  // Blink detection state
  private blinkState: BlinkState = {
    isBlinking: false,
    blinkCount: 0,
    lastBlinkTime: 0,
    earHistory: [],
  };
  
  // Head pose tracking
  private initialHeadPose: { yaw: number; pitch: number; roll: number } | null = null;
  private headMovementDetected = false;

  /**
   * Initialize MediaPipe models
   * Uses CDN for model files
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    
    this.isInitializing = true;
    console.log('🔄 [MediaPipe] Initializing...');
    
    try {
      // Initialize Face Detection
      this.faceDetection = new FaceDetection({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        },
      });
      
      this.faceDetection.setOptions({
        model: 'short', // 'short' for short-range (selfie), 'full' for full-range
        minDetectionConfidence: 0.5,
      });
      
      // Initialize Face Mesh for landmarks
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });
      
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true, // For accurate eye landmarks
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('✅ [MediaPipe] Initialized successfully');
      
    } catch (error) {
      this.isInitializing = false;
      console.error('❌ [MediaPipe] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Detect face in video/image element
   */
  async detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceDetectionResult> {
    if (!this.faceDetection || !this.isInitialized) {
      await this.initialize();
    }
    
    return new Promise((resolve) => {
      this.faceDetection!.onResults((results: FaceDetectionResults) => {
        if (results.detections && results.detections.length > 0) {
          const detection = results.detections[0];
          const bbox = detection.boundingBox;
          
          resolve({
            detected: true,
            confidence: (detection as any).score?.[0] || 0.9,
            boundingBox: bbox ? {
              x: bbox.xCenter - bbox.width / 2,
              y: bbox.yCenter - bbox.height / 2,
              width: bbox.width,
              height: bbox.height,
            } : undefined,
          });
        } else {
          resolve({
            detected: false,
            confidence: 0,
          });
        }
      });
      
      this.faceDetection!.send({ image: imageElement });
    });
  }

  /**
   * Calculate Eye Aspect Ratio (EAR) for blink detection
   * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
   */
  private calculateEAR(landmarks: any[], eyeIndices: typeof LEFT_EYE_INDICES): number {
    const p1 = landmarks[eyeIndices.outer];
    const p2 = landmarks[eyeIndices.outerTop];
    const p3 = landmarks[eyeIndices.innerTop];
    const p4 = landmarks[eyeIndices.inner];
    const p5 = landmarks[eyeIndices.innerBottom];
    const p6 = landmarks[eyeIndices.outerBottom];
    
    // Calculate vertical distances
    const vertical1 = this.distance(p2, p6);
    const vertical2 = this.distance(p3, p5);
    
    // Calculate horizontal distance
    const horizontal = this.distance(p1, p4);
    
    // Prevent division by zero
    if (horizontal === 0) return 0;
    
    // Calculate EAR
    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    
    return ear;
  }

  /**
   * Calculate Euclidean distance between two 3D points
   */
  private distance(p1: { x: number; y: number; z?: number }, p2: { x: number; y: number; z?: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Estimate head pose from face landmarks
   * Returns yaw (left-right), pitch (up-down), roll (tilt)
   */
  private estimateHeadPose(landmarks: any[]): { yaw: number; pitch: number; roll: number } {
    // Use nose tip (1), chin (152), left cheek (234), right cheek (454)
    const noseTip = landmarks[1];
    const chin = landmarks[152];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const forehead = landmarks[10];
    
    // Calculate yaw (horizontal rotation)
    const faceWidth = this.distance(leftCheek, rightCheek);
    const noseOffset = (noseTip.x - (leftCheek.x + rightCheek.x) / 2);
    const yaw = Math.atan2(noseOffset, faceWidth / 2) * (180 / Math.PI) * 2;
    
    // Calculate pitch (vertical rotation)
    const faceHeight = this.distance(forehead, chin);
    const noseVerticalOffset = noseTip.y - (forehead.y + chin.y) / 2;
    const pitch = Math.atan2(noseVerticalOffset, faceHeight / 2) * (180 / Math.PI) * 2;
    
    // Calculate roll (tilt)
    const roll = Math.atan2(rightCheek.y - leftCheek.y, rightCheek.x - leftCheek.x) * (180 / Math.PI);
    
    return { yaw, pitch, roll };
  }

  /**
   * Perform liveness detection using face mesh
   * Detects blinks and head movements
   */
  async detectLiveness(imageElement: HTMLVideoElement): Promise<LivenessResult> {
    if (!this.faceMesh || !this.isInitialized) {
      await this.initialize();
    }
    
    return new Promise((resolve) => {
      this.faceMesh!.onResults((results: FaceMeshResults) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          resolve({
            isLive: false,
            blinkDetected: false,
            headMovementDetected: false,
            leftEAR: 0,
            rightEAR: 0,
            headPose: { yaw: 0, pitch: 0, roll: 0 },
          });
          return;
        }
        
        const landmarks = results.multiFaceLandmarks[0];
        
        // Calculate EAR for both eyes
        const leftEAR = this.calculateEAR(landmarks, LEFT_EYE_INDICES);
        const rightEAR = this.calculateEAR(landmarks, RIGHT_EYE_INDICES);
        const avgEAR = (leftEAR + rightEAR) / 2;
        
        // Update EAR history
        this.blinkState.earHistory.push(avgEAR);
        if (this.blinkState.earHistory.length > 10) {
          this.blinkState.earHistory.shift();
        }
        
        // Detect blink
        let blinkDetected = false;
        if (avgEAR < EAR_THRESHOLD) {
          if (!this.blinkState.isBlinking) {
            // Start of blink
            this.blinkState.isBlinking = true;
          }
        } else {
          if (this.blinkState.isBlinking) {
            // End of blink
            this.blinkState.isBlinking = false;
            this.blinkState.blinkCount++;
            this.blinkState.lastBlinkTime = Date.now();
            blinkDetected = true;
            console.log(`👁️ [MediaPipe] Blink detected! Count: ${this.blinkState.blinkCount}`);
          }
        }
        
        // Estimate head pose
        const headPose = this.estimateHeadPose(landmarks);
        
        // Initialize reference head pose
        if (!this.initialHeadPose) {
          this.initialHeadPose = { ...headPose };
        }
        
        // Detect significant head movement
        const yawDiff = Math.abs(headPose.yaw - this.initialHeadPose.yaw);
        const pitchDiff = Math.abs(headPose.pitch - this.initialHeadPose.pitch);
        
        if (yawDiff > HEAD_MOVEMENT_THRESHOLD || pitchDiff > HEAD_MOVEMENT_THRESHOLD) {
          if (!this.headMovementDetected) {
            this.headMovementDetected = true;
            console.log(`🔄 [MediaPipe] Head movement detected! Yaw: ${yawDiff.toFixed(1)}°, Pitch: ${pitchDiff.toFixed(1)}°`);
          }
        }
        
        // Liveness is confirmed if we have both blink and head movement
        // Or at least 2 blinks
        const isLive = (this.blinkState.blinkCount >= 2) || 
                       (this.blinkState.blinkCount >= 1 && this.headMovementDetected);
        
        resolve({
          isLive,
          blinkDetected,
          headMovementDetected: this.headMovementDetected,
          leftEAR,
          rightEAR,
          headPose,
        });
      });
      
      this.faceMesh!.send({ image: imageElement });
    });
  }

  /**
   * Reset liveness detection state
   */
  resetLivenessState(): void {
    this.blinkState = {
      isBlinking: false,
      blinkCount: 0,
      lastBlinkTime: 0,
      earHistory: [],
    };
    this.initialHeadPose = null;
    this.headMovementDetected = false;
    console.log('🔄 [MediaPipe] Liveness state reset');
  }

  /**
   * Get current blink count
   */
  getBlinkCount(): number {
    return this.blinkState.blinkCount;
  }

  /**
   * Check if head movement was detected
   */
  hasHeadMovement(): boolean {
    return this.headMovementDetected;
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    if (this.faceDetection) {
      await this.faceDetection.close();
      this.faceDetection = null;
    }
    if (this.faceMesh) {
      await this.faceMesh.close();
      this.faceMesh = null;
    }
    this.isInitialized = false;
    console.log('👋 [MediaPipe] Closed');
  }
}

// Export singleton instance
export const mediaPipeService = new MediaPipeService();

// Export class for testing
export { MediaPipeService };
