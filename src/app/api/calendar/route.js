import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (
      (from && Number.isNaN(fromDate.getTime())) ||
      (to && Number.isNaN(toDate.getTime()))
    ) {
      return NextResponse.json(
        { error: "Invalid date range." },
        { status: 400 }
      );
    }

    const dateFilter =
      fromDate || toDate
        ? {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lte: toDate }),
          }
        : undefined;

    const [tasks, projects, milestones] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          dueDate: {
            not: null,
            ...(dateFilter || {}),
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          priority: true,
          parentId: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          milestone: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),

      prisma.project.findMany({
        where: {
          userId,
          dueDate: {
            not: null,
            ...(dateFilter || {}),
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          priority: true,
        },
      }),

      prisma.milestone.findMany({
        where: {
          project: { userId },
          dueDate: {
            not: null,
            ...(dateFilter || {}),
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    const events = [
      ...tasks.map((task) => ({
        id: `task-${task.id}`,
        itemId: task.id,
        type: "TASK",
        title: task.title,
        date: task.dueDate,
        status: task.status,
        priority: task.priority,
        parentId: task.parentId,
        project: task.project,
        milestone: task.milestone,
      })),

      ...projects.map((project) => ({
        id: `project-${project.id}`,
        itemId: project.id,
        type: "PROJECT",
        title: project.title,
        date: project.dueDate,
        status: project.status,
        priority: project.priority,
      })),

      ...milestones.map((milestone) => ({
        id: `milestone-${milestone.id}`,
        itemId: milestone.id,
        type: "MILESTONE",
        title: milestone.title,
        date: milestone.dueDate,
        project: milestone.project,
      })),
    ].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar GET error:", error);

    return NextResponse.json(
      { error: "Could not load calendar events." },
      { status: 500 }
    );
  }
}