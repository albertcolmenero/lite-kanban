import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
});

export const updateProjectSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.union([z.string().trim().max(2000), z.literal("")]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
