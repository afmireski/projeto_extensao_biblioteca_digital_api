import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(8),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});
