import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().nullable(),
  url: z.string().url(),
});

export type CreateProductSchema = z.infer<typeof CreateProductSchema>;
