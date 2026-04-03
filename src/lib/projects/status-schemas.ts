import { z } from "zod";

export const createProjectStatusSchema = z.object({
  projectId: z.string(),
  name: z.string().trim().min(1).max(80),
});

export const updateProjectStatusSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(80),
  isFinal: z.boolean(),
});

export const deleteProjectStatusSchema = z.object({
  id: z.string(),
});

export const moveProjectStatusSchema = z.object({
  id: z.string(),
  direction: z.enum(["up", "down"]),
});
