
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const LESSON_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
];

async function getOwnedLesson(pathId, lessonId, userId) {
  return prisma.learningLesson.findFirst({
    where: {
      id: lessonId,
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

    const { id, lessonId } = await params;
    const body = await request.json();

    const existing = await getOwnedLesson(
      id,
      lessonId,
      session.user.id
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Lesson not found." },
        { status: 404 }
      );
    }

    if (
      body.title !== undefined &&
      !body.title.trim()
    ) {
      return NextResponse.json(
        { error: "Lesson title cannot be empty." },
        { status: 400 }
      );
    }

    if (
      body.status !== undefined &&
      !LESSON_STATUSES.includes(body.status)
    ) {
      return NextResponse.json(
        { error: "Invalid lesson status." },
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

    if (body.status !== undefined) {
      data.status = body.status;

      data.completedAt =
        body.status === "COMPLETED"
          ? existing.status === "COMPLETED"
            ? existing.completedAt
            : new Date()
          : null;
    }

    if (body.position !== undefined) {
      if (!Number.isInteger(body.position) || body.position < 0) {
        return NextResponse.json(
          { error: "Invalid lesson position." },
          { status: 400 }
        );
      }

      data.position = body.position;
    }

    const lesson = await prisma.learningLesson.update({
      where: { id: lessonId },
      data,
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("PATCH learning lesson:", error);

    return NextResponse.json(
      { error: "Failed to update lesson." },
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

    const { id, lessonId } = await params;

    const existing = await getOwnedLesson(
      id,
      lessonId,
      session.user.id
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Lesson not found." },
        { status: 404 }
      );
    }

    await prisma.learningLesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE learning lesson:", error);

    return NextResponse.json(
      { error: "Failed to delete lesson." },
      { status: 500 }
    );
  }
}
