import { z } from "zod";
import { workOrderPriority, workOrderStatus } from "@/db/schema";

export const createWorkOrderSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  priority: z.enum(workOrderPriority.enumValues),
});
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const changeStatusSchema = z.object({
  toStatus: z.enum(workOrderStatus.enumValues),
  expectedFrom: z.enum(workOrderStatus.enumValues),
  note: z.string().trim().max(500, "Note is too long").optional().default(""),
});
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
