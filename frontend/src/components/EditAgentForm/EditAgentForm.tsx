import AgentForm, { AgentFormData } from '@/components/AgentForm';
import { Agent } from '@/api/AgentsApi';

export interface EditAgentFormProps {
  agent: Agent;
  onSubmit: (data: AgentFormData) => void;
  onCancel: () => void;
}

const EditAgentForm = ({ agent, onCancel, onSubmit }: EditAgentFormProps) => {
  return (
    <AgentForm
      className="mt-6"
      innerContainerClassName="p-6"
      header={
        <div className="border-b border-gray-700 p-6">
          <h2 className="text-xl font-semibold">Edit Agent Details</h2>
        </div>
      }
      initialData={{
        name: agent.name,
        role: agent.role,
        description: agent.description || '',
        model: agent.model,
        modelApiKey: agent.modelApiKey,
        twitterUsername: (agent.config.twitterUsername as string) || '',
        twitterCookie: (agent.config.twitterCookie as string) || '',
        twitterEmail: (agent.config.twitterEmail as string) || '',
        twitterPassword: (agent.config.twitterPassword as string) || '',
      }}
      hideRoleInput
      onSubmit={onSubmit}
    >
      {() => (
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Save Changes
          </button>
        </div>
      )}
    </AgentForm>
  );
};

export default EditAgentForm;
