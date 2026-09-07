import { z } from 'zod';

export const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['trigger', 'condition', 'send_message', 'ai_respond', 'action', 'human_handoff']),
  data: z.object({
    label: z.string(),
  }),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export type FlowNodeContract = z.infer<typeof FlowNodeSchema>;

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

export type FlowEdgeContract = z.infer<typeof FlowEdgeSchema>;

export const FlowLayoutSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
  active: z.boolean().default(true),
});

export type FlowLayoutPayload = z.infer<typeof FlowLayoutSchema>;
