
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

    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const month = searchParams.get("month");

    const where = {
      userId: session.user.id,
    };

    if (type && type !== "ALL" && ENTRY_TYPES.includes(type)) {
      where.type = type;
    }

    if (search?.trim()) {
      where.OR = [
        {
          title: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    if (month) {
      const date = new Date(`${month}-01T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid month." },
          { status: 400 }
        );
      }

      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      where.entryDate = {
        gte: date,
        lt: nextMonth,
      };
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: [
        { entryDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/journal error:", error);

    return NextResponse.json(
      { error: "Could not load journal entries." },
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

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    const type = body.type || "DAILY";
    const mood =
      typeof body.mood === "string" ? body.mood.trim() : null;

    if (!content) {
      return NextResponse.json(
        { error: "Journal content cannot be empty." },
        { status: 400 }
      );
    }

    if (!ENTRY_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid journal entry type." },
        { status: 400 }
      );
    }

    let entryDate = new Date();

    if (body.entryDate) {
      entryDate = new Date(body.entryDate);

      if (Number.isNaN(entryDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid entry date." },
          { status: 400 }
        );
      }
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        title: title || null,
        content,
        type,
        mood: mood || null,
        entryDate,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/journal error:", error);

    return NextResponse.json(
      { error: "Could not create journal entry." },
      { status: 500 }
    );
  }
}
