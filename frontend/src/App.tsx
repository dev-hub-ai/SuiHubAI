import { useMemo } from 'react';
import { BrowserRouter } from 'react-router';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import { RestApiClient } from './api/ApiClient';
import Header from './components/Header';
import Routing from './Routing';
import AppInitializer from './AppInitializer';
import { ApiProvider } from './providers/ApiProvider';
import SessionsRestApi from './api/SessionsApi';
import AgentTeamsRestApi from './api/AgentTeamsApi';
import AgentsRestApi from './api/AgentsApi';
import AgentTeamInteractionsRestApi from './api/AgentTeamInteractionsApi';
import AgentMessagesRestApi from './api/AgentMessagesApi';

import { getFullnodeUrl } from '@mysten/sui/client';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';

import './tailwind.css';
import '@mysten/dapp-kit/dist/index.css';

const { networkConfig } = createNetworkConfig({
  devnet: {
    url: getFullnodeUrl('devnet'),
  },
  testnet: {
    url: getFullnodeUrl('testnet'),
  },
  mainnet: {
    url: getFullnodeUrl('mainnet'),
  },
});

function App() {
  const queryClient = useMemo(() => {
    return new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          toast.error(error.message);
        },
      }),
      mutationCache: new MutationCache({
        onError: (error) => toast.error(error.message),
      }),
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchIntervalInBackground: false,
        },
      },
    });
  }, []);

  const services = useMemo(() => {
    const apiClient = new RestApiClient(import.meta.env.VITE_API_URL);

    return {
      sessionsApi: new SessionsRestApi(apiClient),
      agentTeamsApi: new AgentTeamsRestApi(apiClient),
      agentTeamInteractionsApi: new AgentTeamInteractionsRestApi(apiClient),
      agentApi: new AgentsRestApi(apiClient),
      agentMessagesApi: new AgentMessagesRestApi(apiClient),
    };
  }, []);

  return (
    <BrowserRouter>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <ApiProvider value={services}>
              <AppInitializer>
                <Header />
                <Routing />
              </AppInitializer>
            </ApiProvider>
          </WalletProvider>
        </QueryClientProvider>
      </SuiClientProvider>
      <ToastContainer
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        theme="dark"
        toastStyle={{ zIndex: 1000000 }}
        position="top-right"
      />
    </BrowserRouter>
  );
}

export default App;
