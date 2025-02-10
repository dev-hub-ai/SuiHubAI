import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Outlet, useNavigate, useOutletContext, useParams } from 'react-router';
import { Agent } from '@/api/AgentsApi';
import { AgentFormData } from '@/components/AgentForm';
import useListAgentsByTeamIdQuery from '@/hooks/queries/useListAgentsByTeamIdQuery';
import useCreateAgentMutation from '@/hooks/mutations/useCreateAgentMutation';
import AgentsList from '@/components/AgentsList';
import Popup from '@/components/Popup';
import CreateAgentForm from '@/components/CreateAgentForm';

const Agents = () => {
  const teamId = useOutletContext<string>();

  const { agentId: selectedAgentId } = useParams<{ agentId: string }>();

  const navigate = useNavigate();

  const { data: agents } = useListAgentsByTeamIdQuery(teamId);
  const { mutateAsync: createAgent } = useCreateAgentMutation();

  const [displayCreateAgentPopup, setDisplayCreateAgentPopup] = useState(false);

  const showCreateAgentPopup = () => setDisplayCreateAgentPopup(true);
  const hideCreateAgentPopup = () => setDisplayCreateAgentPopup(false);

  const handleCreateAgentSubmit = async (data: AgentFormData) => {
    await createAgent({
      name: data.name,
      description: data.description,
      modelApiKey: data.modelApiKey,
      model: data.model,
      role: data.role,
      twitterCookie: data.twitterCookie,
      twitterUsername: data.twitterUsername,
      twitterPassword: data.twitterPassword,
      twitterEmail: data.twitterEmail,
      teamId,
    });

    hideCreateAgentPopup();
  };

  const handleAgentClick = (agent: Agent) => {
    navigate(`/agent-teams/${teamId}/agents/${agent.id}`);
  };

  return (
    <div className="flex flex-col w-full h-full text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Agents:</h1>
        <button
          disabled={!agents}
          onClick={showCreateAgentPopup}
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Agent
        </button>
      </div>
      <AgentsList selectedAgentId={selectedAgentId || null} agents={agents ?? null} onAgentClick={handleAgentClick} />
      {agents && !agents.length ? (
        <div className="text-center text-gray-400 m-auto">
          No agents found. Click the "New Agent" button to create one.
        </div>
      ) : null}
      <Outlet key={selectedAgentId} />
      <Popup title="Create New Agent" isOpen={displayCreateAgentPopup} onClose={hideCreateAgentPopup}>
        <CreateAgentForm onSubmit={handleCreateAgentSubmit} />
      </Popup>
    </div>
  );
};

export default Agents;
