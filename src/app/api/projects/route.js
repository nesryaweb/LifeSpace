
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const projectStatuses = [
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
];

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function formatProject(project) {
  const tasks = project.tasks || [];
  const completedTaskCount = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  return {
    ...project,
    taskCount: tasks.length,
    completedTaskCount,
    progress:
      tasks.length > 0
        ? Math.round((completedTaskCount / tasks.length) * 100)
        : 0,
    goals: (project.goalLinks || []).map((link) => link.goal),
  };
}

function parseDate(value, fieldName) {
  if (!value) return { value: null };

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { error: `Invalid ${fieldName}.` };
  }

  return { value: date };
}

async function getOwnedGoals(goalIds, userId) {
  const uniqueIds = [...new Set(goalIds)];

  if (uniqueIds.length === 0) return [];

  const goals = await prisma.goal.findMany({
    where: {
      id: { in: uniqueIds },
      userId,
    },
    select: { id: true },
  });

  if (goals.length !== uniqueIds.length) {
    return null;
  }

  return uniqueIds;
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

    const userId = session.user.id;

    const [projects, goals] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
          goalLinks: {
            include: {
              goal: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  targetDate: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              milestones: true,
            },
          },
        },
      }),
      prisma.goal.findMany({
        where: {
          userId,
          status: { not: "PAUSED" },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          targetDate: true,
        },
      }),
    ]);

    return NextResponse.json({
      projects: projects.map(formatProject),
      goals,
    });
  } catch (error) {
    console.error("GET projects error:", error);

    return NextResponse.json(
      { error: "Failed to load projects." },
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

    const title = String(body.title || "").trim();
    const description = body.description
      ? String(body.description).trim()
      : null;

    if (!title || title.length > 200) {
      return NextResponse.json(
        { error: "A title is required (maximum 200 characters)." },
        { status: 400 }
      );
    }

    if (description && description.length > 5000) {
      return NextResponse.json(
        { error: "Description cannot exceed 5000 characters." },
        { status: 400 }
      );
    }

    const status = body.status || "PLANNED";
    const priority = body.priority || "MEDIUM";

    if (!projectStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid project status." },
        { status: 400 }
      );
    }

    if (!priorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid project priority." },
        { status: 400 }
      );
    }

    const startDateResult = parseDate(body.startDate, "start date");
    const dueDateResult = parseDate(body.dueDate, "due date");

    if (startDateResult.error || dueDateResult.error) {
      return NextResponse.json(
        { error: startDateResult.error || dueDateResult.error },
        { status: 400 }
      );
    }

    const goalIds = Array.isArray(body.goalIds)
      ? body.goalIds.filter((id) => typeof id === "string")
      : [];

    const validGoalIds = await getOwnedGoals(
      goalIds,
      session.user.id
    );

    if (validGoalIds === null) {
      return NextResponse.json(
        { error: "One or more selected goals could not be found." },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        title,
        description,
        status,
        priority,
        startDate: startDateResult.value,
        dueDate: dueDateResult.value,
        goalLinks: {
          create: validGoalIds.map((goalId) => ({
            goal: {
              connect: { id: goalId },
            },
          })),
        },
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        goalLinks: {
          include: {
            goal: {
              select: {
                id: true,
                title: true,
                status: true,
                targetDate: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
          },
        },
      },
    });

    return NextResponse.json(
      { project: formatProject(project) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST project error:", error);

    return NextResponse.json(
      { error: "Failed to create project." },
      { status: 500 }
    );
  }
}
