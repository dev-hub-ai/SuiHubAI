import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { MessageValidatorService } from './message-validator.service';

export class SuiMessageValidatorService implements MessageValidatorService {
  public async verify(message: string, signature: string) {
    const publicKey = await verifyPersonalMessageSignature(new TextEncoder().encode(message), signature);

    return {
      success: !!publicKey,
      address: publicKey.toSuiAddress(),
    };
  }
}
