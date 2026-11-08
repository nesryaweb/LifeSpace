
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function validDate(value) {
  if (value === null || value === "") return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const taskInclude = {
  project: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  milestone: {
    select: {
      id: true,
      title: true,
    },
  },
  parent: {
    select: {
      id: true,
      title: true,
    },
  },
  subtasks: {
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      position: true,
    },
  },
};

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const milestoneId = searchParams.get("milestoneId");
    const parentId = searchParams.get("parentId");

    const where = {
      userId: session.user.id,
    };

    if (status && TASK_STATUSES.includes(status)) {
      where.status = status;
    }

    if (projectId) where.projectId = projectId;
    if (milestoneId) where.milestoneId = milestoneId;

    if (parentId === "none") {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [
        { position: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET tasks error:", error);

    return NextResponse.json(
      { error: "Failed to load tasks." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required." },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Task title cannot exceed 200 characters." },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : null;

    if (description && description.length > 5000) {
      return NextResponse.json(
        { error: "Description cannot exceed 5000 characters." },
        { status: 400 }
      );
    }

    const status = body.status || "TODO";
    const priority = body.priority || "MEDIUM";

    if (!TASK_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid task status." },
        { status: 400 }
      );
    }

    if (!PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid task priority." },
        { status: 400 }
      );
    }

    const dueDate = validDate(body.dueDate);

    if (dueDate === undefined) {
      return NextResponse.json(
        { error: "Invalid due date." },
        { status: 400 }
      );
    }

    let projectId = body.projectId || null;
    const milestoneId = body.milestoneId || null;
    const parentId = body.parentId || null;

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found." },
          { status: 404 }
        );
      }
    }

    if (milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          project: {
            is: { userId: session.user.id },
          },
        },
        select: {
          id: true,
          projectId: true,
        },
      });

      if (!milestone) {
        return NextResponse.json(
          { error: "Milestone not found." },
          { status: 404 }
        );
      }

      if (projectId && projectId !== milestone.projectId) {
        return NextResponse.json(
          { error: "The milestone does not belong to this project." },
          { status: 400 }
        );
      }

      projectId = milestone.projectId;
    }

    if (parentId) {
      const parent = await prisma.task.findFirst({
        where: {
          id: parentId,
          userId: session.user.id,
        },
        select: {
          id: true,
          projectId: true,
          milestoneId: true,
        },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent task not found." },
          { status: 404 }
        );
      }

      if (
        parent.projectId !== projectId ||
        parent.milestoneId !== milestoneId
      ) {
        return NextResponse.json(
          { error: "A subtask must belong to the same project and milestone as its parent." },
          { status: 400 }
        );
      }
    }

    const lastTask = await prisma.task.findFirst({
      where: {
        userId: session.user.id,
        projectId,
        milestoneId,
        parentId,
      },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title,
        description,
        status,
        priority,
        dueDate,
        projectId,
        milestoneId,
        parentId,
        position: lastTask ? lastTask.position + 1 : 0,
        completedAt: status === "DONE" ? new Date() : null,
      },
      include: taskInclude,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST task error:", error);

    return NextResponse.json(
      { error: "Failed to create task." },
      { status: 500 }
    );
  }
}
