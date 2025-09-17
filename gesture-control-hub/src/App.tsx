import React, { useState, useEffect } from 'react';

// Import components
import CameraFeed from './components/CameraFeed';
import GestureDisplay from './components/GestureDisplay';
import DeviceCard from './components/DeviceCard';

// Import API service
import api, { Device } from './services/api';

function App() {
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial device states
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await api.getDeviceStates();
        setDevices(data.devices);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch device states:', error);
        setLoading(false);
      }
    };

    fetchDevices();

    // Set up polling for device states (every 10 seconds instead of 2)
    // This gives users more time to interact with devices before refresh
    const interval = setInterval(fetchDevices, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle gesture detection
  const handleGestureDetected = (gesture: string) => {
    setCurrentGesture(gesture);
    
    // Process gesture and control devices
    switch (gesture) {
      case '✋': // Turn OFF all lights
        handleTurnOffAllLights();
        break;
      case '👍': // Increase fan speed
        handleIncreaseFanSpeed();
        break;
      case '👎': // Decrease fan speed
        handleDecreaseFanSpeed();
        break;
      case '👉': // Toggle TV power
        handleToggleTV();
        break;
      default:
        break;
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
        <div className="container mx-auto px-6 py-4 flex items-center">
          <svg className="h-8 w-8 mr-3 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
          <h1 className="text-2xl font-bold flex-grow tracking-wide">Gesture-Controlled Smart Home Hub</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Top Section - Camera and Gesture */}
          <div className="md:col-span-8 transition-all duration-300 hover:shadow-xl rounded-xl overflow-hidden">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-indigo-700">Camera Feed</h2>
              <CameraFeed onGestureDetected={handleGestureDetected} />
            </div>
          </div>
          <div className="md:col-span-4 transition-all duration-300 hover:shadow-xl rounded-xl">
            <GestureDisplay currentGesture={currentGesture} />
          </div>
          
          {/* Device Control Section */}
          <div className="col-span-12">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-700">Device Controls</h2>
              <div className="ml-4 h-1 flex-grow bg-gradient-to-r from-indigo-500 to-transparent rounded-full"></div>
            </div>
          </div>
          
          {loading ? (
            <div className="col-span-12 flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="ml-4 text-lg text-gray-600">Loading your smart home...</p>
            </div>
          ) : (
            <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
        
        <div className="mt-20 mb-8 text-center">
          <div className="h-px w-1/3 mx-auto bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <footer className="mt-6">
            <p className="text-gray-500">
              Gesture-Controlled Smart Home Hub © {new Date().getFullYear()}
            </p>
            <p className="text-indigo-400 text-sm mt-2">
              Control your home with a wave of your hand
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;