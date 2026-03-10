import { useMutation } from "@tanstack/react-query";
import { sendToKindleUseCase } from "@/core/kindle/factories/kindle.factory";

interface SendToKindleParams {
  sessionId: string;
  kindleEmail: string;
}

export function useSendToKindle() {
  return useMutation({
    mutationFn: ({ sessionId, kindleEmail }: SendToKindleParams) =>
      sendToKindleUseCase.execute(sessionId, kindleEmail),
  });
}
