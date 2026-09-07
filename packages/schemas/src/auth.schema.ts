import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  fullName: z.string().optional(),
  password: z.string().min(6).optional(),
  passwordLegacy: z.string().optional(),
  workspaceName: z.string().min(1),
  referralSource: z.string().optional(),
});

export type RegisterPayload = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).optional(),
  passwordLegacy: z.string().optional(),
});

export type LoginPayload = z.infer<typeof LoginSchema>;

export interface UserResponse {
  id: string;
  email: string;
  role: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  referralSource?: string | null;
}

export interface AuthResponseData {
  token: string;
  user: UserResponse;
  workspace: WorkspaceResponse;
}
