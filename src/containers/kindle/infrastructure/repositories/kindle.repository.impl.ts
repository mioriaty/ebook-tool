import { IKindleRepository } from "@/core/kindle/domain/repositories/kindle.repository";
import { fetchClient } from "@/libs/api/fetch-client";

interface SendToKindleResponse {
  success?: boolean;
  error?: string | { message?: string };
  data?: unknown;
}

export class KindleRepositoryImpl implements IKindleRepository {
  async sendToKindle(sessionId: string, kindleEmail: string): Promise<void> {
    // Call the internal Next.js API route
    const response = await fetchClient.post<SendToKindleResponse>(
      "/api/kindle/send",
      {
        sessionId,
        kindleEmail,
      },
    );

    if (response.error) {
      const errorMessage =
        typeof response.error === "string"
          ? response.error
          : response.error.message || "Unknown error";

      throw new Error(`Failed to send email to Kindle: ${errorMessage}`);
    }
  }
}
