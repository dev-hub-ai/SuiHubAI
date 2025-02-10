import { Loader } from 'lucide-react';
import { APP_NAME } from '@/constants/core';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block rounded-lg bg-gray-800 p-3 mb-4">
          <Loader className="animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{APP_NAME}</h2>
        <p className="text-gray-400 animate-pulse">Please wait while we initialize your workspace...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
