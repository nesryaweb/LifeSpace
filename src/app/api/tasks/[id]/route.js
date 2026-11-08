
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

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = {};

    if (Object.hasOwn(body, "title")) {
      const title = typeof body.title === "string" ? body.title.trim() : "";

      if (!title || title.length > 200) {
        return NextResponse.json(
          { error: "Enter a task title of 1–200 characters." },
          { status: 400 }
        );
      }

      data.title = title;
    }

    if (Object.hasOwn(body, "description")) {
      const description =
        typeof body.description === "string" ? body.description.trim() : "";

      if (description.length > 5000) {
        return NextResponse.json(
          { error: "Description cannot exceed 5000 characters." },
          { status: 400 }
        );
      }

      data.description = description || null;
    }

    if (Object.hasOwn(body, "status")) {
      if (!TASK_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid task status." },
          { status: 400 }
        );
      }

      data.status = body.status;
      data.completedAt =
        body.status === "DONE" ? existingTask.completedAt || new Date() : null;
    }

    if (Object.hasOwn(body, "priority")) {
      if (!PRIORITIES.includes(body.priority)) {
        return NextResponse.json(
          { error: "Invalid task priority." },
          { status: 400 }
        );
      }

      data.priority = body.priority;
    }

    if (Object.hasOwn(body, "dueDate")) {
      const dueDate = validDate(body.dueDate);

      if (dueDate === undefined) {
        return NextResponse.json(
          { error: "Invalid due date." },
          { status: 400 }
        );
      }

      data.dueDate = dueDate;
    }

    if (Object.hasOwn(body, "position")) {
      if (!Number.isFinite(body.position)) {
        return NextResponse.json(
          { error: "Invalid task position." },
          { status: 400 }
        );
      }

      data.position = body.position;
    }

    const projectId = Object.hasOwn(body, "projectId")
      ? body.projectId || null
      : existingTask.projectId;

    const milestoneId = Object.hasOwn(body, "milestoneId")
      ? body.milestoneId || null
      : existingTask.milestoneId;

    const parentId = Object.hasOwn(body, "parentId")
      ? body.parentId || null
      : existingTask.parentId;

    if (Object.hasOwn(body, "projectId") || Object.hasOwn(body, "milestoneId")) {
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

        if (projectId !== milestone.projectId) {
          return NextResponse.json(
            { error: "The milestone must belong to the selected project." },
            { status: 400 }
          );
        }
      }

      data.projectId = projectId;
      data.milestoneId = milestoneId;
    }

    if (Object.hasOwn(body, "parentId")) {
      if (parentId === id) {
        return NextResponse.json(
          { error: "A task cannot be its own parent." },
          { status: 400 }
        );
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
            parentId: true,
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

        // Prevent creating a circular parent/child relationship.
        let ancestorId = parent.parentId;

        while (ancestorId) {
          if (ancestorId === id) {
            return NextResponse.json(
              { error: "This change would create a task hierarchy loop." },
              { status: 400 }
            );
          }

          const ancestor = await prisma.task.findFirst({
            where: {
              id: ancestorId,
              userId: session.user.id,
            },
            select: { parentId: true },
          });

          ancestorId = ancestor?.parentId || null;
        }
      }

      data.parentId = parentId;
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH task error:", error);

    return NextResponse.json(
      { error: "Failed to update task." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await prisma.task.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE task error:", error);

    return NextResponse.json(
      { error: "Failed to delete task." },
      { status: 500 }
    );
  }
}
