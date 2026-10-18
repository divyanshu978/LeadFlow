import { prisma } from "@/lib/prisma";
import {
  jsonError,
  leadCreateSchema,
  leadStatuses,
  parseJsonError,
} from "@/lib/lead-validation";

const leadInclude = {
  discussions: {
    orderBy: { createdAt: "desc" },
    take: 1,
  },
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    if (status && !leadStatuses.includes(status)) {
      return jsonError("Invalid lead status");
    }

    const leads = await prisma.lead.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { company: { contains: search } },
              ],
            }
          : {}),
      },
      include: leadInclude,
      orderBy: [{ followUpAt: "asc" }, { updatedAt: "desc" }],
    });

    return Response.json({ data: leads });
  } catch (error) {
    return parseJsonError(error);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const input = leadCreateSchema.parse(body);
    const lead = await prisma.lead.create({
      data: input,
      include: leadInclude,
    });

    return Response.json({ data: lead }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("Request body must be valid JSON");
    }
    return parseJsonError(error);
  }
}
