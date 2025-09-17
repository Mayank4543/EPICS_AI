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
  }
};

export default api;