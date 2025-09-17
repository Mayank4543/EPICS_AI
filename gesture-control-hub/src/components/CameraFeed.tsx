import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import api, { GestureDetectionResponse } from '../services/api';

interface CameraFeedProps {
  onGestureDetected?: (gesture: string) => void;
  useMLModel?: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onGestureDetected, useMLModel = false }) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastDetection, setLastDetection] = useState<GestureDetectionResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [key, setKey] = useState<number>(0);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check backend health on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isHealthy = await api.checkBackendHealth();
        setBackendStatus(isHealthy ? 'connected' : 'disconnected');
        if (!isHealthy) {
          setError('Backend server is not responding. Please ensure Flask server is running on localhost:5000');
        } else {
          setError('');
        }
      } catch (err) {
        setBackendStatus('disconnected');
        setError('Failed to connect to backend server');
      }
    };

    checkBackend();
    // Check backend health every 30 seconds
    const healthCheckInterval = setInterval(checkBackend, 30000);
    
    return () => clearInterval(healthCheckInterval);
  }, []);

  // Check if camera is active by monitoring the video element
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    
    if (isCameraEnabled) {
      const checkCameraStatus = () => {
        if (webcamRef.current && webcamRef.current.video) {
          const videoElement = webcamRef.current.video;
          // Check if video is playing and has dimensions
          const isActive = !!(videoElement.readyState >= 2 && 
                            videoElement.videoWidth > 0 && 
                            videoElement.videoHeight > 0);
          setIsCameraActive(isActive);
        } else {
          setIsCameraActive(false);
        }
      };
      
      // Check initially and then periodically
      checkCameraStatus();
      statusInterval = setInterval(checkCameraStatus, 1000);
    } else {
      setIsCameraActive(false);
    }
    
    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [isCameraEnabled, key]);

  // Gesture detection function
  const detectGesture = useCallback(async () => {
    if (!webcamRef.current || !isCameraActive || backendStatus !== 'connected' || isDetecting) {
      return;
    }

    try {
      setIsDetecting(true);
      setError('');

      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.warn('Failed to capture image from webcam');
        return;
      }

      // Send to backend for gesture detection
      let gesture = '';
      
      if (useMLModel) {
        try {
          // Use trained ML model for detection
          const mlResponse = await api.detectTrainedGesture(imageSrc);
          setLastDetection({
            success: mlResponse.success,
            handsDetected: mlResponse.handsDetected,
            predictions: [], // ML response has different structure
            timestamp: mlResponse.timestamp
          });

          if (mlResponse.success && mlResponse.predicted_gesture) {
            gesture = mlResponse.predicted_gesture;
            console.log(`ML Model detected: ${gesture} (confidence: ${mlResponse.confidence})`);
          }
        } catch (mlError) {
          console.warn('ML detection failed, falling back to landmark analysis:', mlError);
          // Fall back to landmark analysis
          const response = await api.detectGesture(imageSrc);
          setLastDetection(response);

          if (response.success && response.handsDetected > 0) {
            gesture = analyzeGestureFromLandmarks(response.predictions[0]);
          }
        }
      } else {
        // Use MediaPipe landmark detection and analysis
        const response = await api.detectGesture(imageSrc);
        setLastDetection(response);

        // Process detected gestures using landmark analysis
        if (response.success && response.handsDetected > 0) {
          gesture = analyzeGestureFromLandmarks(response.predictions[0]);
        }
      }

      // Send gesture to parent component
      if (onGestureDetected) {
        onGestureDetected(gesture);
      }

    } catch (err) {
      console.error('Gesture detection error:', err);
      setError('Failed to detect gesture. Check backend connection.');
    } finally {
      setIsDetecting(false);
    }
  }, [isCameraActive, backendStatus, isDetecting, onGestureDetected, useMLModel]);

  // Analyze hand landmarks to determine gesture
  const analyzeGestureFromLandmarks = (hand: any): string => {
    if (!hand || !hand.landmarks || hand.landmarks.length < 21) {
      return '';
    }

    const landmarks = hand.landmarks;
    
    // Get key landmark points
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const pinkyMcp = landmarks[17];

    // Calculate if fingers are extended
    const thumbExtended = thumbTip.x > wrist.x + 0.05; // Adjust threshold as needed
    const indexExtended = indexTip.y < indexMcp.y - 0.05;
    const middleExtended = middleTip.y < middleMcp.y - 0.05;
    const ringExtended = ringTip.y < ringMcp.y - 0.05;
    const pinkyExtended = pinkyTip.y < pinkyMcp.y - 0.05;

    // Count extended fingers
    const extendedFingers = [
      thumbExtended,
      indexExtended,
      middleExtended,
      ringExtended,
      pinkyExtended
    ].filter(Boolean).length;

    // Gesture recognition logic
    if (extendedFingers === 5) {
      return '✋'; // Open hand - Turn OFF all lights
    } else if (extendedFingers === 1 && indexExtended) {
      return '👉'; // Pointing - Toggle TV
    } else if (extendedFingers === 1 && thumbExtended) {
      return '👍'; // Thumbs up - Increase fan speed
    } else if (extendedFingers === 0) {
      return '👎'; // Closed fist/thumbs down - Decrease fan speed
    }

    return ''; // No recognized gesture
  };

  // Start/stop gesture detection when camera becomes active
  useEffect(() => {
    if (isCameraActive && isCameraEnabled && backendStatus === 'connected') {
      // Start gesture detection every 2 seconds
      detectionIntervalRef.current = setInterval(detectGesture, 2000);
    } else {
      // Stop gesture detection
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      if (onGestureDetected) {
        onGestureDetected('');
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [isCameraActive, isCameraEnabled, backendStatus, detectGesture, onGestureDetected]);

  // Toggle camera on/off
  const toggleCamera = useCallback(() => {
    if (isCameraEnabled) {
      // Turning off
      setIsCameraEnabled(false);
      if (onGestureDetected) {
        onGestureDetected('');
      }
    } else {
      // Turning on - force remount of webcam component
      setKey(prevKey => prevKey + 1);
      setIsCameraEnabled(true);
    }
  }, [isCameraEnabled, onGestureDetected]);

  return (
    // <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-xl font-semibold">
            Real-Time Gesture Detection
          </h2>
          <div className="flex items-center mt-1 space-x-4">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                backendStatus === 'connected' ? 'bg-green-500' : 
                backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                Backend: {backendStatus === 'connected' ? 'Connected' : 
                          backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
              </span>
            </div>
            
            {backendStatus === 'connected' && (
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${useMLModel ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                <span className="text-sm text-gray-600">
                  Mode: {useMLModel ? '🤖 ML Model' : '📍 Landmark Analysis'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={detectGesture}
            disabled={!isCameraActive || backendStatus !== 'connected' || isDetecting}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-all duration-300"
          >
            {isDetecting ? 'Detecting...' : 'Detect Now'}
          </button>
          <button
            onClick={toggleCamera}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              isCameraEnabled 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="relative w-full h-[300px]">
        {isCameraEnabled ? (
          <Webcam
            key={key}
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user"
            }}
            className="w-full h-full object-cover rounded-lg"
            onUserMediaError={(err) => {
              console.error("Camera error:", err);
              setIsCameraActive(false);
              setError('Failed to access camera. Please check permissions.');
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p className="mt-2 text-gray-600">Camera is turned off</p>
            </div>
          </div>
        )}

        {/* Status indicators overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between">
          <div className="bg-black bg-opacity-50 text-white p-2 rounded text-sm">
            {isCameraActive && isCameraEnabled ? 'Live Feed' : 'Camera Inactive'}
          </div>
          
          {isDetecting && (
            <div className="bg-blue-500 bg-opacity-80 text-white p-2 rounded text-sm animate-pulse">
              Analyzing...
            </div>
          )}
        </div>
      </div>

      {/* Detection Results */}
      {lastDetection && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Last Detection Result:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Hands Detected:</strong> {lastDetection.handsDetected}
            </div>
            <div>
              <strong>Confidence:</strong> {
                lastDetection.predictions[0]?.confidence 
                  ? `${Math.round(lastDetection.predictions[0].confidence * 100)}%`
                  : 'N/A'
              }
            </div>
            <div>
              <strong>Handedness:</strong> {
                lastDetection.predictions[0]?.handedness || 'N/A'
              }
            </div>
            <div>
              <strong>Processing Time:</strong> {
                new Date(lastDetection.timestamp).toLocaleTimeString()
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;