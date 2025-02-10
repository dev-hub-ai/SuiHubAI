const SessionsModuleTokens = {
  Services: {
    SessionService: Symbol('SessionService'),
  },
  Repositories: {
    SessionNonceRepository: Symbol('SessionNonceRepository'),
  },
  Factories: {
    MessageValidatorServiceFactory: Symbol('MessageValidatorServiceFactory'),
  },
};

export default SessionsModuleTokens;
