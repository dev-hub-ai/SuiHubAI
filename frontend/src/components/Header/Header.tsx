import WalletConnection from '@/components/WalletConnection';
import { APP_NAME } from '@/constants/core';

const Header = () => {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-24">
        <div className="flex items-center space-x-3">
          <img className="h-fit mb-1" src="/logo.png" alt="logo" />
          <span className="text-xl font-semibold text-white">{APP_NAME}</span>
        </div>
        <div className="flex items-center">
          <WalletConnection />
        </div>
      </div>
    </header>
  );
};

export default Header;
