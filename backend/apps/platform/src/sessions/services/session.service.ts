import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectTransactionsManager } from '@libs/transactions/decorators';
import { TransactionsManager } from '@libs/transactions/managers';
import { InjectUserService } from '@apps/platform/users/decorators';
import { InjectOrganizationService } from '@apps/platform/organizations/decorators';
import { InjectSessionNonceRepository, InjectMessageValidatorServiceFactory } from '@apps/platform/sessions/decorators';
import { UserService } from '@apps/platform/users/services';
import { SessionData } from '@apps/platform/sessions/types';
import { OrganizationService } from '@apps/platform/organizations/services';
import { SessionNonceRepository } from '@apps/platform/sessions/repositories';
import { MessageValidatorServiceFactory } from '@apps/platform/sessions/factories';
import { AuthProvider } from '@apps/platform/sessions/enums';
import { generateNonce } from '@apps/platform/sessions/utils';

export interface CreateSessionParams {
  message: string;
  signature: string;
  provider: AuthProvider;
}

export interface SessionService {
  generateNonce(): Promise<string>;
  create(params: CreateSessionParams): Promise<SessionData>;
}

@Injectable()
export class DefaultSessionService implements SessionService {
  constructor(
    @InjectUserService() private readonly userService: UserService,
    @InjectSessionNonceRepository() private readonly sessionNonceRepository: SessionNonceRepository,
    @InjectOrganizationService() private readonly organizationService: OrganizationService,
    @InjectTransactionsManager() private readonly transactionsManager: TransactionsManager,
    @InjectMessageValidatorServiceFactory()
    private readonly messageValidatorServiceFactory: MessageValidatorServiceFactory,
  ) {}

  public async generateNonce() {
    const nonce = generateNonce();

    await this.sessionNonceRepository.createOne(nonce);

    return nonce;
  }

  public async create(params: CreateSessionParams) {
    const messageValidatorService = this.messageValidatorServiceFactory(params.provider);

    const { success, nonce, address } = await messageValidatorService.verify(params.message, params.signature);

    if (!success) {
      throw new UnauthorizedException('Failed to verify signature.');
    }

    const nonceExists = !nonce || (await this.sessionNonceRepository.existsByValue(nonce));

    if (!nonceExists) {
      throw new UnauthorizedException('Invalid nonce provided.');
    }

    if (nonce) {
      await this.sessionNonceRepository.deleteOne(nonce);
    }

    const user = await this.userService.getByAddress(address);

    if (user) {
      return { userId: user.id, organizationId: user.organizationId };
    }

    return this.transactionsManager.useTransaction(async () => {
      const organization = await this.organizationService.create({ name: `${address}` });

      const newUser = await this.userService.create({
        address,
        organizationId: organization.id,
      });

      return { userId: newUser.id, organizationId: newUser.organizationId };
    });
  }
}
