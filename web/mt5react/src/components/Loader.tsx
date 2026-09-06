import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            {/* Animated ring */}
            <div className="relative">
                {/* Outer spinning ring */}
                <div className="w-24 h-24 rounded-full border-4 border-t-transparent border-blue-500 animate-spin-slow"></div>
                
                {/* Inner spinning ring (opposite direction) */}
                <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-b-transparent border-purple-500 animate-spin-reverse"></div>
                
                {/* Center logo */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <img 
                        src="/logo.png" 
                        alt="PipTrader AI" 
                        className="w-12 h-12 object-contain animate-pulse-soft"
                    />
                </div>
            </div>

            {/* Brand name with shimmer */}
            <div className="mt-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                    PipTrader AI
                </h1>
            </div>

            {/* Loading dots */}
            <div className="mt-4 flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    );
};
