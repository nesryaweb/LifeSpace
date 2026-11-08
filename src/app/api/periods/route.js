
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

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");

    const where = {
      userId: session.user.id,
    };

    if (yearParam) {
      const year = Number(yearParam);

      if (!Number.isInteger(year) || year < 1900 || year > 2200) {
        return NextResponse.json(
          { error: "Invalid year." },
          { status: 400 }
        );
      }

      const yearStart = new Date(Date.UTC(year, 0, 1));
      const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

      // Include records that overlap the selected year,
      // including periods that cross December/January.
      where.startDate = { lt: yearEnd };
      where.endDate = { gte: yearStart };
    }

    const records = await prisma.periodRecord.findMany({
      where,
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(records.map(formatRecord));
  } catch (error) {
    console.error("GET /api/periods error:", error);

    return NextResponse.json(
      { error: "Failed to load period records." },
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

    // Prevent accidentally recording overlapping periods.
    const overlappingRecord = await prisma.periodRecord.findFirst({
      where: {
        userId: session.user.id,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlappingRecord) {
      return NextResponse.json(
        {
          error:
            "These dates overlap with an existing period record. Edit the existing record instead.",
        },
        { status: 409 }
      );
    }

    const record = await prisma.periodRecord.create({
      data: {
        userId: session.user.id,
        startDate,
        endDate,
      },
    });

    return NextResponse.json(formatRecord(record), { status: 201 });
  } catch (error) {
    console.error("POST /api/periods error:", error);

    return NextResponse.json(
      { error: "Failed to save the period record." },
      { status: 500 }
    );
  }
}
