import axios from 'axios';

// Base URL for API requests - Flask backend
const API_BASE_URL = 'http://localhost:5000';

// Types for API responses
export interface Device {
  id: string;
  name: string;
  type: 'light' | 'fan' | 'tv';
  isOn: boolean;
  level?: number;
}

export interface DeviceState {
  devices: Device[];
  lastGesture: string;
}

// Types for gesture detection
export interface GestureLandmark {
  index: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface GestureHand {
  handIndex: number;
  handedness: string;
  confidence: number;
  landmarks: GestureLandmark[];
  totalLandmarks: number;
  gesture?: string; // Optional gesture property for ML model results
}

export interface GestureDetectionResponse {
  success: boolean;
  handsDetected: number;
  predictions: GestureHand[];
  timestamp: string;
  processingInfo?: {
    modelType: string;
    modelVersion: string;
    imageSize: {
      width: number;
      height: number;
    };
  };
}

// Types for ML endpoints
export interface RecordGestureRequest {
  gesture_name: string;
  image: string; // base64 encoded image
}

export interface RecordGestureResponse {
  success: boolean;
  message: string;
  gesture_name: string;
  handsDetected: number;
  landmarksSaved: boolean;
  dataset: {
    totalSamples: number;
    gestures: Record<string, number>;
  };
  timestamp: string;
}

export interface TrainModelResponse {
  success: boolean;
  message: string;
  accuracy?: number;
  totalSamples?: number;
  gestureCount?: number;
  gestures?: Record<string, number>;
  trainingSamples?: number;
  testingSamples?: number;
  timestamp: string;
  modelPath?: string;
}

export interface DetectTrainedGestureResponse {
  success: boolean;
  predicted_gesture: string | null;
  confidence: number;
  all_probabilities: Record<string, number>;
  handsDetected: number;
  handedness: string;
  message?: string;
  timestamp: string;
}

export interface DatasetInfoResponse {
  exists: boolean;
  totalSamples: number;
  gestureCount: number;
  gestures: Record<string, number>;
  filePath?: string;
  modelExists: boolean;
  modelPath?: string | null;
  message?: string;
  timestamp: string;
}

export interface ModelInfoResponse {
  modelLoaded: boolean;
  modelType: string;
  version: string;
  description: string;
  maxHands: number;
  landmarks: number;
  inputFormat: string;
  maxImageSize: string;
  detectionConfidence: number;
  trackingConfidence: number;
}

export interface GestureDetectionRequest {
  image: string; // base64 encoded image
}

// Mock device state storage to persist changes between calls
const mockDevices: Device[] = [
  { id: 'light-1', name: 'Living Room Light', type: 'light', isOn: false },
  { id: 'fan-1', name: 'Ceiling Fan', type: 'fan', isOn: false, level: 0 },
  { id: 'tv-1', name: 'Smart TV', type: 'tv', isOn: false }
];

// API service functions
const api = {
  // Get all device states
  getDeviceStates: async (): Promise<DeviceState> => {
    try {
      // In a real implementation, this would fetch from the backend
      // const response = await axios.get(`${API_BASE_URL}/devices`);
      // return response.data;
      
      // Return the persisted mock data
      return {
        devices: mockDevices,
        lastGesture: ''
      };
    } catch (error) {
      console.error('Error fetching device states:', error);
      throw error;
    }
  },

  // Update a device state
  updateDevice: async (deviceId: string, state: Partial<Device>): Promise<Device> => {
    try {
      // In a real implementation, this would send to the backend
      // const response = await axios.post(`${API_BASE_URL}/devices/${deviceId}`, state);
      // return response.data;
      
      // Update the mock device in our persisted array
      const deviceIndex = mockDevices.findIndex(d => d.id === deviceId);
      if (deviceIndex !== -1) {
        mockDevices[deviceIndex] = {
          ...mockDevices[deviceIndex],
          ...state
        };
        return mockDevices[deviceIndex];
      }
      
      // If device not found, return a new mock device
      const newDevice = {
        id: deviceId,
        name: state.name || 'Device',
        type: state.type || 'light',
        isOn: state.isOn !== undefined ? state.isOn : false,
        level: state.level
      };
      return newDevice;
    } catch (error) {
      console.error(`Error updating device ${deviceId}:`, error);
      throw error;
    }
  },

  // Detect gestures from base64 image
  detectGesture: async (imageData: string): Promise<GestureDetectionResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/detect-gesture`, {
        image: imageData
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      return response.data;
    } catch (error) {
      console.error('Error detecting gesture:', error);
      throw error;
    }
  },

  // Check Flask backend health
  checkBackendHealth: async (): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000, // 5 second timeout
      });
      return response.data.status === 'OK';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  },

  // Get model information
  getModelInfo: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/model-info`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting model info:', error);
      throw error;
    }
  },

  // Get video feed URL
  getVideoFeedUrl: (): string => {
    return `${API_BASE_URL}/video_feed`;
  },

  // === NEW ML ENDPOINTS ===

  // Record gesture for training
  recordGesture: async (gestureName: string, imageData: string): Promise<RecordGestureResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/record-gesture`, {
        gesture_name: gestureName,
        image: imageData
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 second timeout for processing
      });
      
      return response.data;
    } catch (error) {
      console.error('Error recording gesture:', error);
      throw error;
    }
  },

  // Train the ML model
  trainModel: async (): Promise<TrainModelResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/train`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout for training
      });
      
      return response.data;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  },

  // Detect gesture using trained ML model
  detectTrainedGesture: async (imageData: string): Promise<DetectTrainedGestureResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/detect`, {
        image: imageData
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      return response.data;
    } catch (error) {
      console.error('Error detecting trained gesture:', error);
      throw error;
    }
  },

  // Get dataset information
  getDatasetInfo: async (): Promise<DatasetInfoResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dataset-info`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting dataset info:', error);
      throw error;
    }
  },

  // Get detailed model information
  getDetailedModelInfo: async (): Promise<ModelInfoResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/model-info`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting detailed model info:', error);
      throw error;
    }
  }
};

export default api;