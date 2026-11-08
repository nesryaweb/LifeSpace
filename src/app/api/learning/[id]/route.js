
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const path = await prisma.learningPath.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        resources: {
          orderBy: {
            position: "asc",
          },
        },
        lessons: {
          orderBy: {
            position: "asc",
          },
          include: {
            notes: {
              orderBy: {
                updatedAt: "desc",
              },
              include: {
                keywords: {
                  include: {
                    learningKeyword: true,
                  },
                },
              },
            },
          },
        },
        notes: {
          orderBy: {
            updatedAt: "desc",
          },
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
            keywords: {
              include: {
                learningKeyword: true,
              },
            },
          },
        },
      },
    });

    if (!path) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    const formatNote = (note) => ({
      ...note,
      keywords: (note.keywords || [])
        .map((item) => item.learningKeyword)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name)),
    });

    const lessons = path.lessons.map((lesson) => ({
      ...lesson,
      notes: lesson.notes.map(formatNote),
    }));

    const notes = path.notes.map(formatNote);

    const completedLessons = lessons.filter(
      (lesson) => lesson.status === "COMPLETED"
    ).length;

    const totalLessons = lessons.length;

    return NextResponse.json({
      ...path,
      lessons,
      notes,
      completedLessons,
      totalLessons,
      progress: totalLessons
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0,
    });
  } catch (error) {
    console.error("GET learning path:", error);

    return NextResponse.json(
      { error: "Failed to load learning path" },
      { status: 500 }
    );
  }
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

    const { id } = await params;
    const body = await request.json();

    const existingPath = await prisma.learningPath.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPath) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    const data = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 }
        );
      }

      data.title = body.title.trim();
    }

    if (body.description !== undefined) {
      data.description = body.description?.trim() || null;
    }

    if (body.status !== undefined) {
      const allowedStatuses = [
        "ACTIVE",
        "PAUSED",
        "COMPLETED",
      ];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid learning path status" },
          { status: 400 }
        );
      }

      data.status = body.status;
    }

    if (body.goalId !== undefined) {
      if (body.goalId) {
        const goal = await prisma.goal.findFirst({
          where: {
            id: body.goalId,
            userId: session.user.id,
          },
        });

        if (!goal) {
          return NextResponse.json(
            { error: "Goal not found" },
            { status: 404 }
          );
        }
      }

      data.goalId = body.goalId || null;
    }

    if (body.startDate !== undefined) {
      data.startDate = body.startDate
        ? new Date(body.startDate)
        : null;
    }

    if (body.targetDate !== undefined) {
      data.targetDate = body.targetDate
        ? new Date(body.targetDate)
        : null;
    }

    const updatedPath = await prisma.learningPath.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedPath);
  } catch (error) {
    console.error("PATCH learning path:", error);

    return NextResponse.json(
      { error: "Failed to update learning path" },
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

    const { id } = await params;

    const existingPath = await prisma.learningPath.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingPath) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    await prisma.learningPath.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE learning path:", error);

    return NextResponse.json(
      { error: "Failed to delete learning path" },
      { status: 500 }
    );
  }
}
