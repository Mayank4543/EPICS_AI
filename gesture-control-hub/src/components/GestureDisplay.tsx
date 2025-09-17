import React from 'react';

interface GestureDisplayProps {
  currentGesture: string;
}

const GestureDisplay: React.FC<GestureDisplayProps> = ({ currentGesture }) => {
  const getGestureInfo = (gesture: string) => {
    switch (gesture) {
      case '✋':
      case 'open_hand':
        return {
          name: 'Open Palm',
          action: 'Turn OFF all lights',
          color: 'bg-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '✋'
        };
      case '👍':
      case 'thumbs_up':
        return {
          name: 'Thumbs Up',
          action: 'Increase fan speed',
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '👍'
        };
      case '👎':
      case 'thumbs_down':
        return {
          name: 'Thumbs Down',
          action: 'Decrease fan speed',
          color: 'bg-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: '👎'
        };
      case '👉':
      case 'index_finger':
        return {
          name: 'Pointing',
          action: 'Toggle TV power',
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: '👉'
        };
      default:
        return {
          name: 'No Gesture',
          action: 'Waiting for hand gesture...',
          color: 'bg-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❓'
        };
    }
  };

  const gestureInfo = getGestureInfo(currentGesture);
  const isActive = currentGesture && currentGesture !== '';

  return (
    <div className={`h-full bg-white rounded-2xl shadow-lg border transition-all duration-500 ${
      isActive ? `${gestureInfo.bgColor} ${gestureInfo.borderColor}` : 'border-gray-100'
    }`}>
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              isActive ? gestureInfo.color : 'bg-gray-300'
            } ${isActive ? 'animate-pulse' : ''}`}></div>
            <h2 className="text-lg font-semibold text-gray-800">Current Gesture</h2>
            <div className={`w-2 h-2 rounded-full ${
              isActive ? gestureInfo.color : 'bg-gray-300'
            } ${isActive ? 'animate-pulse' : ''}`}></div>
          </div>
        </div>

        {/* Gesture Display */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          {/* Gesture Icon */}
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            isActive 
              ? `${gestureInfo.color} shadow-lg transform scale-110` 
              : 'bg-gray-100'
          }`}>
            <span className="text-4xl filter drop-shadow-sm">
              {gestureInfo.icon}
            </span>
          </div>

          {/* Gesture Info */}
          <div className="space-y-2">
            <h3 className={`text-xl font-bold transition-all duration-300 ${
              isActive ? 'text-gray-800' : 'text-gray-600'
            }`}>
              {gestureInfo.name}
            </h3>
            
            <div className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isActive 
                ? `${gestureInfo.color} text-white` 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {gestureInfo.action}
            </div>
            
            {/* Status Indicator */}
            {isActive && (
              <div className="flex items-center justify-center space-x-2 mt-3 animate-fade-in">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs font-medium text-green-600 ml-2">
                  Processing...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestureDisplay;