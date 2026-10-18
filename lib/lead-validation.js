import { z } from "zod";

export const leadStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
];

const optionalText = z.string().trim().max(200).optional().nullable();

export const leadCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  company: optionalText,
  phone: optionalText,
  status: z.enum(leadStatuses).optional(),
  followUpAt: z.coerce.date().optional().nullable(),
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const discussionCreateSchema = z.object({
  note: z.string().trim().min(1, "Discussion note is required").max(5000),
  followUpAt: z.coerce.date().optional().nullable(),
});

export function jsonError(message, status = 400, details) {
  return Response.json(
    { error: message, ...(details ? { details } : {}) },
    { status },
  );
}

export function parseJsonError(error) {
  if (error instanceof z.ZodError) {
    return jsonError("Validation failed", 422, error.flatten().fieldErrors);
  }

  console.error(error);
  return jsonError("Internal server error", 500);
}

