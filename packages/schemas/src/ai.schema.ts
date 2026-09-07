import { z } from 'zod';

export const AutoReplySettingsSchema = z.object({
  enabled: z.boolean().default(false),
  systemPrompt: z.string(),
  confidenceThreshold: z.number().min(0.0).max(1.0).default(0.70),
  fallbackToHuman: z.boolean().default(true),
  outOfHoursOnly: z.boolean().default(false),
  operatingHours: z.object({
    enabled: z.boolean().default(false),
    timezone: z.string().default('Asia/Kolkata'),
    workDays: z.array(z.number()).default([1, 2, 3, 4, 5]),
    startTime: z.string().default('09:00'),
    endTime: z.string().default('18:00'),
  }),
  outOfHoursMessage: z.string(),
});

export type AutoReplySettingsContract = z.infer<typeof AutoReplySettingsSchema>;

export const KnowledgeDocSchema = z.object({
  id: z.string().optional(),
  docId: z.string().optional(),
  title: z.string(),
  fileType: z.enum(['pdf', 'docx', 'yaml', 'json', 'csv', 'txt']),
  chunkIndex: z.number().default(0),
  content: z.string(),
  createdAt: z.string().optional(),
});

export type KnowledgeDocContract = z.infer<typeof KnowledgeDocSchema>;
