import { IKindleRepository } from "../../domain/repositories/kindle.repository";

export class SendToKindleUseCase {
  constructor(private readonly kindleRepository: IKindleRepository) {}

  async execute(sessionId: string, kindleEmail: string): Promise<void> {
    if (!kindleEmail) {
      throw new Error("Vui lòng cung cấp email Kindle.");
    }

    if (
      !kindleEmail.toLowerCase().includes("@kindle.com") &&
      !kindleEmail.toLowerCase().includes("@free.kindle.com")
    ) {
      throw new Error("Email Kindle không hợp lệ. Phải có đuôi @kindle.com");
    }

    if (!sessionId) {
      throw new Error("Không tìm thấy thông tin sách để gửi.");
    }

    return this.kindleRepository.sendToKindle(sessionId, kindleEmail);
  }
}
