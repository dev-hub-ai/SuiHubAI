import useAsyncEffect from '@/hooks/useAsyncEffect';
import useCreateSessionMutation from '@/hooks/mutations/useCreateSessionMutation';
import useCreateSessionNonceMutation from '@/hooks/mutations/useCreateSessionNonceMutation';
import useSession from '@/hooks/useSession';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';

interface Signature {
  signature: string;
  bytes: string;
}

const useSignIn = () => {
  const account = useCurrentAccount();

  const [currentUser] = useSession();

  const currentUserId = currentUser && currentUser.id;

  const { mutateAsync: createSessionNonce } = useCreateSessionNonceMutation();
  const { mutateAsync: createSession } = useCreateSessionMutation();

  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  useAsyncEffect(async () => {
    if (!account?.address || currentUserId !== null) {
      return;
    }

    try {
      const nonce = await createSessionNonce(account?.address || '');

      const message = new TextEncoder().encode('Sign in with Sui to the SuiHubAi');
      const preparedMessage = 'Sign in with Sui to the SuiHubAi';

      // TODO Handle case with non loaded providers.
      const res: Signature = (await signPersonalMessage({
        message: message,
      })) as unknown as Signature;

      await createSession({
        signature: res.signature || '',
        message: preparedMessage,
        nonce,
      });
    } catch (error) {
      console.error('Error signing in: ', error);
    }
  }, [currentUserId, account?.address]);
};

export default useSignIn;
