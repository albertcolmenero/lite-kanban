import { z } from "zod";

const dateOnlyString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

/** Optional HTML date value: empty or omitted means no date (create) or unchanged (use other fields). */
export const optionalDueDateInputSchema = z
  .union([dateOnlyString, z.literal("")])
  .optional();

/** Update: empty string clears due date; omitted leaves unchanged. */
export const updateDueDateInputSchema = z
  .union([dateOnlyString, z.literal("")])
  .optional();

export const createTaskSchema = z.object({
  projectId: z.string(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  statusId: z.string().optional(),
  priorityId: z.string().optional(),
  dueDate: optionalDueDateInputSchema,
  labelIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(200).optional(),
  description: z.union([z.string().trim().max(5000), z.literal("")]).optional(),
  /** Board column (`ProjectStatus`); uses move semantics when changed. */
  statusId: z.string().optional(),
  priorityId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  dueDate: updateDueDateInputSchema,
});

export const commentSchema = z.object({
  taskId: z.string(),
  body: z.string().trim().min(1).max(8000),
});

export const subtaskSchema = z.object({
  taskId: z.string(),
  title: z.string().trim().min(1).max(300),
});

export const createLabelSchema = z.object({
  projectId: z.string(),
  name: z.string().trim().min(1).max(80),
  color: z.string().min(1).max(32),
});

export const updateLabelSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(80),
  color: z.string().min(1).max(32),
});

/** JSON body for POST /api/projects/[id]/tasks (projectId comes from the URL). */
export const apiCreateTaskBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  statusId: z.string().optional(),
  priorityId: z.string().optional(),
  dueDate: optionalDueDateInputSchema,
  labelIds: z.array(z.string()).optional(),
});

/** JSON body for PATCH /api/tasks/[id] — either move (statusId + toIndex) or field updates. */
export const apiPatchTaskBodySchema = z
  .object({
    statusId: z.string().optional(),
    toIndex: z.number().int().min(0).optional(),
    name: z.string().trim().min(1).max(200).optional(),
    description: z.union([z.string().trim().max(5000), z.literal("")]).optional(),
    priorityId: z.string().optional(),
    labelIds: z.array(z.string()).optional(),
    dueDate: updateDueDateInputSchema,
  })
  .superRefine((data, ctx) => {
    const hasStatus = data.statusId !== undefined;
    const hasIndex = data.toIndex !== undefined;
    if (hasStatus !== hasIndex) {
      ctx.addIssue({
        code: "custom",
        message: "For a move, send both statusId and toIndex",
      });
    }
    const isMove = hasStatus && hasIndex;
    const isUpdate =
      data.name !== undefined ||
      data.description !== undefined ||
      data.priorityId !== undefined ||
      data.labelIds !== undefined ||
      data.dueDate !== undefined;
    if (isMove && isUpdate) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot combine move and field updates in one request",
      });
    }
    if (!isMove && !isUpdate) {
      ctx.addIssue({
        code: "custom",
        message: "No valid operation: send move fields or update fields",
      });
    }
  });
