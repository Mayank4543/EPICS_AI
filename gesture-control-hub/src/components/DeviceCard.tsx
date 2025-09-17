import React from 'react';

interface DeviceCardProps {
  type: 'light' | 'fan' | 'tv';
  name: string;
  isOn: boolean;
  level?: number;
  onToggle: () => void;
  onLevelChange?: (value: number) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ 
  type, 
  name, 
  isOn, 
  level = 0, 
  onToggle, 
  onLevelChange 
}) => {
  const getDeviceConfig = () => {
    switch (type) {
      case 'light':
        return {
          icon: (
            <svg className={`h-8 w-8 transition-colors duration-300 ${
              isOn ? 'text-yellow-500' : 'text-gray-400'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          color: 'yellow',
          bgColor: isOn ? 'bg-yellow-50' : 'bg-white',
          borderColor: isOn ? 'border-yellow-200' : 'border-gray-200',
          statusColor: isOn ? 'bg-yellow-500' : 'bg-gray-400'
        };
      case 'fan':
        return {
          icon: (
            <svg className={`h-8 w-8 transition-all duration-300 ${
              isOn ? 'text-blue-500 animate-spin' : 'text-gray-400'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          color: 'blue',
          bgColor: isOn ? 'bg-blue-50' : 'bg-white',
          borderColor: isOn ? 'border-blue-200' : 'border-gray-200',
          statusColor: isOn ? 'bg-blue-500' : 'bg-gray-400'
        };
      case 'tv':
        return {
          icon: (
            <svg className={`h-8 w-8 transition-colors duration-300 ${
              isOn ? 'text-purple-500' : 'text-gray-400'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          color: 'purple',
          bgColor: isOn ? 'bg-purple-50' : 'bg-white',
          borderColor: isOn ? 'border-purple-200' : 'border-gray-200',
          statusColor: isOn ? 'bg-purple-500' : 'bg-gray-400'
        };
      default:
        return {
          icon: null,
          color: 'gray',
          bgColor: 'bg-white',
          borderColor: 'border-gray-200',
          statusColor: 'bg-gray-400'
        };
    }
  };

  const deviceConfig = getDeviceConfig();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onLevelChange) {
      onLevelChange(parseInt(e.target.value, 10));
    }
  };

  return (
    <div className={`rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
      deviceConfig.bgColor
    } ${deviceConfig.borderColor}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isOn 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isOn ? 'ON' : 'OFF'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {deviceConfig.icon}
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isOn} 
                onChange={onToggle}
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                isOn ? `peer-checked:bg-${deviceConfig.color}-500` : ''
              }`}></div>
            </label>
          </div>
        </div>
        
        {/* Fan Speed Control */}
        {type === 'fan' && (
          <div className={`transition-opacity duration-300 ${isOn ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Speed</label>
              <span className="text-sm font-semibold text-blue-600">{level}/3</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={level}
              onChange={handleSliderChange}
              disabled={!isOn}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Off</span>
              <span>Low</span>
              <span>Med</span>
              <span>High</span>
            </div>
          </div>
        )}
        
        {/* Status */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${deviceConfig.statusColor} ${isOn ? 'animate-pulse' : ''}`}></div>
            <span className="text-xs text-gray-600">
              {type === 'light' 
                ? isOn ? 'Illuminating' : 'Ready'
                : type === 'fan' 
                  ? isOn ? `Level ${level}` : 'Standby'
                  : isOn ? 'Streaming' : 'Standby'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;