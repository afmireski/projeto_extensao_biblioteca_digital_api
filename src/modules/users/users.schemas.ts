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

// HTTP schema — snake_case input at the API boundary
export const updatePasswordHttpSchema = z.object({
  old_password: z.string().min(8),
  password: z.string().min(8),
  confirm_password: z.string().min(8),
});

// Internal DTO schema — camelCase as used by the service layer
export const updatePasswordSchema = updatePasswordHttpSchema.transform(
  (data) => ({
    oldPassword: data.old_password,
    password: data.password,
    confirmPassword: data.confirm_password,
  }),
);
