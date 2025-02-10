import { useNavigate } from 'react-router';
import useLogoutMutation from '@/hooks/mutations/useLogoutMutation';
import useAsyncEffect from '@/hooks/useAsyncEffect';
import LoadingScreen from '@/components/LoadingScreen';
import { useDisconnectWallet } from '@mysten/dapp-kit';

const Logout = () => {
  const { mutate: disconnect } = useDisconnectWallet();
  const { mutateAsync: logout } = useLogoutMutation();
  const navigate = useNavigate();

  useAsyncEffect(async () => {
    await disconnect();
    await logout(undefined);

    navigate('/');
  }, [disconnect, logout]);

  return <LoadingScreen />;
};

export default Logout;
