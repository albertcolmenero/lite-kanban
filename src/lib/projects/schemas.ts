import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
});

const projectColorHex = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color");

export const updateProjectSchema = z.object({
  id: z.string().cuid(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.union([z.string().trim().max(2000), z.literal("")]).optional(),
  /** Empty string clears; omitted leaves unchanged */
  color: z.union([projectColorHex, z.literal("")]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
