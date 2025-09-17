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
            <svg className={`h-12 w-12 transition-all duration-300 ${
              isOn ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-400'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          gradient: 'from-yellow-400 to-orange-500',
          bgGradient: 'from-yellow-50 to-orange-50',
          shadowColor: 'shadow-yellow-500/25',
          statusText: isOn ? '✨ Illuminating your space' : '💡 Ready to brighten up',
          accentColor: 'yellow'
        };
      case 'fan':
        return {
          icon: (
            <svg className={`h-12 w-12 transition-all duration-300 ${
              isOn ? 'text-blue-500 drop-shadow-lg animate-spin' : 'text-gray-400'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          gradient: 'from-blue-500 to-cyan-500',
          bgGradient: 'from-blue-50 to-cyan-50',
          shadowColor: 'shadow-blue-500/25',
          statusText: isOn ? `💨 Circulating at level ${level}` : '🌀 Ready to cool down',
          accentColor: 'blue'
        };
      case 'tv':
        return {
          icon: (
            <svg className={`h-12 w-12 transition-all duration-300 ${
              isOn ? 'text-purple-500 drop-shadow-lg' : 'text-gray-400'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          gradient: 'from-purple-500 to-indigo-500',
          bgGradient: 'from-purple-50 to-indigo-50',
          shadowColor: 'shadow-purple-500/25',
          statusText: isOn ? '📺 Entertainment ready' : '📱 Ready to stream',
          accentColor: 'purple'
        };
      default:
        return {
          icon: null,
          gradient: 'from-gray-400 to-gray-500',
          bgGradient: 'from-gray-50 to-gray-100',
          shadowColor: 'shadow-gray-500/25',
          statusText: 'Device status',
          accentColor: 'gray'
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
    <div className={`relative overflow-hidden rounded-3xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-1 ${
      isOn 
        ? `bg-gradient-to-br ${deviceConfig.bgGradient} shadow-2xl ${deviceConfig.shadowColor} border border-white/50` 
        : 'bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border border-gray-200/50'
    }`}>
      {/* Animated Background Pattern */}
      {isOn && (
        <div className="absolute inset-0 opacity-5">
          <div className={`absolute inset-0 bg-gradient-to-r ${deviceConfig.gradient} transform rotate-45 scale-150`}></div>
        </div>
      )}
      
      <div className="relative z-10 p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h3 className={`text-xl font-bold mb-1 transition-colors duration-300 ${
              isOn ? 'text-gray-800' : 'text-gray-600'
            }`}>
              {name}
            </h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
              isOn 
                ? `bg-gradient-to-r ${deviceConfig.gradient} text-white shadow-lg`
                : 'bg-gray-200 text-gray-600'
            }`}>
              {isOn ? 'ACTIVE' : 'STANDBY'}
            </div>
          </div>
          
          {/* Device Icon */}
          <div className={`ml-4 p-3 rounded-2xl transition-all duration-500 ${
            isOn 
              ? `bg-white shadow-lg transform scale-110`
              : 'bg-gray-100'
          }`}>
            {deviceConfig.icon}
          </div>
        </div>
        
        {/* Control Section */}
        <div className="space-y-4">
          {/* Power Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Power</span>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isOn} 
                onChange={onToggle}
              />
              <div className={`w-14 h-7 bg-gray-200 rounded-full peer transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:${deviceConfig.gradient} peer-checked:shadow-lg peer-checked:${deviceConfig.shadowColor} group-hover:scale-105`}>
                <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-6 w-6 transition-all duration-300 peer-checked:transform peer-checked:translate-x-7 peer-checked:border-white shadow-md`}></div>
              </div>
            </label>
          </div>
          
          {/* Fan Speed Control */}
          {type === 'fan' && (
            <div className={`transition-all duration-500 ${isOn ? 'opacity-100' : 'opacity-50'}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Speed Level</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  isOn ? `bg-gradient-to-r ${deviceConfig.gradient} text-white` : 'bg-gray-200 text-gray-600'
                }`}>
                  {level}/3
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={level}
                  onChange={handleSliderChange}
                  disabled={!isOn}
                  className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-all duration-300 ${
                    isOn 
                      ? `bg-gradient-to-r ${deviceConfig.bgGradient} shadow-inner`
                      : 'bg-gray-200'
                  }`}
                  style={{
                    background: isOn 
                      ? `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${(level/3)*100}%, rgb(229 231 235) ${(level/3)*100}%, rgb(229 231 235) 100%)`
                      : 'rgb(229 231 235)'
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                  {['Off', 'Low', 'Medium', 'High'].map((label, index) => (
                    <span key={label} className={`transition-colors duration-300 ${
                      level === index ? `font-bold text-${deviceConfig.accentColor}-600` : ''
                    }`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Footer */}
        <div className={`mt-6 pt-4 border-t transition-all duration-300 ${
          isOn ? 'border-white/30' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            {isOn && (
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${deviceConfig.gradient} animate-pulse`}></div>
            )}
            <span className={`text-xs font-medium text-center transition-colors duration-300 ${
              isOn ? `text-${deviceConfig.accentColor}-600` : 'text-gray-500'
            }`}>
              {deviceConfig.statusText}
            </span>
          </div>
        </div>
      </div>
      
      {/* Decorative Corner Elements */}
      <div className="absolute top-2 right-2 opacity-20">
        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${deviceConfig.gradient}`}></div>
      </div>
      <div className="absolute bottom-2 left-2 opacity-10">
        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${deviceConfig.gradient}`}></div>
      </div>
    </div>
  );
};

export default DeviceCard;