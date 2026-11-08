import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const LESSON_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
];

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const path = await prisma.learningPath.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!path) {
      return NextResponse.json({ error: "Learning path not found." }, { status: 404 });
    }

    const lessons = await prisma.learningLesson.findMany({
      where: { learningPathId: id },
      include: {
        _count: { select: { notes: true } },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("GET learning lessons:", error);
    return NextResponse.json({ error: "Failed to load lessons." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const path = await prisma.learningPath.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!path) {
      return NextResponse.json({ error: "Learning path not found." }, { status: 404 });
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Lesson title is required." }, { status: 400 });
    }

    const status = body.status || "NOT_STARTED";

    if (!LESSON_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid lesson status." }, { status: 400 });
    }

    const lesson = await prisma.learningLesson.create({
      data: {
        learningPathId: id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
        position: Number.isInteger(body.position) ? body.position : 0,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("POST learning lesson:", error);
    return NextResponse.json({ error: "Failed to create lesson." }, { status: 500 });
  }
}