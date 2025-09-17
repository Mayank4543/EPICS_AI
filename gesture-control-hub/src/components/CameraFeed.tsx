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
            predictions: [{
              handIndex: 0,
              handedness: mlResponse.handedness,
              confidence: mlResponse.confidence,
              landmarks: [],
              totalLandmarks: 0,
              gesture: mlResponse.predicted_gesture || undefined // Convert null to undefined
            }],
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
          
          if (response.success && response.handsDetected > 0) {
            gesture = analyzeGestureFromLandmarks(response.predictions[0]);
            // Add the analyzed gesture to the response
            response.predictions[0].gesture = gesture;
          }
          
          setLastDetection(response);
        }
      } else {
        // Use MediaPipe landmark detection and analysis
        const response = await api.detectGesture(imageSrc);
        
        // Process detected gestures using landmark analysis
        if (response.success && response.handsDetected > 0) {
          gesture = analyzeGestureFromLandmarks(response.predictions[0]);
          // Add the analyzed gesture to the response
          response.predictions[0].gesture = gesture;
        }
        
        setLastDetection(response);
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
    <div>
      {/* Header with Title and Status Badges */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Live Camera Feed
          </h3>
          
          {/* Status Badges */}
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
              backendStatus === 'connected' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : backendStatus === 'disconnected'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'connected' ? 'bg-green-500' : 
                backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span>
                {backendStatus === 'connected' ? 'Connected' : 
                 backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
              </span>
            </div>
            
            {backendStatus === 'connected' && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                useMLModel 
                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${useMLModel ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                <span>{useMLModel ? '🤖 ML Model' : '📍 Landmark'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Video Feed Container */}
      <div className="relative w-full h-[400px] mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
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
            className="w-full h-full object-cover"
            onUserMediaError={(err) => {
              console.error("Camera error:", err);
              setIsCameraActive(false);
              setError('Failed to access camera. Please check permissions.');
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Camera is turned off</p>
              <p className="text-gray-400 text-sm">Click "Turn On Camera" to start</p>
            </div>
          </div>
        )}

        {/* Status Overlays */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            {isCameraActive && isCameraEnabled ? (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Feed</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Camera Inactive</span>
              </div>
            )}
          </div>
          
          {isDetecting && (
            <div className="bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium animate-pulse">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <span>Analyzing...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={detectGesture}
          disabled={!isCameraActive || backendStatus !== 'connected' || isDetecting}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
            !isCameraActive || backendStatus !== 'connected' || isDetecting
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isDetecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Detect Now</span>
            </>
          )}
        </button>
        
        <button
          onClick={toggleCamera}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            isCameraEnabled 
              ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCameraEnabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            )}
          </svg>
          <span>{isCameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}</span>
        </button>
      </div>

      {/* Detection Results */}
      {lastDetection && (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h4 className="font-semibold text-gray-900">Latest Detection Result</h4>
            <span className="text-xs text-gray-500 ml-auto">
              {new Date(lastDetection.timestamp).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Hands Detected</span>
                <span className="text-lg font-bold text-blue-600">{lastDetection.handsDetected}</span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Confidence</span>
                <span className="text-lg font-bold text-green-600">
                  {lastDetection.predictions[0]?.confidence 
                    ? `${Math.round(lastDetection.predictions[0].confidence * 100)}%`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Handedness</span>
                <span className="text-lg font-bold text-purple-600">
                  {lastDetection.predictions[0]?.handedness || 'N/A'}
                </span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Gesture</span>
                <span className="text-lg font-bold text-indigo-600">
                  {lastDetection.predictions[0]?.gesture || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;