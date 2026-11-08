
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

function formatRecord(record) {
  return {
    ...record,
    startDate: record.startDate.toISOString().slice(0, 10),
    endDate: record.endDate.toISOString().slice(0, 10),
  };
}

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

    const existing = await prisma.periodRecord.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Period record not found." },
        { status: 404 }
      );
    }

    const startDate = parseDate(body.startDate);
    const endDate = parseDate(body.endDate);

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Enter valid first and last dates." },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { error: "The last day cannot be before the first day." },
        { status: 400 }
      );
    }

    const overlappingRecord = await prisma.periodRecord.findFirst({
      where: {
        userId: session.user.id,
        id: { not: id },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlappingRecord) {
      return NextResponse.json(
        {
          error:
            "These dates overlap with another period record. Edit that record instead.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.periodRecord.update({
      where: { id },
      data: {
        startDate,
        endDate,
      },
    });

    return NextResponse.json(formatRecord(updated));
  } catch (error) {
    console.error("PATCH /api/periods/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update the period record." },
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

    const existing = await prisma.periodRecord.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Period record not found." },
        { status: 404 }
      );
    }

    await prisma.periodRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/periods/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete the period record." },
      { status: 500 }
    );
  }
}
