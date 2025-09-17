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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header with Glass Effect */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='nonzero'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center group">
              {/* Enhanced Logo */}
              <div className="relative mr-4">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                <svg className="h-12 w-12 relative z-10 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-wide bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  SmartGesture Hub
                </h1>
                <p className="text-blue-100 text-sm font-medium opacity-90">AI-Powered Home Automation</p>
              </div>
            </div>
            
            {/* Enhanced ML Status */}
            {datasetInfo && (
              <div className="hidden md:flex items-center space-x-6">
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <div className={`w-3 h-3 rounded-full ${datasetInfo.modelExists ? 'bg-green-400 animate-pulse' : 'bg-amber-400'} shadow-lg`}></div>
                  <div>
                    <div className="text-sm font-semibold">
                      {datasetInfo.modelExists ? '🤖 AI Model Active' : '⚠️ Training Required'}
                    </div>
                    {datasetInfo.totalSamples > 0 && (
                      <div className="text-xs text-blue-200">
                        {datasetInfo.totalSamples} samples • {datasetInfo.gestureCount} gestures
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Tab Navigation */}
          <nav className="mt-6">
            <div className="flex space-x-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab.id
                      ? 'bg-white text-indigo-700 shadow-lg shadow-white/25'
                      : 'text-blue-100 hover:text-white hover:bg-white/20'
                  }`}
                >
                  <span className="text-lg mr-3">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
                  <span className="sm:hidden">{tab.icon}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Device Control Tab */}
        {activeTab === 'control' && (
          <div className="space-y-8">
            {/* Hero Section - Simplified */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Control Your Smart Home
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Use hand gestures to seamlessly control your smart devices
              </p>
            </div>
            
            {/* Main Content Layout - Improved Camera Focus */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Camera Feed - Takes 2/3 width on large screens */}
              <div className="lg:col-span-2">
                <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Status Badge and AI Toggle - Top Right */}
                  <div className="absolute top-4 right-4 z-20 flex items-center space-x-3">
                    {/* Backend Status */}
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border ${
                      /* We'll get this from CameraFeed component status */
                      'bg-green-100/90 text-green-800 border-green-200'
                    }`}>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Backend Connected</span>
                    </div>

                    {/* AI Mode Toggle */}
                    {datasetInfo?.modelExists && (
                      <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200 shadow-sm">
                        <span className="text-xs font-medium text-gray-700">AI Mode</span>
                        <button
                          onClick={() => setUseMLModel(!useMLModel)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            useMLModel 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 focus:ring-blue-500' 
                              : 'bg-gray-300 focus:ring-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              useMLModel ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-medium ${
                          useMLModel ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {useMLModel ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Camera Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Live Camera Feed</h3>
                        <p className="text-gray-600">Real-time gesture recognition powered by AI</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Camera Feed Content */}
                  <div className="p-8">
                    <CameraFeed 
                      onGestureDetected={handleGestureDetected}
                      useMLModel={useMLModel && datasetInfo?.modelExists}
                    />
                  </div>
                </div>
              </div>
              
              {/* Gesture Display - Takes 1/3 width */}
              <div className="lg:col-span-1">
                <GestureDisplay currentGesture={currentGesture} />
              </div>
            </div>
            
            {/* Device Control Section - Simplified */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Smart Device Dashboard</h3>
                <p className="text-gray-600">Monitor and control all your connected devices</p>
              </div>
              
              {loading ? (
                <div className="flex flex-col justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Connecting to your smart home...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {devices.map((device, index) => (
                    <div 
                      key={device.id} 
                      className="transform transition-all duration-300 hover:scale-105"
                    >
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
      
      {/* Enhanced Footer */}
      <footer className="mt-24 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">SmartGesture Hub</h3>
              </div>
              <p className="text-blue-200 leading-relaxed">
                Experience the future of home automation with AI-powered gesture recognition. 
                Control your smart devices with simple hand movements.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2 text-sm text-blue-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Real-time Detection</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>ML Powered</span>
                </div>
              </div>
            </div>
            
            {/* Features Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-blue-300">Key Features</h4>
              <ul className="space-y-2 text-blue-200">
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Real-time gesture recognition</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Custom gesture training</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Smart device integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>AI-powered accuracy</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Intuitive web interface</span>
                </li>
              </ul>
            </div>
            
            {/* Stats Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-blue-300">System Status</h4>
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-200">Model Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      datasetInfo?.modelExists 
                        ? 'bg-green-500 text-white' 
                        : 'bg-orange-500 text-white'
                    }`}>
                      {datasetInfo?.modelExists ? 'Trained' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                {datasetInfo && (
                  <>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">Gestures</span>
                        <span className="text-white font-semibold">{datasetInfo.gestureCount}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">Training Samples</span>
                        <span className="text-white font-semibold">{datasetInfo.totalSamples}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-white/20 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-blue-200">
                <p>&copy; {new Date().getFullYear()} SmartGesture Hub. Powered by AI & Machine Learning.</p>
              </div>
              <div className="flex items-center space-x-6 text-blue-300">
                <span className="text-sm">Built with</span>
                <div className="flex space-x-3">
                  <span className="px-2 py-1 bg-blue-500/20 rounded text-xs">React</span>
                  <span className="px-2 py-1 bg-green-500/20 rounded text-xs">Flask</span>
                  <span className="px-2 py-1 bg-purple-500/20 rounded text-xs">MediaPipe</span>
                  <span className="px-2 py-1 bg-orange-500/20 rounded text-xs">ML</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;