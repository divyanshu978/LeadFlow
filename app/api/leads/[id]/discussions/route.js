import { prisma } from "@/lib/prisma";
import {
  discussionCreateSchema,
  jsonError,
  parseJsonError,
} from "@/lib/lead-validation";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      return jsonError("Lead not found", 404);
    }

    const discussions = await prisma.discussion.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: discussions });
  } catch (error) {
    return parseJsonError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const input = discussionCreateSchema.parse(await request.json());
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      return jsonError("Lead not found", 404);
    }

    const discussion = await prisma.$transaction(async (transaction) => {
      const createdDiscussion = await transaction.discussion.create({
        data: { note: input.note, leadId: id },
      });

      await transaction.lead.update({
        where: { id },
        data: {
          ...(input.followUpAt !== undefined
            ? { followUpAt: input.followUpAt }
            : {}),
          updatedAt: new Date(),
        },
      });

      return createdDiscussion;
    });

    return Response.json({ data: discussion }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("Request body must be valid JSON");
    }
    return parseJsonError(error);
  }
}
