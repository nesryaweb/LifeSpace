
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const learningPathId = searchParams.get("learningPathId");
    const lessonId = searchParams.get("lessonId");

    if (lessonId && !learningPathId) {
      return NextResponse.json(
        { error: "A learning path is required when filtering by lesson." },
        { status: 400 }
      );
    }

    if (learningPathId) {
      const path = await prisma.learningPath.findFirst({
        where: {
          id: learningPathId,
          userId,
        },
        select: { id: true },
      });

      if (!path) {
        return NextResponse.json(
          { error: "Learning path not found." },
          { status: 404 }
        );
      }
    }

    if (lessonId) {
      const lesson = await prisma.learningLesson.findFirst({
        where: {
          id: lessonId,
          learningPathId,
          learningPath: { userId },
        },
        select: { id: true },
      });

      if (!lesson) {
        return NextResponse.json(
          { error: "Lesson not found in this learning path." },
          { status: 404 }
        );
      }
    }

    const noteFilter = {};

    if (learningPathId) {
      noteFilter.learningPathId = learningPathId;
    }

    if (lessonId) {
      noteFilter.lessonId = lessonId;
    }

    const keywords = await prisma.learningKeyword.findMany({
      where: {
        userId,
        ...(learningPathId || lessonId
          ? {
              notes: {
                some: {
                  learningNote: {
                    is: noteFilter,
                  },
                },
              },
            }
          : {}),
      },
      include: {
        notes: {
          where:
            learningPathId || lessonId
              ? {
                  learningNote: {
                    is: noteFilter,
                  },
                }
              : undefined,
          include: {
            learningNote: {
              select: {
                id: true,
                title: true,
                learningPathId: true,
                lessonId: true,
                learningPath: {
                  select: {
                    title: true,
                  },
                },
                lesson: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const formattedKeywords = keywords.map((keyword) => {
      const notes = keyword.notes.map((connection) => {
        const note = connection.learningNote;

        return {
          noteId: note.id,
          noteTitle: note.title || "Untitled note",
          learningPathId: note.learningPathId,
          learningPathTitle: note.learningPath.title,
          lessonId: note.lessonId,
          lessonTitle: note.lesson?.title || null,
        };
      });

      return {
        id: keyword.id,
        name: keyword.name,
        meaning: keyword.meaning,
        example: keyword.example,
        noteCount: notes.length,
        notes,
      };
    });

    return NextResponse.json({
      keywords: formattedKeywords,
    });
  } catch (error) {
    console.error("GET /api/learning/keywords error:", error);

    return NextResponse.json(
      { error: "Could not load learning keywords." },
      { status: 500 }
    );
  }
}
