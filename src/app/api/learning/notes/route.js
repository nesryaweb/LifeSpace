import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const learningPathId = searchParams.get("learningPathId");

    const where = {
      userId: session.user.id,
    };

    if (learningPathId) {
      where.learningPathId = learningPathId;
    }

    const notes = await prisma.learningNote.findMany({
      where,
      include: {
        lesson: {
          select: { id: true, title: true },
        },
        learningPath: {
          select: { id: true, title: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET learning notes:", error);
    return NextResponse.json({ error: "Failed to load notes." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.learningPathId) {
      return NextResponse.json({ error: "Learning path is required." }, { status: 400 });
    }

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Note content is required." }, { status: 400 });
    }

    const path = await prisma.learningPath.findFirst({
      where: {
        id: body.learningPathId,
        userId: session.user.id,
      },
    });

    if (!path) {
      return NextResponse.json({ error: "Learning path not found." }, { status: 404 });
    }

    if (body.lessonId) {
      const lesson = await prisma.learningLesson.findFirst({
        where: {
          id: body.lessonId,
          learningPathId: body.learningPathId,
        },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found in this learning path." }, { status: 404 });
      }
    }

    const note = await prisma.learningNote.create({
      data: {
        userId: session.user.id,
        learningPathId: body.learningPathId,
        lessonId: body.lessonId || null,
        title: body.title?.trim() || null,
        content: body.content.trim(),
      },
      include: {
        lesson: {
          select: { id: true, title: true },
        },
        learningPath: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST learning note:", error);
    return NextResponse.json({ error: "Failed to create note." }, { status: 500 });
  }
}