import { FormEvent, ReactNode, useState } from 'react';
import { AgentModelProvider, AgentRole } from '@/api/AgentsApi';
import { tailwindClsx } from '@/utils';

export interface AgentFormData {
  name: string;
  role: AgentRole;
  description: string;
  model: AgentModelProvider;
  modelApiKey: string;
  twitterCookie?: string;
  twitterUsername?: string;
  twitterPassword?: string;
  twitterEmail?: string;
}

interface AgentFormProps {
  className?: string;
  innerContainerClassName?: string;
  header?: ReactNode;
  initialData?: AgentFormData;
  onSubmit: (data: AgentFormData) => void;
  children: (data: AgentFormData) => ReactNode;
  hideRoleInput?: boolean;
}

const AgentForm = ({
  className,
  innerContainerClassName,
  header,
  initialData = {} as AgentFormData,
  onSubmit,
  children,
  hideRoleInput,
}: AgentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [modelApiKey, setModelApiKey] = useState(initialData?.modelApiKey || '');
  const [twitterCookie, setTwitterCookie] = useState(initialData?.twitterCookie || '');
  const [twitterUsername, setTwitterUsername] = useState(initialData?.twitterUsername || '');
  const [twitterPassword, setTwitterPassword] = useState(initialData?.twitterPassword || '');
  const [twitterEmail, setTwitterEmail] = useState(initialData?.twitterEmail || '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = {
      name,
      role: role as AgentRole,
      description,
      model: model as AgentModelProvider,
      modelApiKey,
      twitterCookie,
      twitterUsername,
      twitterEmail,
      twitterPassword,
    };

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={tailwindClsx('rounded-lg bg-gray-800 text-gray-100 overflow-hidden', className)}
    >
      {header}
      <div className={tailwindClsx('space-y-4', innerContainerClassName)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400">
              Agent Name
            </label>
            <input
              required
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {!hideRoleInput && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-400">
                Agent Role
              </label>
              <input
                required
                type="text"
                list="roleOptions"
                id="role"
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value as AgentRole)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id="roleOptions">
                {Object.values(AgentRole).map((roleOption) => (
                  <option key={roleOption} value={roleOption} />
                ))}
              </datalist>
            </div>
          )}
          {role === AgentRole.Adviser || role === AgentRole.Influencer ? (
            <div>
              <label htmlFor="twitterName" className="block text-sm font-medium text-gray-400">
                Twitter Username
              </label>
              <input
                type="text"
                id="twitterUsername"
                name="twitterUsername"
                value={twitterUsername}
                onChange={(event) => setTwitterUsername(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : null}
          {role === AgentRole.Adviser || role === AgentRole.Influencer ? (
            <div>
              <label htmlFor="twitterEmail" className="block text-sm font-medium text-gray-400">
                Twitter Email
              </label>
              <input
                type="text"
                id="twitterEmail"
                name="twitterEmail"
                value={twitterEmail}
                onChange={(event) => setTwitterEmail(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : null}
          {role === AgentRole.Adviser || role === AgentRole.Influencer ? (
            <div>
              <label htmlFor="twitterPassword" className="block text-sm font-medium text-gray-400">
                Twitter Password
              </label>
              <input
                type="text"
                id="twitterPassword"
                name="twitterPassword"
                value={twitterPassword}
                onChange={(event) => setTwitterPassword(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : null}
          {role === AgentRole.Adviser || role === AgentRole.Influencer ? (
            <div>
              <label htmlFor="twitterCookie" className="block text-sm font-medium text-gray-400">
                Twitter Cookie
              </label>
              <input
                type="text"
                id="twitterCookie"
                name="twitterCookie"
                value={twitterCookie}
                onChange={(event) => setTwitterCookie(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : null}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-400">
              Agent Description
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-400">
              Model (AI Model)
            </label>
            <input
              required
              type="text"
              list="modelOptions"
              id="model"
              name="model"
              value={model}
              onChange={(event) => setModel(event.target.value as AgentModelProvider)}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <datalist id="modelOptions">
              {Object.values(AgentModelProvider).map((roleOption) => (
                <option key={roleOption} value={roleOption} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-400">
              Model API Key
            </label>
            <input
              required
              type="password"
              id="apiKey"
              name="apiKey"
              value={modelApiKey}
              onChange={(event) => setModelApiKey(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        {children({
          name,
          role: role as AgentRole,
          description,
          model: model as AgentModelProvider,
          modelApiKey,
          twitterCookie,
          twitterUsername,
        })}

        {isSubmitting && (
          <div className="text-sm text-gray-400 mt-2">
            Processing... Please confirm any wallet transactions if prompted.
          </div>
        )}
      </div>
    </form>
  );
};

export default AgentForm;
