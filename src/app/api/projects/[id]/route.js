
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
  const taskCount = tasks.length;
  const completedTaskCount = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  return {
    ...project,
    taskCount,
    completedTaskCount,
    progress:
      taskCount === 0
        ? 0
        : Math.round((completedTaskCount / taskCount) * 100),
    goals: (project.goalLinks || []).map((link) => link.goal),
  };
}

// GET: Load one project
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

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
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
        milestones: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      project: formatProject(project),
    });
  } catch (error) {
    console.error("GET project error:", error);

    return NextResponse.json(
      { error: "Failed to load project." },
      { status: 500 }
    );
  }
}

// PATCH: Update a project and its linked goals
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

    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();

      if (!title || title.length > 200) {
        return NextResponse.json(
          {
            error:
              "Title is required and must be 200 characters or fewer.",
          },
          { status: 400 }
        );
      }

      data.title = title;
    }

    if (body.description !== undefined) {
      data.description = body.description
        ? String(body.description).trim()
        : null;

      if (data.description?.length > 5000) {
        return NextResponse.json(
          { error: "Description cannot exceed 5000 characters." },
          { status: 400 }
        );
      }
    }

    if (body.status !== undefined) {
      if (!projectStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid project status." },
          { status: 400 }
        );
      }

      data.status = body.status;
    }

    if (body.priority !== undefined) {
      if (!priorities.includes(body.priority)) {
        return NextResponse.json(
          { error: "Invalid project priority." },
          { status: 400 }
        );
      }

      data.priority = body.priority;
    }

    if (body.startDate !== undefined) {
      data.startDate = body.startDate
        ? new Date(body.startDate)
        : null;

      if (
        data.startDate &&
        Number.isNaN(data.startDate.getTime())
      ) {
        return NextResponse.json(
          { error: "Invalid start date." },
          { status: 400 }
        );
      }
    }

    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate
        ? new Date(body.dueDate)
        : null;

      if (
        data.dueDate &&
        Number.isNaN(data.dueDate.getTime())
      ) {
        return NextResponse.json(
          { error: "Invalid due date." },
          { status: 400 }
        );
      }
    }

    let goalIds;

    if (body.goalIds !== undefined) {
      if (!Array.isArray(body.goalIds)) {
        return NextResponse.json(
          { error: "Goal selection must be a list." },
          { status: 400 }
        );
      }

      goalIds = [
        ...new Set(
          body.goalIds.filter(
            (goalId) => typeof goalId === "string"
          )
        ),
      ];

      const ownedGoals = await prisma.goal.findMany({
        where: {
          id: { in: goalIds },
          userId: session.user.id,
        },
        select: { id: true },
      });

      if (ownedGoals.length !== goalIds.length) {
        return NextResponse.json(
          {
            error:
              "One or more selected goals could not be found.",
          },
          { status: 400 }
        );
      }
    }

    const updatedProject = await prisma.$transaction(
      async (tx) => {
        if (goalIds !== undefined) {
          await tx.projectGoal.deleteMany({
            where: { projectId: id },
          });

          if (goalIds.length > 0) {
            await tx.projectGoal.createMany({
              data: goalIds.map((goalId) => ({
                projectId: id,
                goalId,
              })),
            });
          }
        }

        return tx.project.update({
          where: { id },
          data,
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
            milestones: {
              orderBy: { position: "asc" },
            },
          },
        });
      }
    );

    return NextResponse.json({
      project: formatProject(updatedProject),
    });
  } catch (error) {
    console.error("PATCH project error:", error);

    return NextResponse.json(
      { error: "Failed to update project." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a project
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

    const result = await prisma.project.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE project error:", error);

    return NextResponse.json(
      { error: "Failed to delete project." },
      { status: 500 }
    );
  }
}
