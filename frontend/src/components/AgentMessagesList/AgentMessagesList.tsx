import { AgentMessage } from '@/api/AgentMessagesApi';
import { Agent } from '@/api/AgentsApi';
import AgentMessagesListItem, { AgentMessagesListItemSkeleton } from './AgentMessagesListItem';
import { getImagePlaceholderByRole } from '@/components/AgentsList/AgentListItem/AgentListItem.tsx';

export interface AgentConversationsListProps {
  agentsPool: Record<string, Agent>;
  messages: AgentMessage[] | null;
}

const SKELETON_MESSAGES_COUNT = 4;

const AgentMessagesList = ({ messages, agentsPool }: AgentConversationsListProps) => {
  return (
    <div className="space-y-6">
      {!!agentsPool &&
        messages?.map((message) => {
          const senderAgent = agentsPool[message.sourceAgentId];

          return (
            <AgentMessagesListItem
              key={message.id}
              messageId={message.id}
              senderName={senderAgent?.name ?? 'Unknown'}
              senderAvatarUrl={
                senderAgent?.imageUrl || (senderAgent?.role && getImagePlaceholderByRole(senderAgent.role)) || ''
              }
              messageContent={message.content}
              messageDate={message.createdAt}
            />
          );
        })}
      {(!messages || !agentsPool) &&
        Array.from({ length: SKELETON_MESSAGES_COUNT }).map((_, index) => (
          <AgentMessagesListItemSkeleton key={index} />
        ))}
    </div>
  );
};

export default AgentMessagesList;
