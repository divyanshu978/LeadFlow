import { prisma } from "@/lib/prisma";
import {
  jsonError,
  leadUpdateSchema,
  parseJsonError,
} from "@/lib/lead-validation";

const leadInclude = {
  discussions: {
    orderBy: { createdAt: "desc" },
  },
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: leadInclude,
    });

    if (!lead) {
      return jsonError("Lead not found", 404);
    }

    return Response.json({ data: lead });
  } catch (error) {
    return parseJsonError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const input = leadUpdateSchema.parse(await request.json());
    const existingLead = await prisma.lead.findUnique({ where: { id } });

    if (!existingLead) {
      return jsonError("Lead not found", 404);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: input,
      include: leadInclude,
    });

    return Response.json({ data: lead });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("Request body must be valid JSON");
    }
    return parseJsonError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existingLead = await prisma.lead.findUnique({ where: { id } });

    if (!existingLead) {
      return jsonError("Lead not found", 404);
    }

    await prisma.lead.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return parseJsonError(error);
  }
}
