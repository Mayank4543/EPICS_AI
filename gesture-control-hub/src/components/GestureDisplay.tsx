import React from 'react';

interface GestureDisplayProps {
  currentGesture: string;
}

const GestureDisplay: React.FC<GestureDisplayProps> = ({ currentGesture }) => {
  const getGestureName = (gesture: string) => {
    switch (gesture) {
      case '✋':
        return 'Open Palm (Turn OFF all lights)';
      case '👍':
        return 'Thumbs Up (Increase fan speed)';
      case '👎':
        return 'Thumbs Down (Decrease fan speed)';
      case '👉':
        return 'Pointing (Toggle TV power)';
      default:
        return 'No gesture detected';
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-lg p-6 mb-6 flex items-center justify-center flex-col
        ${currentGesture 
          ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-b-4 border-indigo-400' 
          : 'bg-white border-b-4 border-gray-200'} 
        transition-all duration-500`}
    >
      <h2 className="text-xl font-bold mb-4 text-indigo-700">
        Current Gesture
      </h2>
      
      <div className="flex items-center justify-center flex-col sm:flex-row gap-5 w-full">
        <div className={`text-7xl p-4 rounded-full ${
          currentGesture 
            ? 'bg-white shadow-md animate-bounce' 
            : 'bg-gray-50'
        }`}>
          {currentGesture || '❓'}
        </div>
        
        <div className="flex-1">
          <div className="text-lg font-medium text-gray-800 text-center sm:text-left">
            {getGestureName(currentGesture)}
          </div>
          
          {currentGesture && (
            <div className="mt-2 text-sm text-indigo-500 text-center sm:text-left">
              Gesture detected! Your smart home is responding...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestureDisplay;