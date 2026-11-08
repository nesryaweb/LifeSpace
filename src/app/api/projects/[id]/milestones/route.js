
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;

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

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
      include: {
  tasks: {
    orderBy: { position: "asc" },
    include: {
      subtasks: {
        orderBy: { position: "asc" },
      },
    },
  },
},
    });

    const formattedMilestones = milestones.map((milestone) => {
      const allTasks = milestone.tasks.flatMap((task) => [
        task,
        ...task.subtasks,
      ]);

      const completedTaskCount = allTasks.filter(
        (task) => task.status === "DONE"
      ).length;

      return {
        ...milestone,
        taskCount: allTasks.length,
        completedTaskCount,
        progress:
          allTasks.length > 0
            ? Math.round(
                (completedTaskCount / allTasks.length) * 100
              )
            : 0,
      };
    });

    return NextResponse.json({
      milestones: formattedMilestones,
    });
  } catch (error) {
    console.error("GET project milestones error:", error);

    return NextResponse.json(
      { error: "Failed to load milestones." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;

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

    const body = await request.json();

    const title = String(body.title || "").trim();
    const description = body.description
      ? String(body.description).trim()
      : null;

    if (!title) {
      return NextResponse.json(
        { error: "Milestone title is required." },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: "Milestone title cannot exceed 200 characters." },
        { status: 400 }
      );
    }

    if (description && description.length > 5000) {
      return NextResponse.json(
        { error: "Description cannot exceed 5000 characters." },
        { status: 400 }
      );
    }

    let dueDate = null;

    if (body.dueDate) {
      dueDate = new Date(body.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid due date." },
          { status: 400 }
        );
      }
    }

    const lastMilestone = await prisma.milestone.findFirst({
      where: { projectId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title,
        description,
        dueDate,
        position: (lastMilestone?.position ?? -1) + 1,
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        milestone: {
          ...milestone,
          taskCount: 0,
          completedTaskCount: 0,
          progress: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST project milestone error:", error);

    return NextResponse.json(
      { error: "Failed to create milestone." },
      { status: 500 }
    );
  }
}
