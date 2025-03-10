import AgentForm, { AgentFormData } from '@/components/AgentForm';

export interface CreateAgentFormProps {
  onSubmit: (data: AgentFormData) => void;
}

const CreateAgentForm = ({ onSubmit }: CreateAgentFormProps) => {
  return (
    <AgentForm onSubmit={onSubmit}>
      {() => (
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Create Agent
        </button>
      )}
    </AgentForm>
  );
};

export default CreateAgentForm;
