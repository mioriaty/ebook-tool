import { z } from "zod";

const envSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  NEXT_PUBLIC_SENDER_EMAIL: z
    .string()
    .email("NEXT_PUBLIC_SENDER_EMAIL must be a valid email"),
});

const envFiles = envSchema.safeParse(process.env);

if (!envFiles.success) {
  console.error("❌ Invalid environment variables:", envFiles.error.format());
  throw new Error("Invalid environment variables");
}

export const config = {
  resendApiKey: envFiles.data.RESEND_API_KEY,
  senderEmail: envFiles.data.NEXT_PUBLIC_SENDER_EMAIL,
} as const;

export type Config = typeof config;
