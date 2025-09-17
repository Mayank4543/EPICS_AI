import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import api, { RecordGestureResponse, DatasetInfoResponse } from '../services/api';

interface GestureRecorderProps {
  onRecordingComplete?: (response: RecordGestureResponse) => void;
  onDatasetUpdate?: (dataset: DatasetInfoResponse) => void;
}

const GestureRecorder: React.FC<GestureRecorderProps> = ({ 
  onRecordingComplete, 
  onDatasetUpdate 
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [gestureName, setGestureName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [recordingCount, setRecordingCount] = useState(0);
  const [targetCount, setTargetCount] = useState(5);
  const [isAutoRecording, setIsAutoRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfoResponse | null>(null);

  // Predefined gesture names for quick selection
  const predefinedGestures = [
    '👍 Thumbs Up',
    '👎 Thumbs Down', 
    '✋ Open Hand',
    '👊 Fist',
    '✌️ Peace Sign',
    '👌 OK Sign',
    '☝️ Index Finger',
    '🤟 Love You',
    '🤘 Rock On',
    '🖖 Vulcan Salute'
  ];

  // Load dataset info on component mount
  React.useEffect(() => {
    loadDatasetInfo();
  }, []);

  const loadDatasetInfo = async () => {
    try {
      const info = await api.getDatasetInfo();
      setDatasetInfo(info);
      if (onDatasetUpdate) {
        onDatasetUpdate(info);
      }
    } catch (error) {
      console.error('Failed to load dataset info:', error);
    }
  };

  // Record a single gesture
  const recordSingleGesture = useCallback(async () => {
    if (!webcamRef.current || !gestureName.trim()) {
      setError('Please enter a gesture name and ensure camera is active');
      return;
    }

    try {
      setIsRecording(true);
      setError('');
      setSuccess('');

      // Capture image from webcam
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image from webcam');
      }

      // Record gesture
      const response = await api.recordGesture(gestureName.trim(), imageSrc);
      
      if (response.success) {
        setSuccess(`✅ Recorded "${response.gesture_name}" successfully!`);
        setRecordingCount(prev => prev + 1);
        
        // Refresh dataset info
        await loadDatasetInfo();
        
        if (onRecordingComplete) {
          onRecordingComplete(response);
        }
      } else {
        setError('Failed to record gesture: ' + response.message);
      }

    } catch (err: any) {
      console.error('Recording error:', err);
      setError('Recording failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRecording(false);
    }
  }, [gestureName, onRecordingComplete]);

  // Auto-record multiple samples
  const startAutoRecording = useCallback(async () => {
    if (!gestureName.trim()) {
      setError('Please enter a gesture name first');
      return;
    }

    setIsAutoRecording(true);
    setRecordingCount(0);
    setError('');
    setSuccess('');

    for (let i = 0; i < targetCount; i++) {
      if (!isAutoRecording) break; // Stop if user cancelled

      // Countdown
      for (let countdown = 3; countdown > 0; countdown--) {
        setCountdown(countdown);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setCountdown(0);

      // Record
      await recordSingleGesture();
      
      // Short pause between recordings
      if (i < targetCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setIsAutoRecording(false);
    setSuccess(`🎉 Completed recording ${targetCount} samples of "${gestureName}"!`);
  }, [gestureName, targetCount, recordSingleGesture, isAutoRecording]);

  const stopAutoRecording = () => {
    setIsAutoRecording(false);
    setCountdown(0);
  };

  const clearDataset = async () => {
    if (window.confirm('Are you sure you want to clear all recorded gestures? This cannot be undone.')) {
      // Note: You would need to implement a clear endpoint in the backend
      setSuccess('Dataset cleared functionality would be implemented here');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        🎯 Gesture Recording Studio
      </h2>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📹 Camera Feed</h3>
          
          <div className="relative">
            {isCameraActive ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                onUserMediaError={(err) => {
                  console.error("Camera error:", err);
                  setIsCameraActive(false);
                  setError('Failed to access camera. Please check permissions.');
                }}
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <svg className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600">Camera inactive</p>
                  <button
                    onClick={() => setIsCameraActive(true)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Activate Camera
                  </button>
                </div>
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown > 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-6xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                🔴 Recording...
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isCameraActive 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isCameraActive ? '📴 Turn Off' : '📹 Turn On'}
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">⚙️ Recording Controls</h3>
          
          {/* Gesture Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gesture Name
            </label>
            <input
              type="text"
              value={gestureName}
              onChange={(e) => setGestureName(e.target.value)}
              placeholder="e.g., thumbs_up, peace_sign"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAutoRecording}
            />
          </div>

          {/* Quick Gesture Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select
            </label>
            <div className="grid grid-cols-2 gap-2">
              {predefinedGestures.slice(0, 6).map((gesture) => (
                <button
                  key={gesture}
                  onClick={() => setGestureName(gesture.split(' ')[1].toLowerCase().replace(/[^\w]/g, '_'))}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-left"
                  disabled={isAutoRecording}
                >
                  {gesture}
                </button>
              ))}
            </div>
          </div>

          {/* Recording Settings */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-Record Samples
            </label>
            <select
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAutoRecording}
            >
              <option value={2}>2 samples (minimum)</option>
              <option value={3}>3 samples</option>
              <option value={5}>5 samples (recommended)</option>
              <option value={10}>10 samples (high accuracy)</option>
              <option value={15}>15 samples (very high accuracy)</option>
              <option value={20}>20 samples (maximum)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              💡 Minimum 2 samples per gesture required. 5+ recommended for better accuracy.
            </p>
          </div>

          {/* Recording Buttons */}
          <div className="space-y-3">
            <button
              onClick={recordSingleGesture}
              disabled={isRecording || isAutoRecording || !isCameraActive || !gestureName.trim()}
              className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isRecording ? '⏳ Recording...' : '📸 Record Single Sample'}
            </button>

            <button
              onClick={isAutoRecording ? stopAutoRecording : startAutoRecording}
              disabled={!isCameraActive || !gestureName.trim()}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                isAutoRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white'
              }`}
            >
              {isAutoRecording 
                ? '⏹️ Stop Auto-Recording' 
                : `🚀 Auto-Record ${targetCount} Samples`
              }
            </button>
          </div>

          {/* Progress */}
          {isAutoRecording && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-600">{recordingCount}/{targetCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(recordingCount / targetCount) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Information */}
      {datasetInfo && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📊 Dataset Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Samples:</span>
              <div className="text-2xl font-bold text-blue-600">{datasetInfo.totalSamples}</div>
            </div>
            <div>
              <span className="font-medium">Gesture Types:</span>
              <div className="text-2xl font-bold text-green-600">{datasetInfo.gestureCount}</div>
            </div>
            <div>
              <span className="font-medium">Model Status:</span>
              <div className={`text-sm font-semibold ${datasetInfo.modelExists ? 'text-green-600' : 'text-orange-600'}`}>
                {datasetInfo.modelExists ? '✅ Trained' : '⚠️ Not Trained'}
              </div>
            </div>
            <div>
              <span className="font-medium">Ready to Train:</span>
              <div className={`text-sm font-semibold ${
                datasetInfo.gestureCount >= 2 && datasetInfo.totalSamples >= (datasetInfo.gestureCount * 2) 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {datasetInfo.gestureCount >= 2 && datasetInfo.totalSamples >= (datasetInfo.gestureCount * 2) 
                  ? '✅ Yes' 
                  : `❌ Need ${Math.max(2 - datasetInfo.gestureCount, (datasetInfo.gestureCount * 2) - datasetInfo.totalSamples)} more`
                }
              </div>
            </div>
          </div>
          
          {datasetInfo.gestures && Object.keys(datasetInfo.gestures).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Recorded Gestures:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(datasetInfo.gestures).map(([gesture, count]) => (
                  <span key={gesture} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {gesture}: {count} samples
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GestureRecorder;