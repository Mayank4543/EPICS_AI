import React, { useState, useEffect } from 'react';
import api, { TrainModelResponse, DatasetInfoResponse, ModelInfoResponse } from '../services/api';

interface ModelTrainerProps {
  onTrainingComplete?: (response: TrainModelResponse) => void;
}

const ModelTrainer: React.FC<ModelTrainerProps> = ({ onTrainingComplete }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState('');
  const [trainingResult, setTrainingResult] = useState<TrainModelResponse | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfoResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load initial data
  useEffect(() => {
    loadDatasetInfo();
    loadModelInfo();
  }, []);

  const loadDatasetInfo = async () => {
    try {
      const info = await api.getDatasetInfo();
      setDatasetInfo(info);
    } catch (error) {
      console.error('Failed to load dataset info:', error);
    }
  };

  const loadModelInfo = async () => {
    try {
      const info = await api.getDetailedModelInfo();
      setModelInfo(info);
    } catch (error) {
      console.error('Failed to load model info:', error);
    }
  };

  const startTraining = async () => {
    if (!datasetInfo?.exists || datasetInfo.gestureCount < 2) {
      setError('Need at least 2 different gestures with multiple samples to train a model');
      return;
    }

    setIsTraining(true);
    setError('');
    setSuccess('');
    setTrainingProgress(0);
    setTrainingStatus('Initializing training...');

    // Simulate training progress
    const progressInterval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      setTrainingStatus('Loading dataset...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTrainingStatus('Preparing features...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTrainingStatus('Training RandomForest classifier...');
      
      // Start actual training
      const response = await api.trainModel();
      
      clearInterval(progressInterval);
      setTrainingProgress(100);
      
      if (response.success) {
        setTrainingResult(response);
        setSuccess(`🎉 Model trained successfully! Accuracy: ${(response.accuracy! * 100).toFixed(1)}%`);
        setTrainingStatus('Training completed successfully!');
        
        // Refresh model info
        await loadModelInfo();
        
        if (onTrainingComplete) {
          onTrainingComplete(response);
        }
      } else {
        setError('Training failed: ' + response.message);
        setTrainingStatus('Training failed');
      }

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Training error:', err);
      setError('Training failed: ' + (err.response?.data?.message || err.message));
      setTrainingStatus('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  const canTrain = () => {
    if (!datasetInfo?.exists || !datasetInfo.gestures) return false;
    
    const gestureCount = datasetInfo.gestureCount;
    const totalSamples = datasetInfo.totalSamples;
    const minRequiredSamples = gestureCount * 2; // At least 2 samples per gesture
    
    return gestureCount >= 2 && 
           totalSamples >= minRequiredSamples && 
           !isTraining;
  };

  const getTrainingRequirements = () => {
    if (!datasetInfo?.exists) {
      return 'No dataset found. Please record some gestures first.';
    }
    
    const gestureCount = datasetInfo.gestureCount;
    const totalSamples = datasetInfo.totalSamples;
    const minRequiredSamples = gestureCount * 2;
    
    if (gestureCount < 2) {
      return `Need at least 2 different gestures (currently have ${gestureCount})`;
    }
    
    if (totalSamples < minRequiredSamples) {
      return `Need at least ${minRequiredSamples} total samples for ${gestureCount} gestures (currently have ${totalSamples})`;
    }
    
    // Check individual gesture sample counts
    const gestureCounts = Object.values(datasetInfo.gestures || {});
    const minSamples = Math.min(...gestureCounts);
    if (minSamples < 2) {
      return `Each gesture needs at least 2 samples (minimum found: ${minSamples})`;
    }
    
    // Give recommendations for better accuracy
    if (totalSamples < gestureCount * 5) {
      return `Ready to train! Tip: 5+ samples per gesture recommended for better accuracy.`;
    }
    
    return 'Ready to train!';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        🤖 Model Training Center
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
        {/* Training Controls */}
        <div>
          <h3 className="text-lg font-semibold mb-3">🎯 Training Controls</h3>
          
          {/* Training Requirements */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Training Requirements</h4>
            <div className={`text-sm ${canTrain() ? 'text-green-600' : 'text-orange-600'}`}>
              {getTrainingRequirements()}
            </div>
            
            {datasetInfo && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Gestures:</span>
                  <span className={datasetInfo.gestureCount >= 2 ? 'text-green-600' : 'text-red-600'}>
                    {datasetInfo.gestureCount}/2+ required ✓
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Samples:</span>
                  <span className={datasetInfo.totalSamples >= (datasetInfo.gestureCount * 2) ? 'text-green-600' : 'text-red-600'}>
                    {datasetInfo.totalSamples}/{datasetInfo.gestureCount * 2}+ required
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Min per Gesture:</span>
                  <span className={Math.min(...Object.values(datasetInfo.gestures || {})) >= 2 ? 'text-green-600' : 'text-red-600'}>
                    {Math.min(...Object.values(datasetInfo.gestures || {}))} (need 2+)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Model Status:</span>
                  <span className={datasetInfo.modelExists ? 'text-blue-600' : 'text-gray-600'}>
                    {datasetInfo.modelExists ? '🤖 Trained' : '❌ Not trained'}
                  </span>
                </div>
                {datasetInfo.totalSamples >= (datasetInfo.gestureCount * 5) && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                    ✨ Great! You have enough data for high accuracy training.
                  </div>
                )}
                {datasetInfo.totalSamples < (datasetInfo.gestureCount * 5) && datasetInfo.totalSamples >= (datasetInfo.gestureCount * 2) && (
                  <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    💡 Tip: 5+ samples per gesture recommended for better accuracy.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Training Button */}
          <button
            onClick={startTraining}
            disabled={!canTrain()}
            className={`w-full px-6 py-4 rounded-lg font-medium text-lg transition-colors ${
              canTrain()
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isTraining ? '🔄 Training in Progress...' : '🚀 Start Training'}
          </button>

          {/* Training Progress */}
          {isTraining && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{trainingStatus}</span>
                <span className="text-sm text-gray-600">{Math.round(trainingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${trainingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Training Results */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📊 Model Information</h3>
          
          {/* Current Model Status */}
          {modelInfo && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Current Model</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Model Type:</span>
                  <span className="font-mono">{modelInfo.modelType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-mono">{modelInfo.version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Hands:</span>
                  <span>{modelInfo.maxHands}</span>
                </div>
                <div className="flex justify-between">
                  <span>Landmarks:</span>
                  <span>{modelInfo.landmarks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Detection Confidence:</span>
                  <span>{modelInfo.detectionConfidence}</span>
                </div>
              </div>
            </div>
          )}

          {/* Training Results */}
          {trainingResult && trainingResult.success && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-3 text-green-800">🎉 Training Results</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(trainingResult.accuracy! * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {trainingResult.gestureCount}
                    </div>
                    <div className="text-sm text-gray-600">Gestures</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Samples:</span>
                    <div className="text-lg font-semibold">{trainingResult.totalSamples}</div>
                  </div>
                  <div>
                    <span className="font-medium">Training/Test Split:</span>
                    <div className="text-lg font-semibold">
                      {trainingResult.trainingSamples}/{trainingResult.testingSamples}
                    </div>
                  </div>
                </div>

                {trainingResult.gestures && (
                  <div>
                    <h5 className="font-medium mb-2">Trained Gestures:</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(trainingResult.gestures).map(([gesture, count]) => (
                        <span key={gesture} className="px-2 py-1 bg-green-200 text-green-800 rounded text-sm">
                          {gesture}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Trained at: {new Date(trainingResult.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Overview */}
      {datasetInfo && datasetInfo.exists && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📈 Dataset Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{datasetInfo.totalSamples}</div>
              <div className="text-sm text-gray-600">Total Samples</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{datasetInfo.gestureCount}</div>
              <div className="text-sm text-gray-600">Gesture Types</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {datasetInfo.totalSamples > 0 ? Math.round(datasetInfo.totalSamples / datasetInfo.gestureCount) : 0}
              </div>
              <div className="text-sm text-gray-600">Avg. per Gesture</div>
            </div>
          </div>

          {datasetInfo.gestures && Object.keys(datasetInfo.gestures).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Sample Distribution:</h4>
              <div className="space-y-2">
                {Object.entries(datasetInfo.gestures).map(([gesture, count]) => {
                  const percentage = (count / datasetInfo.totalSamples) * 100;
                  return (
                    <div key={gesture} className="flex items-center space-x-3">
                      <div className="w-24 text-sm font-medium truncate">{gesture}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-sm text-right">{count} ({percentage.toFixed(1)}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelTrainer;