import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const PATH_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED"];

function formatPath(path) {
  const lessons = path.lessons || [];
  const completed = lessons.filter(
    (lesson) => lesson.status === "COMPLETED"
  ).length;

  return {
    ...path,
    progress:
      lessons.length > 0
        ? Math.round((completed / lessons.length) * 100)
        : 0,
    completedLessons: completed,
    totalLessons: lessons.length,
  };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const paths = await prisma.learningPath.findMany({
      where: { userId: session.user.id },
      include: {
        goal: {
          select: { id: true, title: true, status: true },
        },
        lessons: {
          select: { id: true, status: true },
        },
        _count: {
          select: { resources: true, notes: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(paths.map(formatPath));
  } catch (error) {
    console.error("GET learning paths:", error);

    return NextResponse.json(
      { error: "Failed to load learning paths." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json(
        { error: "A learning path title is required." },
        { status: 400 }
      );
    }

    const status = body.status || "ACTIVE";

    if (!PATH_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid learning path status." },
        { status: 400 }
      );
    }

    if (body.goalId) {
      const goal = await prisma.goal.findFirst({
        where: {
          id: body.goalId,
          userId: session.user.id,
        },
      });

      if (!goal) {
        return NextResponse.json(
          { error: "The selected goal was not found." },
          { status: 404 }
        );
      }
    }

    const learningPath = await prisma.learningPath.create({
      data: {
        userId: session.user.id,
        title,
        description: body.description?.trim() || null,
        status,
        goalId: body.goalId || null,
        startDate: body.startDate
          ? new Date(body.startDate)
          : null,
        targetDate: body.targetDate
          ? new Date(body.targetDate)
          : null,
      },
      include: {
        goal: {
          select: { id: true, title: true, status: true },
        },
        lessons: true,
        _count: {
          select: { resources: true, notes: true },
        },
      },
    });

    return NextResponse.json(formatPath(learningPath), {
      status: 201,
    });
  } catch (error) {
    console.error("POST learning path:", error);

    return NextResponse.json(
      { error: "Failed to create learning path." },
      { status: 500 }
    );
  }
}