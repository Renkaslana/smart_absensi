import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

interface LivenessResult {
    blink: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    passedCount: number;
}

interface LivenessSettings {
    require_blink: boolean;
    require_head_turn: boolean;
    min_checks: number;
    timeout: number;
}

export const useRealLivenessDetection = (
    videoRef: React.RefObject<HTMLVideoElement>,
    enabled: boolean,
    settings: LivenessSettings
) => {
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [progress, setProgress] = useState<LivenessResult>({
        blink: false,
        turnLeft: false,
        turnRight: false,
        passedCount: 0
    });
    
    const detectionIntervalRef = useRef<number | null>(null);
    const earHistoryRef = useRef<number[]>([]);
    const yawHistoryRef = useRef<number[]>([]);

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                console.log('✅ Face-api.js models loaded');
            } catch (error) {
                console.error('❌ Failed to load face-api.js models:', error);
            }
        };

        if (enabled) {
            loadModels();
        }
    }, [enabled]);

    // Calculate Eye Aspect Ratio for blink detection
    const calculateEAR = (landmarks: faceapi.FaceLandmarks68): number => {
        const leftEye = [
            landmarks.getLeftEye()[1], // 37
            landmarks.getLeftEye()[2], // 38
            landmarks.getLeftEye()[5], // 41
            landmarks.getLeftEye()[4], // 40
            landmarks.getLeftEye()[0], // 36
            landmarks.getLeftEye()[3], // 39
        ];

        const rightEye = [
            landmarks.getRightEye()[1], // 43
            landmarks.getRightEye()[2], // 44
            landmarks.getRightEye()[5], // 47
            landmarks.getRightEye()[4], // 46
            landmarks.getRightEye()[0], // 42
            landmarks.getRightEye()[3], // 45
        ];

        const calcEAR = (eye: faceapi.Point[]) => {
            const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
            const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
            const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
            return (A + B) / (2.0 * C);
        };

        const leftEAR = calcEAR(leftEye);
        const rightEAR = calcEAR(rightEye);
        return (leftEAR + rightEAR) / 2.0;
    };

    // Calculate head yaw angle for head turn detection
    const calculateYaw = (landmarks: faceapi.FaceLandmarks68): number => {
        const noseTip = landmarks.getNose()[3]; // Nose tip
        const leftMouth = landmarks.getMouth()[0]; // Left corner of mouth (user's left, screen right)
        const rightMouth = landmarks.getMouth()[6]; // Right corner of mouth (user's right, screen left)

        const mouthCenter = {
            x: (leftMouth.x + rightMouth.x) / 2,
            y: (leftMouth.y + rightMouth.y) / 2
        };

        // Calculate horizontal offset from mouth center to nose
        // Positive when face turns RIGHT (nose moves right of mouth center)
        // Negative when face turns LEFT (nose moves left of mouth center)
        const offset = noseTip.x - mouthCenter.x;
        const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
        
        // Normalize to degrees: positive = right turn, negative = left turn
        // Using mouth width as reference for normalization
        const yaw = (offset / mouthWidth) * 60; // Scale factor adjusted for better sensitivity
        return yaw;
    };

    // Start detection loop
    const startDetection = () => {
        if (!modelsLoaded || !videoRef.current || isDetecting) return;

        setIsDetecting(true);
        console.log('🔍 Starting real liveness detection...');

        detectionIntervalRef.current = window.setInterval(async () => {
            if (!videoRef.current) return;

            try {
                // Use higher score threshold for more reliable Asian face detection
                const options = new faceapi.TinyFaceDetectorOptions({
                    inputSize: 416, // Higher resolution for better Asian face detection
                    scoreThreshold: 0.3 // Lower threshold = more sensitive (was 0.5 default)
                });
                
                const detections = await faceapi
                    .detectSingleFace(videoRef.current, options)
                    .withFaceLandmarks();

                if (!detections) {
                    // Only log occasionally to avoid spam
                    if (Math.random() < 0.1) console.warn('⚠️ No face detected');
                    return;
                }

                const landmarks = detections.landmarks;

                // Blink detection (adjusted thresholds for Asian eyes)
                if (settings.require_blink && !progress.blink) {
                    const ear = calculateEAR(landmarks);
                    earHistoryRef.current.push(ear);
                    
                    // Keep only last 10 frames
                    if (earHistoryRef.current.length > 10) {
                        earHistoryRef.current.shift();
                    }

                    // Detect blink with LOWER thresholds for Asian eyes:
                    // - Closed eye: EAR < 0.18 (was 0.20)
                    // - Open eye: EAR > 0.22 (was 0.25)
                    // This accommodates smaller eye openings common in Asian faces
                    const avgEAR = earHistoryRef.current.reduce((a, b) => a + b, 0) / earHistoryRef.current.length;
                    if (earHistoryRef.current.length >= 5) {
                        const hasClosedEye = earHistoryRef.current.some(e => e < 0.18);
                        const hasOpenEye = earHistoryRef.current.some(e => e > 0.22);
                        if (hasClosedEye && hasOpenEye) {
                            console.log('👁️ Blink detected! EAR:', avgEAR.toFixed(3));
                            setProgress(prev => ({
                                ...prev,
                                blink: true,
                                passedCount: prev.passedCount + 1
                            }));
                        }
                    }
                }

                // Head turn detection
                if (settings.require_head_turn) {
                    const yaw = calculateYaw(landmarks);
                    yawHistoryRef.current.push(yaw);

                    // Keep only last 20 frames
                    if (yawHistoryRef.current.length > 20) {
                        yawHistoryRef.current.shift();
                    }

                    // Left turn detection (yaw < -15 degrees)
                    if (!progress.turnLeft && yawHistoryRef.current.some(y => y < -15)) {
                        console.log('⬅️ Left turn detected! Yaw:', yaw.toFixed(1), '°');
                        setProgress(prev => ({
                            ...prev,
                            turnLeft: true,
                            passedCount: prev.passedCount + 1
                        }));
                    }

                    // Right turn detection (yaw > 15 degrees)
                    if (!progress.turnRight && yawHistoryRef.current.some(y => y > 15)) {
                        console.log('➡️ Right turn detected! Yaw:', yaw.toFixed(1), '°');
                        setProgress(prev => ({
                            ...prev,
                            turnRight: true,
                            passedCount: prev.passedCount + 1
                        }));
                    }
                }

                // Check if all required checks passed
                const requiredChecks = 
                    (settings.require_blink ? 1 : 0) + 
                    (settings.require_head_turn ? 2 : 0);
                
                if (progress.passedCount >= Math.min(requiredChecks, settings.min_checks)) {
                    stopDetection();
                }

            } catch (error) {
                console.error('Detection error:', error);
            }
        }, 200); // Check every 200ms
    };

    // Stop detection
    const stopDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        setIsDetecting(false);
        console.log('🛑 Stopped liveness detection');
    };

    // Reset detection
    const resetDetection = () => {
        stopDetection();
        setProgress({
            blink: false,
            turnLeft: false,
            turnRight: false,
            passedCount: 0
        });
        earHistoryRef.current = [];
        yawHistoryRef.current = [];
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopDetection();
        };
    }, []);

    return {
        modelsLoaded,
        isDetecting,
        progress,
        startDetection,
        stopDetection,
        resetDetection
    };
};
