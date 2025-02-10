import { useParams } from 'react-router';
import { useState } from 'react';
import { AgentFormData } from '@/components/AgentForm';
import useUpdateAgentMutation from '@/hooks/mutations/useUpdateAgentMutation';
import useAgentByIdQuery from '@/hooks/queries/useAgentByIdQuery';
import AgentDetailsOverview from '@/components/AgentDetailsOverview';
import EditAgentForm from '@/components/EditAgentForm';

const AgentDetails = () => {
  const [isEditMode, setIsEditMode] = useState(false);

  const { agentId } = useParams<{ agentId: string }>();

  const { data: agent } = useAgentByIdQuery(agentId || '');

  const { mutateAsync: updateAgent } = useUpdateAgentMutation();

  const handleUpdateAgent = async (data: AgentFormData) => {
    if (!agentId) {
      return;
    }

    await updateAgent({
      id: agentId,
      name: data.name,
      description: data.description,
      modelApiKey: data.modelApiKey,
      model: data.model,
      twitterCookie: data.twitterCookie,
      twitterUsername: data.twitterUsername,
      twitterPassword: data.twitterPassword,
      twitterEmail: data.twitterEmail,
    });

    setIsEditMode(false);
  };

  return (
    <div className="h-full w-2/3">
      {isEditMode && agent ? (
        <EditAgentForm agent={agent} onCancel={() => setIsEditMode(false)} onSubmit={handleUpdateAgent} />
      ) : (
        <AgentDetailsOverview agent={agent ?? null} onEditButtonClick={() => setIsEditMode(true)} />
      )}
    </div>
  );
};

export default AgentDetails;
