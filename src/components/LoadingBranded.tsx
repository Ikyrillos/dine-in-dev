import React from 'react';

interface TawilaShimmerProps {
  /** If true, takes full screen height. If false, centers within parent container */
  fullScreen?: boolean;
  /** Custom height class when not full screen */
  heightClass?: string;
}

const TawilaShimmer: React.FC<TawilaShimmerProps> = ({
  fullScreen = true,
  heightClass = "min-h-[400px]"
}) => {
  const containerClass = fullScreen
    ? "flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    : `flex items-center justify-center ${heightClass} bg-gradient-to-br from-gray-50 to-gray-100`;

  return (
    <div className={containerClass}>
      <div className="relative bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-16 w-96 h-96 flex flex-col items-center justify-center overflow-hidden">
        {/* Main shimmer overlay animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse transform -translate-x-full"></div>
        
        {/* Tawila text with shimmer effect */}
        <div className="relative mb-8">
          <div className="text-7xl font-bold text-gray-600/80 tracking-wide relative overflow-hidden">
            Tawila
            {/* Text shimmer overlay using pseudo-element approach with Tailwind */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse transform -translate-x-full"></div>
          </div>
          
          {/* Modern smile design */}
          <div className="flex justify-center mt-6">
            <div className="relative w-32 h-20">
              {/* Curved smile shape using SVG */}
              <svg 
                viewBox="0 0 128 80" 
                className="w-full h-full overflow-hidden"
                fill="none"
              >
                <defs>
                  <linearGradient id="shimmer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="rgba(255, 255, 255, 0.4)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                
                {/* Base smile path */}
                <path
                  d="M20 30 Q64 60 108 30"
                  stroke="rgb(107 114 128 / 0.6)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                />
                
                {/* Animated shimmer overlay */}
                <path
                  d="M20 30 Q64 60 108 30"
                  stroke="url(#shimmer-gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  className="animate-pulse"
                  style={{
                    strokeDasharray: '0 100',
                    animation: 'shimmer-stroke 2s infinite'
                  }}
                />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Floating shimmer dots for modern loading effect */}
        <div className="absolute bottom-10 flex space-x-2">
          <div className="w-2 h-2 bg-gray-400/50 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400/50 rounded-full animate-bounce delay-200"></div>
          <div className="w-2 h-2 bg-gray-400/50 rounded-full animate-bounce delay-500"></div>
        </div>
        
        {/* Custom keyframe animations that work with Tailwind */}
        <style>{`
          @keyframes shimmer-stroke {
            0% {
              stroke-dasharray: 0 100;
              stroke-dashoffset: 0;
            }
            50% {
              stroke-dasharray: 50 50;
              stroke-dashoffset: -25;
            }
            100% {
              stroke-dasharray: 0 100;
              stroke-dashoffset: -100;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TawilaShimmer;