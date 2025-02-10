import { SiweMessage } from 'siwe';
import { MessageValidatorService } from './message-validator.service';

export class EthMessageValidatorService implements MessageValidatorService {
  public async verify(message: string, signature: string) {
    const siwe = new SiweMessage(message);

    const fields = await siwe.verify({ signature });

    return {
      success: fields.success,
      address: fields.data.address,
      nonce: fields.data.nonce,
    };
  }
}
