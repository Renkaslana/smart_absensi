/**
 * 🌙 useLivenessDetection Hook
 * 
 * Real-time liveness detection for face registration
 * Integrates Phase 1-3 checks with React lifecycle
 */

import { useState, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  detectFace,
  captureFrame,
  checkQuality,
  detectBlink,
  detectHeadPose,
  detectScreenReflection,
  analyzeTexture,
  aggregateLivenessResult,
  speakFeedback,
} from '../utils/livenessDetection';
import type {
  CompleteLivenessResult,
  BlinkDetectionState,
  FaceDetectionResult,
  QualityCheckResult,
  LivenessCheckResult,
} from '../utils/livenessDetection';

interface UseLivenessDetectionOptions {
  enabled: boolean;
  checkInterval?: number; // ms (default: 500)
  voiceFeedback?: boolean;
}

export function useLivenessDetection(
  videoRef: RefObject<HTMLVideoElement>,
  options: UseLivenessDetectionOptions = { enabled: true }
) {
  const { enabled, checkInterval = 500, voiceFeedback = true } = options;

  const [result, setResult] = useState<CompleteLivenessResult>({
    status: 'checking',
    phase: 'detection',
    message: 'Memulai deteksi...',
    canCapture: false,
    progress: 0,
    details: {
      faceDetected: false,
      faceCount: 0,
      faceSize: '0x0px',
      isBlurry: false,
      isDark: false,
      isLowContrast: false,
      blinkCount: 0,
      isNeutralPose: false,
      isScreen: false,
      isRealTexture: false,
    },
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Persistent state for blink detection
  const blinkStateRef = useRef<BlinkDetectionState>({
    isBlinking: false,
    blinkCount: 0,
    lastBlinkTime: 0,
  });

  // Track last message for voice feedback (avoid repeating)
  const lastMessageRef = useRef<string>('');

  // Main detection loop
  useEffect(() => {
    if (!enabled || !videoRef.current || isProcessing) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      setIsProcessing(true);

      try {
        // Phase 1: Face Detection
        const faceResult: FaceDetectionResult = await detectFace(videoRef.current);

        // Early exit if no face
        if (!faceResult.detected || faceResult.size.width < 80 || faceResult.size.height < 80) {
          const quickResult = aggregateLivenessResult(
            faceResult,
            {
              isBlurry: false,
              isDark: false,
              isLowContrast: false,
              blurScore: 0,
              brightness: 0,
              contrast: 0,
            },
            {
              isRealFace: false,
              blinkCount: 0,
              isNeutralPose: false,
              isScreen: false,
              textureScore: 0,
              headPose: { yaw: 0, pitch: 0, roll: 0 },
            }
          );

          setResult(quickResult);
          setIsProcessing(false);
          return;
        }

        // Phase 2: Quality Check
        const canvas = captureFrame(videoRef.current);
        const qualityResult: QualityCheckResult = checkQuality(canvas);

        // Early exit if quality fails
        if (qualityResult.isBlurry || qualityResult.isDark || qualityResult.isLowContrast) {
          const quickResult = aggregateLivenessResult(
            faceResult,
            qualityResult,
            {
              isRealFace: false,
              blinkCount: blinkStateRef.current.blinkCount,
              isNeutralPose: false,
              isScreen: false,
              textureScore: 0,
              headPose: { yaw: 0, pitch: 0, roll: 0 },
            }
          );

          setResult(quickResult);
          setIsProcessing(false);
          return;
        }

        // Phase 3: Liveness Detection
        if (faceResult.landmarks) {
          // Blink detection
          blinkStateRef.current = detectBlink(
            faceResult.landmarks,
            blinkStateRef.current
          );

          // Head pose detection
          const headPose = detectHeadPose(faceResult.landmarks);

          // Screen reflection detection
          const screenResult = detectScreenReflection(canvas);

          // Texture analysis
          const textureResult = analyzeTexture(canvas);

          const livenessResult: LivenessCheckResult = {
            isRealFace: textureResult.isRealFace,
            blinkCount: blinkStateRef.current.blinkCount,
            isNeutralPose: headPose.isNeutral,
            isScreen: screenResult.isScreen,
            textureScore: textureResult.textureScore,
            headPose: {
              yaw: headPose.yaw,
              pitch: headPose.pitch,
              roll: headPose.roll,
            },
          };

          // Aggregate all results
          const finalResult = aggregateLivenessResult(
            faceResult,
            qualityResult,
            livenessResult
          );

          setResult(finalResult);

          // Voice feedback (only if message changes)
          if (voiceFeedback && finalResult.message !== lastMessageRef.current) {
            speakFeedback(finalResult.message);
            lastMessageRef.current = finalResult.message;
          }
        }
      } catch (error) {
        console.error('[useLivenessDetection] Error:', error);
      } finally {
        setIsProcessing(false);
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [enabled, videoRef, checkInterval, voiceFeedback, isProcessing]);

  // Reset blink count
  const resetBlinkCount = () => {
    blinkStateRef.current = {
      isBlinking: false,
      blinkCount: 0,
      lastBlinkTime: 0,
    };
  };

  return {
    result,
    isProcessing,
    resetBlinkCount,
  };
}
