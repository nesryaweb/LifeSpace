
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const NOTE_TYPES = [
  "CONCEPT",
  "TUTORIAL",
  "VOCABULARY",
  "RESEARCH",
  "SUMMARY",
  "PROBLEM_SOLUTION",
  "OTHER",
];

const NOTE_STATUSES = [
  "NOT_UNDERSTOOD",
  "LEARNING",
  "UNDERSTOOD",
];

const NOTE_DIFFICULTIES = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];

const noteInclude = {
  lesson: {
    select: { id: true, title: true },
  },
  keywords: {
    include: {
      learningKeyword: {
        select: {
          id: true,
          name: true,
          meaning: true,
          example: true,
        },
      },
    },
  },
};

function formatNote(note) {
  return {
    ...note,
    keywords: note.keywords.map((item) => ({
      id: item.learningKeyword.id,
      name: item.learningKeyword.name,
      meaning: item.learningKeyword.meaning,
      example: item.learningKeyword.example,
    })),
  };
}

function getKeywordEntries(value) {
  if (!Array.isArray(value)) return [];

  const unique = new Map();

  for (const item of value) {
    if (!item || typeof item !== "object") continue;

    const name = typeof item.name === "string"
      ? item.name.trim().replace(/\s+/g, " ")
      : "";

    const meaning = typeof item.meaning === "string"
      ? item.meaning.trim()
      : "";

    const example = typeof item.example === "string"
      ? item.example.trim()
      : "";

    if (!name || !meaning) continue;

    const normalizedName = name.toLocaleLowerCase();

    if (!unique.has(normalizedName)) {
      unique.set(normalizedName, {
        name,
        normalizedName,
        meaning,
        example: example || null,
      });
    }
  }

  return [...unique.values()];
}

function parseOptionalDate(value) {
  if (!value) return null;

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return undefined;
  }

  return date;
}

async function getOwnedPath(pathId, userId) {
  return prisma.learningPath.findFirst({
    where: {
      id: pathId,
      userId,
    },
    select: { id: true },
  });
}

async function saveKeywords(tx, userId, noteId, entries) {
  for (const entry of entries) {
    const keyword = await tx.learningKeyword.upsert({
      where: {
        userId_normalizedName: {
          userId,
          normalizedName: entry.normalizedName,
        },
      },
      update: {
        meaning: entry.meaning,
        example: entry.example,
      },
      create: {
        userId,
        name: entry.name,
        normalizedName: entry.normalizedName,
        meaning: entry.meaning,
        example: entry.example,
      },
      select: { id: true },
    });

    await tx.learningNoteKeyword.upsert({
      where: {
        learningNoteId_learningKeywordId: {
          learningNoteId: noteId,
          learningKeywordId: keyword.id,
        },
      },
      update: {},
      create: {
        learningNoteId: noteId,
        learningKeywordId: keyword.id,
      },
    });
  }
}

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id: pathId } = await params;

    const path = await getOwnedPath(pathId, session.user.id);

    if (!path) {
      return NextResponse.json(
        { error: "Learning path not found." },
        { status: 404 }
      );
    }

    const notes = await prisma.learningNote.findMany({
      where: {
        learningPathId: pathId,
        userId: session.user.id,
      },
      include: noteInclude,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(notes.map(formatNote));
  } catch (error) {
    console.error("GET learning notes error:", error);

    return NextResponse.json(
      { error: "Could not load learning notes." },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id: pathId } = await params;

    const path = await getOwnedPath(pathId, session.user.id);

    if (!path) {
      return NextResponse.json(
        { error: "Learning path not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json(
        { error: "An explanation is required." },
        { status: 400 }
      );
    }

    const type = body.type || "CONCEPT";
    const status = body.status || "LEARNING";
    const difficulty = body.difficulty || "BEGINNER";

    if (!NOTE_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid note type." },
        { status: 400 }
      );
    }

    if (!NOTE_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid understanding status." },
        { status: 400 }
      );
    }

    if (!NOTE_DIFFICULTIES.includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty." },
        { status: 400 }
      );
    }

    const lessonId = body.lessonId || null;

    if (lessonId) {
      const lesson = await prisma.learningLesson.findFirst({
        where: {
          id: lessonId,
          learningPathId: pathId,
        },
        select: { id: true },
      });

      if (!lesson) {
        return NextResponse.json(
          { error: "The selected lesson does not belong to this learning path." },
          { status: 400 }
        );
      }
    }

    const reviewDate = parseOptionalDate(body.reviewDate);

    if (reviewDate === undefined) {
      return NextResponse.json(
        { error: "Invalid review date." },
        { status: 400 }
      );
    }

    const keywordEntries = getKeywordEntries(body.keywords);

    const note = await prisma.$transaction(async (tx) => {
      const createdNote = await tx.learningNote.create({
        data: {
          userId: session.user.id,
          learningPathId: pathId,
          lessonId,
          title: body.title?.trim() || null,
          content,
          examples: body.examples?.trim() || null,
          keyTakeaways: body.keyTakeaways?.trim() || null,
          questions: body.questions?.trim() || null,
          type,
          status,
          difficulty,
          isFavorite: Boolean(body.isFavorite),
          reviewDate,
        },
      });

      await saveKeywords(
        tx,
        session.user.id,
        createdNote.id,
        keywordEntries
      );

      return tx.learningNote.findUnique({
        where: { id: createdNote.id },
        include: noteInclude,
      });
    });

    return NextResponse.json(formatNote(note), { status: 201 });
  } catch (error) {
    console.error("POST learning note error:", error);

    return NextResponse.json(
      { error: "Could not create learning note." },
      { status: 500 }
    );
  }
}
