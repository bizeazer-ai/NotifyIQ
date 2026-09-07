import { z } from 'zod';

export const WabaProfileSchema = z.object({
  about: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  vertical: z.string().optional(),
  websites: z.array(z.string()).optional(),
  profilePictureUrl: z.string().optional(),
});

export type WabaProfileContract = z.infer<typeof WabaProfileSchema>;

export const CreateTemplateSchema = z.object({
  name: z.string(),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  language: z.string().default('en'),
  headerType: z.enum(['NONE', 'TEXT', 'IMAGE', 'DOCUMENT']).optional(),
  headerText: z.string().optional(),
  bodyText: z.string(),
  footerText: z.string().optional(),
});

export type CreateTemplateContract = z.infer<typeof CreateTemplateSchema>;
