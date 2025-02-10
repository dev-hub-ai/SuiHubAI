import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TransactionsModule } from '@libs/transactions';
import { UsersModule } from '@apps/platform/users';
import { OrganizationsModule } from '@apps/platform/organizations';
import { SessionController } from './controllers';
import { DefaultSessionService } from './services';
import { MongoSessionNonceRepository } from './repositories';
import { SessionNonce, SessionNonceSchema } from './schemas';
import { AuthProvider } from './enums';
import {
  MessageValidatorService,
  SuiMessageValidatorService,
  EthMessageValidatorService,
} from './services/message-validators';
import SessionsModuleTokens from './sessions.module.tokens';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    OrganizationsModule,
    TransactionsModule,
    MongooseModule.forFeature([{ name: SessionNonce.name, schema: SessionNonceSchema }]),
  ],
  controllers: [SessionController],
  providers: [
    {
      provide: SessionsModuleTokens.Services.SessionService,
      useClass: DefaultSessionService,
    },
    {
      provide: SessionsModuleTokens.Repositories.SessionNonceRepository,
      useClass: MongoSessionNonceRepository,
    },
    {
      provide: SessionsModuleTokens.Factories.MessageValidatorServiceFactory,
      useFactory: (
        suiMessageValidatorService: MessageValidatorService,
        ethMessageValidatorService: MessageValidatorService,
      ) => {
        return (authProvider: AuthProvider) => {
          switch (authProvider) {
            case AuthProvider.Eth: {
              return ethMessageValidatorService;
            }
            case AuthProvider.Sui: {
              return suiMessageValidatorService;
            }
          }
        };
      },
      inject: [SuiMessageValidatorService, EthMessageValidatorService],
    },
    {
      provide: SuiMessageValidatorService,
      useClass: SuiMessageValidatorService,
    },
    {
      provide: EthMessageValidatorService,
      useClass: EthMessageValidatorService,
    },
  ],
  exports: [SessionsModuleTokens.Services.SessionService],
})
export class SessionsModule {}
