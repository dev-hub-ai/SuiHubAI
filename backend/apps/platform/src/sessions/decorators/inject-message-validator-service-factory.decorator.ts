import { Inject } from '@nestjs/common';
import SessionsModuleTokens from '@apps/platform/sessions/sessions.module.tokens';

const InjectMessageValidatorServiceFactory = () => {
  return Inject(SessionsModuleTokens.Factories.MessageValidatorServiceFactory);
};

export default InjectMessageValidatorServiceFactory;
