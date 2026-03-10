import { KindleRepositoryImpl } from "@/containers/kindle/infrastructure/repositories/kindle.repository.impl";
import { SendToKindleUseCase } from "../application/use-cases/send-to-kindle.use-case";

const kindleRepository = new KindleRepositoryImpl();
export const sendToKindleUseCase = new SendToKindleUseCase(kindleRepository);
