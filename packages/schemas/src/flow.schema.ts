import { z } from 'zod';

export const FlowNodeConfigSchema = z
  .object({
    label: z.string(),
    // Trigger configuration
    triggerType: z.enum(['any_message', 'keyword']).optional(),
    keywords: z.array(z.string()).optional(),

    // Condition configuration
    conditionType: z.enum(['sentiment', 'keyword_match']).optional(),
    operator: z.enum(['equals', 'contains', 'in']).optional(),
    value: z.string().optional(),

    // Send Message configuration
    messageText: z.string().optional(),
    templateId: z.string().optional(),

    // AI Respond configuration
    systemPrompt: z.string().optional(),
    useKnowledgeBase: z.boolean().optional(),

    // Action configuration
    actionType: z.enum(['add_tag', 'remove_tag']).optional(),
    tagName: z.string().optional(),

    // Human Handoff configuration
    reason: z.string().optional(),
  })
  .passthrough();

export type FlowNodeConfigContract = z.infer<typeof FlowNodeConfigSchema>;

export const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['trigger', 'condition', 'send_message', 'ai_respond', 'action', 'human_handoff']),
  data: FlowNodeConfigSchema,
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
  workspaceId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
  active: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type FlowLayoutPayload = z.infer<typeof FlowLayoutSchema>;

