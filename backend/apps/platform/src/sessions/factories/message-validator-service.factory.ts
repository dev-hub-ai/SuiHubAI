import { AuthProvider } from '@apps/platform/sessions/enums';
import { MessageValidatorService } from '@apps/platform/sessions/services/message-validators';

export type MessageValidatorServiceFactory = (authProvider: AuthProvider) => MessageValidatorService;
