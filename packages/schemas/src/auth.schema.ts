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
  isEmailVerified?: boolean;
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

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailPayload = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

export type ResendVerificationPayload = z.infer<typeof ResendVerificationSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordPayload = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>;
