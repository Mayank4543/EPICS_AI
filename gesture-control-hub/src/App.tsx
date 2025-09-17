import React, { useState, useEffect } from 'react';

// Import components
import CameraFeed from './components/CameraFeed';
import GestureDisplay from './components/GestureDisplay';
import DeviceCard from './components/DeviceCard';
import GestureRecorder from './components/GestureRecorder';
import ModelTrainer from './components/ModelTrainer';

// Import API service
import api, { Device, RecordGestureResponse, TrainModelResponse, DatasetInfoResponse } from './services/api';

function App() {
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'control' | 'record' | 'train'>('control');
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfoResponse | null>(null);
  const [useMLModel, setUseMLModel] = useState<boolean>(false);

  // Tab configuration
  const tabs = [
    { id: 'control', label: '🏠 Device Control', icon: '🏠' },
    { id: 'record', label: '📹 Record Gestures', icon: '📹' },
    { id: 'train', label: '🤖 Train Model', icon: '🤖' }
  ];

  // Fetch initial device states and dataset info
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [deviceData, datasetData] = await Promise.all([
          api.getDeviceStates(),
          api.getDatasetInfo().catch(() => null)
        ]);
        
        setDevices(deviceData.devices);
        if (datasetData) {
          setDatasetInfo(datasetData);
          setUseMLModel(datasetData.modelExists);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setLoading(false);
      }
    };

    fetchInitialData();

    // Set up polling for device states
    const interval = setInterval(async () => {
      try {
        const data = await api.getDeviceStates();
        setDevices(data.devices);
      } catch (error) {
        console.error('Failed to fetch device states:', error);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle gesture detection
  const handleGestureDetected = (gesture: string) => {
    setCurrentGesture(gesture);
    
    // Process gesture and control devices
    switch (gesture) {
      case '✋': // Turn OFF all lights
      case 'open_hand': // ML model name
        handleTurnOffAllLights();
        break;
      case '👍': // Increase fan speed
      case 'thumbs_up': // ML model name
        handleIncreaseFanSpeed();
        break;
      case '👎': // Decrease fan speed
      case 'thumbs_down': // ML model name
        handleDecreaseFanSpeed();
        break;
      case '👉': // Toggle TV power
      case 'index_finger': // ML model name
        handleToggleTV();
        break;
      default:
        break;
    }
  };

  // Handle recording completion
  const handleRecordingComplete = (response: RecordGestureResponse) => {
    console.log('Gesture recorded:', response);
    // Refresh dataset info
    loadDatasetInfo();
  };

  // Handle training completion
  const handleTrainingComplete = (response: TrainModelResponse) => {
    console.log('Training completed:', response);
    setUseMLModel(true);
    // Refresh dataset info
    loadDatasetInfo();
  };

  // Load dataset info
  const loadDatasetInfo = async () => {
    try {
      const info = await api.getDatasetInfo();
      setDatasetInfo(info);
    } catch (error) {
      console.error('Failed to load dataset info:', error);
    }
  };

  // Device control functions
  const handleToggleDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    try {
      await api.updateDevice(deviceId, { isOn: !device.isOn });
      
      // Update local state
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, isOn: !d.isOn } : d
      ));
    } catch (error) {
      console.error(`Failed to toggle device ${deviceId}:`, error);
    }
  };

  const handleChangeFanSpeed = async (deviceId: string, level: number) => {
    try {
      await api.updateDevice(deviceId, { level });
      
      // Update local state
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, level } : d
      ));
    } catch (error) {
      console.error(`Failed to change fan speed for ${deviceId}:`, error);
    }
  };

  // Gesture control functions
  const handleTurnOffAllLights = () => {
    const lightDevices = devices.filter(d => d.type === 'light' && d.isOn);
    
    lightDevices.forEach(device => {
      handleToggleDevice(device.id);
    });
  };

  const handleIncreaseFanSpeed = () => {
    const fan = devices.find(d => d.type === 'fan');
    if (!fan) return;
    
    if (!fan.isOn) {
      // Turn on the fan first
      handleToggleDevice(fan.id);
    } else if (fan.level !== undefined && fan.level < 3) {
      // Increase speed if not at max
      handleChangeFanSpeed(fan.id, fan.level + 1);
    }
  };

  const handleDecreaseFanSpeed = () => {
    const fan = devices.find(d => d.type === 'fan');
    if (!fan || !fan.isOn || fan.level === undefined) return;
    
    if (fan.level > 0) {
      handleChangeFanSpeed(fan.id, fan.level - 1);
    } else {
      // Turn off fan if speed is already 0
      handleToggleDevice(fan.id);
    }
  };

  const handleToggleTV = () => {
    const tv = devices.find(d => d.type === 'tv');
    if (tv) {
      handleToggleDevice(tv.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-8 w-8 mr-3 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
              <h1 className="text-2xl font-bold tracking-wide">Gesture-Controlled Smart Home Hub</h1>
            </div>
            
            {/* ML Model Status */}
            {datasetInfo && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${datasetInfo.modelExists ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                  <span>ML Model: {datasetInfo.modelExists ? 'Trained' : 'Not Trained'}</span>
                </div>
                {datasetInfo.totalSamples > 0 && (
                  <div className="text-xs opacity-80">
                    {datasetInfo.totalSamples} samples | {datasetInfo.gestureCount} gestures
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Tab Navigation */}
          <nav className="mt-4">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-indigo-700 shadow-md'
                      : 'text-blue-100 hover:text-white hover:bg-blue-500/20'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        {/* Device Control Tab */}
        {activeTab === 'control' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Camera and Gesture Detection */}
              <div className="md:col-span-8 transition-all duration-300 hover:shadow-xl rounded-xl overflow-hidden">
                <div className="bg-white p-4 rounded-xl shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-indigo-700">Camera Feed</h2>
                    {datasetInfo?.modelExists && (
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Use ML Model:</label>
                        <button
                          onClick={() => setUseMLModel(!useMLModel)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            useMLModel ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              useMLModel ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                  <CameraFeed 
                    onGestureDetected={handleGestureDetected}
                    useMLModel={useMLModel && datasetInfo?.modelExists}
                  />
                </div>
              </div>
              <div className="md:col-span-4 transition-all duration-300 hover:shadow-xl rounded-xl">
                <GestureDisplay currentGesture={currentGesture} />
              </div>
            </div>
            
            {/* Device Control Section */}
            <div>
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-700">Device Controls</h2>
                <div className="ml-4 h-1 flex-grow bg-gradient-to-r from-indigo-500 to-transparent rounded-full"></div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  <p className="ml-4 text-lg text-gray-600">Loading your smart home...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {devices.map(device => (
                    <div key={device.id} className="transform transition-all duration-300 hover:scale-105">
                      <DeviceCard
                        type={device.type}
                        name={device.name}
                        isOn={device.isOn}
                        level={device.level}
                        onToggle={() => handleToggleDevice(device.id)}
                        onLevelChange={
                          device.type === 'fan' 
                            ? (level) => handleChangeFanSpeed(device.id, level) 
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gesture Recording Tab */}
        {activeTab === 'record' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 Record Training Data</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Record multiple samples of different hand gestures to train your custom ML model. 
                The more samples you record, the better your model will perform!
              </p>
            </div>
            
            <GestureRecorder
              onRecordingComplete={handleRecordingComplete}
              onDatasetUpdate={setDatasetInfo}
            />
          </div>
        )}

        {/* Model Training Tab */}
        {activeTab === 'train' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">🤖 Train Your Model</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Train a RandomForest classifier on your recorded gesture data. 
                Once trained, you can use the model for real-time gesture recognition!
              </p>
            </div>
            
            <ModelTrainer onTrainingComplete={handleTrainingComplete} />
          </div>
        )}
      </main>
      
      <footer className="mt-20 mb-8 text-center">
        <div className="h-px w-1/3 mx-auto bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        <div className="mt-6">
          <p className="text-gray-500">
            Gesture-Controlled Smart Home Hub © {new Date().getFullYear()}
          </p>
          <p className="text-indigo-400 text-sm mt-2">
            Control your home with the power of AI and machine learning
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;