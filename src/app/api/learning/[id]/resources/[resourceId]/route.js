
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const RESOURCE_TYPES = [
  "BOOK",
  "VIDEO",
  "WEBSITE",
  "COURSE",
  "ARTICLE",
  "OTHER",
];

async function getOwnedResource(pathId, resourceId, userId) {
  return prisma.learningResource.findFirst({
    where: {
      id: resourceId,
      learningPathId: pathId,
      learningPath: {
        userId,
      },
    },
  });
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, resourceId } = await params;
    const body = await request.json();

    const existing = await getOwnedResource(
      id,
      resourceId,
      session.user.id
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 }
      );
    }

    if (
      body.title !== undefined &&
      !body.title.trim()
    ) {
      return NextResponse.json(
        { error: "Resource title cannot be empty." },
        { status: 400 }
      );
    }

    if (
      body.type !== undefined &&
      !RESOURCE_TYPES.includes(body.type)
    ) {
      return NextResponse.json(
        { error: "Invalid resource type." },
        { status: 400 }
      );
    }

    if (
      body.position !== undefined &&
      (!Number.isInteger(body.position) || body.position < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid resource position." },
        { status: 400 }
      );
    }

    const data = {};

    if (body.title !== undefined) {
      data.title = body.title.trim();
    }

    if (body.description !== undefined) {
      data.description = body.description?.trim() || null;
    }

    if (body.type !== undefined) {
      data.type = body.type;
    }

    if (body.url !== undefined) {
      data.url = body.url?.trim() || null;
    }

    if (body.author !== undefined) {
      data.author = body.author?.trim() || null;
    }

    if (body.position !== undefined) {
      data.position = body.position;
    }

    const resource = await prisma.learningResource.update({
      where: { id: resourceId },
      data,
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.error("PATCH learning resource:", error);

    return NextResponse.json(
      { error: "Failed to update resource." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, resourceId } = await params;

    const existing = await getOwnedResource(
      id,
      resourceId,
      session.user.id
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Resource not found." },
        { status: 404 }
      );
    }

    await prisma.learningResource.delete({
      where: { id: resourceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE learning resource:", error);

    return NextResponse.json(
      { error: "Failed to delete resource." },
      { status: 500 }
    );
  }
}
