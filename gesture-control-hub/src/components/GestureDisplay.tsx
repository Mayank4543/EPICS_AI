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
          color: 'from-red-500 to-pink-500',
          bgColor: 'from-red-50 to-pink-50',
          icon: '✋'
        };
      case '👍':
      case 'thumbs_up':
        return {
          name: 'Thumbs Up',
          action: 'Increase fan speed',
          color: 'from-green-500 to-emerald-500',
          bgColor: 'from-green-50 to-emerald-50',
          icon: '👍'
        };
      case '👎':
      case 'thumbs_down':
        return {
          name: 'Thumbs Down',
          action: 'Decrease fan speed',
          color: 'from-orange-500 to-red-500',
          bgColor: 'from-orange-50 to-red-50',
          icon: '👎'
        };
      case '👉':
      case 'index_finger':
        return {
          name: 'Pointing',
          action: 'Toggle TV power',
          color: 'from-blue-500 to-indigo-500',
          bgColor: 'from-blue-50 to-indigo-50',
          icon: '👉'
        };
      default:
        return {
          name: 'No Gesture',
          action: 'Waiting for hand gesture...',
          color: 'from-gray-400 to-gray-500',
          bgColor: 'from-gray-50 to-gray-100',
          icon: '❓'
        };
    }
  };

  const gestureInfo = getGestureInfo(currentGesture);
  const isActive = currentGesture && currentGesture !== '';

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-xl border transition-all duration-700 transform ${
      isActive 
        ? `bg-gradient-to-br ${gestureInfo.bgColor} border-white/50 scale-105 shadow-2xl` 
        : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:shadow-lg'
    }`}>
      {/* Animated Background Pattern */}
      {isActive && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse"></div>
        </div>
      )}
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <h2 className="text-xl font-bold text-gray-800">Current Gesture</h2>
            <div className={`w-3 h-3 rounded-full ${
              isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}></div>
          </div>
        </div>

        {/* Gesture Display */}
        <div className="text-center">
          {/* Gesture Icon */}
          <div className={`relative mx-auto w-32 h-32 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 ${
            isActive 
              ? `bg-gradient-to-br ${gestureInfo.color} shadow-2xl animate-bounce` 
              : 'bg-gray-100 shadow-inner'
          }`}>
            {/* Glow Effect */}
            {isActive && (
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gestureInfo.color} opacity-20 blur-xl animate-pulse`}></div>
            )}
            
            <span className="relative z-10 text-6xl filter drop-shadow-lg">
              {gestureInfo.icon}
            </span>
            
            {/* Ripple Effect */}
            {isActive && (
              <div className="absolute inset-0 rounded-3xl border-4 border-white/30 animate-ping"></div>
            )}
          </div>

          {/* Gesture Info */}
          <div className="space-y-3">
            <h3 className={`text-2xl font-bold transition-all duration-300 ${
              isActive ? `bg-gradient-to-r ${gestureInfo.color} bg-clip-text text-transparent` : 'text-gray-800'
            }`}>
              {gestureInfo.name}
            </h3>
            
            <div className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
              isActive 
                ? `bg-gradient-to-r ${gestureInfo.color} text-white shadow-lg` 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {gestureInfo.action}
            </div>
            
            {/* Status Indicator */}
            {isActive && (
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm font-semibold text-green-600 ml-3">
                  Processing command...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${gestureInfo.color}`}></div>
      </div>
      <div className="absolute bottom-4 left-4 opacity-20">
        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${gestureInfo.color}`}></div>
      </div>
    </div>
  );
};

export default GestureDisplay;