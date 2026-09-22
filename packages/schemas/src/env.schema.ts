import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DB_URI: z.string(),
  NEST_PORT: z.string().default("5000"),
  
  // Auth Config
  JWT_SECRET: z.string().default("notifyiq-super-secret-default-key-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().default("notifyiq-super-refresh-default-key-change-in-production"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  
  // Redis for BullMQ & Caching
  REDIS_URL: z.string().default("redis://localhost:6379"),
  
  // Meta WABA credentials
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  
  // Encryption keys for secure tokens
  ENCRYPTION_KEY: z.string().length(32, "ENCRYPTION_KEY must be exactly 32 characters long").default("12345678901234567890123456789012"),

  // AI Services
  GEMINI_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // Billing
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  STRIPE_API_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Object Storage
  UTHO_ACCESS_KEY: z.string().optional(),
  UTHO_SECRET_KEY: z.string().optional(),
  UTHO_ENDPOINT: z.string().optional(),
  UTHO_BUCKET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
