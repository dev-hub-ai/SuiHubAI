import { memo } from 'react';
import { timeAgo } from '@/globals';

export interface AgentMessagesListItemProps {
  messageId: string;
  senderName: string;
  senderAvatarUrl: string;
  messageContent: string;
  messageDate: string | Date;
}

const AgentMessagesListItem = memo(
  ({ senderName, senderAvatarUrl, messageContent, messageDate }: AgentMessagesListItemProps) => {
    return (
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
            <img src={senderAvatarUrl} alt={senderName} className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline mb-1">
            <span className="font-semibold text-white mr-2">{senderName}</span>
            <span className="text-sm text-gray-500">{timeAgo.format(new Date(messageDate))}</span>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{messageContent}</p>
        </div>
      </div>
    );
  },
);

export default AgentMessagesListItem;
