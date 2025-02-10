export interface MessageVerificationResult {
  success: boolean;
  address: string;
  nonce?: string;
}

export interface MessageValidatorService {
  verify(message: string, signature: string): Promise<MessageVerificationResult>;
}
