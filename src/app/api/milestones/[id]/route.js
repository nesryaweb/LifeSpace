
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id,
        project: {
          is: { userId: session.user.id },
        },
      },
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: "Milestone not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = {};

    if (Object.hasOwn(body, "title")) {
      const title = typeof body.title === "string" ? body.title.trim() : "";

      if (!title || title.length > 200) {
        return NextResponse.json(
          { error: "Enter a milestone title of 1–200 characters." },
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

    if (Object.hasOwn(body, "dueDate")) {
      if (body.dueDate === null || body.dueDate === "") {
        data.dueDate = null;
      } else {
        const dueDate = new Date(body.dueDate);

        if (Number.isNaN(dueDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid due date." },
            { status: 400 }
          );
        }

        data.dueDate = dueDate;
      }
    }

    if (Object.hasOwn(body, "position")) {
      if (!Number.isFinite(body.position)) {
        return NextResponse.json(
          { error: "Invalid milestone position." },
          { status: 400 }
        );
      }

      data.position = body.position;
    }

    if (Object.hasOwn(body, "completed")) {
      if (typeof body.completed !== "boolean") {
        return NextResponse.json(
          { error: "Invalid completion value." },
          { status: 400 }
        );
      }

      data.completedAt = body.completed
        ? existingMilestone.completedAt || new Date()
        : null;
    }

    const milestone = await prisma.milestone.update({
      where: { id },
      data,
      include: {
        tasks: {
          orderBy: { position: "asc" },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("PATCH milestone error:", error);

    return NextResponse.json(
      { error: "Failed to update milestone." },
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

    const result = await prisma.milestone.deleteMany({
      where: {
        id,
        project: {
          is: { userId: session.user.id },
        },
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Milestone not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE milestone error:", error);

    return NextResponse.json(
      { error: "Failed to delete milestone." },
      { status: 500 }
    );
  }
}
