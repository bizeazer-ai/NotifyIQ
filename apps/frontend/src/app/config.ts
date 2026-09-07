import { z } from 'zod';

const configSchema = z.object({
  apiUrl: z.string().url().default('http://localhost:5000'),
  socketUrl: z.string().url().default('http://localhost:5000'),
});

const parsedEnv = {
  apiUrl: import.meta.env.VITE_API_URL,
  socketUrl: import.meta.env.VITE_SOCKET_URL,
};

const parsed = configSchema.safeParse(parsedEnv);

if (!parsed.success) {
  console.error('❌ Invalid frontend environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables configuration');
}

export const config = parsed.data;
