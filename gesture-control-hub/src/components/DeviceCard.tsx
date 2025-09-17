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
  const getIcon = () => {
    switch (type) {
      case 'light':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isOn ? 'text-yellow-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'fan':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isOn ? 'text-primary' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'tv':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isOn ? 'text-primary' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onLevelChange) {
      onLevelChange(parseInt(e.target.value, 10));
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg transition-all duration-500 p-6 ${
        isOn 
          ? type === 'light' 
            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-400' 
            : type === 'fan'
              ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-blue-400'
              : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-purple-400'
          : 'bg-white border-l-4 border-gray-200'
      }`}
    >
      <div className="flex justify-between items-center mb-5">
        <h3 className={`text-lg font-bold ${isOn ? 'text-gray-800' : 'text-gray-600'}`}>
          {name}
        </h3>
        <div className={`transition-transform duration-700 ${isOn && type === 'fan' ? 'animate-spin' : ''}`}>
          {getIcon()}
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          isOn 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isOn ? 'ACTIVE' : 'STANDBY'}
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={isOn} 
            onChange={onToggle}
          />
          <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
        </label>
      </div>
      
      {type === 'fan' && (
        <div className={`mt-5 transition-opacity duration-300 ${isOn ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="fan-speed-slider" className="block text-sm font-medium text-gray-700">
              Fan Speed
            </label>
            <span className="text-sm font-bold text-blue-600">{level}/3</span>
          </div>
          <input
            id="fan-speed-slider"
            type="range"
            min="0"
            max="3"
            step="1"
            value={level}
            onChange={handleSliderChange}
            disabled={!isOn}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span className={level === 0 ? 'font-bold text-blue-600' : ''}>Off</span>
            <span className={level === 1 ? 'font-bold text-blue-600' : ''}>Low</span>
            <span className={level === 2 ? 'font-bold text-blue-600' : ''}>Medium</span>
            <span className={level === 3 ? 'font-bold text-blue-600' : ''}>High</span>
          </div>
        </div>
      )}
      
      <div className="text-center mt-4 pt-3 border-t border-gray-100">
        <span className={`text-xs ${isOn ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>
          {type === 'light' 
            ? isOn ? '✨ Illuminating your space' : 'Light is off'
            : type === 'fan' 
              ? isOn ? `💨 Circulating at level ${level}` : 'Fan is off'
              : isOn ? '📺 TV is powered on' : 'TV is off'
          }
        </span>
      </div>
    </div>
  );
};

export default DeviceCard;