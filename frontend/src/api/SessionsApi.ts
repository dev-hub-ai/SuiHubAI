import { ApiClient } from './ApiClient';
import { User } from './UsersApi';

export interface CreateSessionParams {
  message: string;
  signature: string;
  nonce: string;
}

export interface SessionsApi {
  createSessionNonce(address: string): Promise<string>;
  createSession(params: CreateSessionParams): Promise<void>;
  getSessionUser(): Promise<User | null>;
  deleteSession(): Promise<void>;
}

export default class SessionsRestApi implements SessionsApi {
  public constructor(private client: ApiClient) {}

  public async createSessionNonce(address: string) {
    const { nonce } = await this.client.makeCall<{ nonce: string }>(`/sessions/nonce`, 'POST', {
      address,
    });

    return nonce;
  }

  public async createSession(params: CreateSessionParams) {
    await this.client.makeCall(`/sessions`, 'POST', {
      ...params,
      provider: 'sui',
    });
  }

  public async deleteSession() {
    await this.client.makeCall('/sessions', 'DELETE', {});
  }

  public async getSessionUser() {
    const session = await this.client.makeCall<{
      sessionUser: User | null;
    }>(`/sessions`, 'GET');

    return session.sessionUser;
  }
}
