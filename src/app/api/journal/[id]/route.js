
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ENTRY_TYPES = [
  "DAILY",
  "GRATITUDE",
  "BRAIN_DUMP",
  "REFLECTION",
  "IDEA",
];

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

    const existing = await prisma.journalEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Journal entry not found." },
        { status: 404 }
      );
    }

    const data = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string") {
        return NextResponse.json(
          { error: "Invalid title." },
          { status: 400 }
        );
      }

      data.title = body.title.trim() || null;
    }

    if (body.content !== undefined) {
      if (typeof body.content !== "string" || !body.content.trim()) {
        return NextResponse.json(
          { error: "Journal content cannot be empty." },
          { status: 400 }
        );
      }

      data.content = body.content.trim();
    }

    if (body.type !== undefined) {
      if (!ENTRY_TYPES.includes(body.type)) {
        return NextResponse.json(
          { error: "Invalid journal entry type." },
          { status: 400 }
        );
      }

      data.type = body.type;
    }

    if (body.mood !== undefined) {
      if (
        body.mood !== null &&
        typeof body.mood !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid mood." },
          { status: 400 }
        );
      }

      data.mood = body.mood?.trim() || null;
    }

    if (body.entryDate !== undefined) {
      const entryDate = new Date(body.entryDate);

      if (Number.isNaN(entryDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid entry date." },
          { status: 400 }
        );
      }

      data.entryDate = entryDate;
    }

    const entry = await prisma.journalEntry.update({
      where: { id },
      data,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/journal/[id] error:", error);

    return NextResponse.json(
      { error: "Could not update journal entry." },
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

    const existing = await prisma.journalEntry.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Journal entry not found." },
        { status: 404 }
      );
    }

    await prisma.journalEntry.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Journal entry deleted.",
    });
  } catch (error) {
    console.error("DELETE /api/journal/[id] error:", error);

    return NextResponse.json(
      { error: "Could not delete journal entry." },
      { status: 500 }
    );
  }
}
