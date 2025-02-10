import { ReactNode } from 'react';

import { ConnectButton } from '@mysten/dapp-kit';

export interface WalletConnectionAttributes {
  isConnected: boolean;
  isOpen: boolean;
  address: string | undefined;
  setIsOpen: (isOpen: boolean) => void;
}
export interface WalletConnectionProps {
  children?: (attributes: WalletConnectionAttributes) => ReactNode;
}

const WalletConnection = () => {
  return (
    <div className="relative">
      <ConnectButton className="w-full"/>
    </div>
  );
};

export default WalletConnection;
