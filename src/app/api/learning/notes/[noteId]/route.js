import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await params;
    const body = await request.json();

    const note = await prisma.learningNote.findFirst({
      where: {
        id: noteId,
        userId: session.user.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    if (body.content !== undefined && !body.content.trim()) {
      return NextResponse.json({ error: "Note content cannot be empty." }, { status: 400 });
    }

    if (body.lessonId) {
      const lesson = await prisma.learningLesson.findFirst({
        where: {
          id: body.lessonId,
          learningPathId: note.learningPathId,
        },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found in this learning path." }, { status: 404 });
      }
    }

    const data = {};

    if (body.title !== undefined) {
      data.title = body.title?.trim() || null;
    }

    if (body.content !== undefined) {
      data.content = body.content.trim();
    }

    if (body.lessonId !== undefined) {
      data.lessonId = body.lessonId || null;
    }

    const updated = await prisma.learningNote.update({
      where: { id: noteId },
      data,
      include: {
        lesson: {
          select: { id: true, title: true },
        },
        learningPath: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH learning note:", error);
    return NextResponse.json({ error: "Failed to update note." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await params;

    const note = await prisma.learningNote.findFirst({
      where: {
        id: noteId,
        userId: session.user.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    await prisma.learningNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE learning note:", error);
    return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
  }
}