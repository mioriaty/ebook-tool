export interface IKindleRepository {
  sendToKindle(sessionId: string, kindleEmail: string): Promise<void>;
}
