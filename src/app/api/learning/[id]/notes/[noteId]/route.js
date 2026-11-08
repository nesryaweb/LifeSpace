
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

async function saveKeywords(tx, userId, noteId, entries) {
  await tx.learningNoteKeyword.deleteMany({
    where: { learningNoteId: noteId },
  });

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

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id: pathId, noteId } = await params;

    const existingNote = await prisma.learningNote.findFirst({
      where: {
        id: noteId,
        learningPathId: pathId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Learning note not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = {};

    if (body.title !== undefined) {
      data.title =
        typeof body.title === "string" ? body.title.trim() || null : null;
    }

    if (body.content !== undefined) {
      if (typeof body.content !== "string" || !body.content.trim()) {
        return NextResponse.json(
          { error: "An explanation is required." },
          { status: 400 }
        );
      }

      data.content = body.content.trim();
    }

    for (const field of ["examples", "keyTakeaways", "questions"]) {
      if (body[field] !== undefined) {
        data[field] =
          typeof body[field] === "string"
            ? body[field].trim() || null
            : null;
      }
    }

    if (body.type !== undefined) {
      if (!NOTE_TYPES.includes(body.type)) {
        return NextResponse.json(
          { error: "Invalid note type." },
          { status: 400 }
        );
      }

      data.type = body.type;
    }

    if (body.status !== undefined) {
      if (!NOTE_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid understanding status." },
          { status: 400 }
        );
      }

      data.status = body.status;
    }

    if (body.difficulty !== undefined) {
      if (!NOTE_DIFFICULTIES.includes(body.difficulty)) {
        return NextResponse.json(
          { error: "Invalid difficulty." },
          { status: 400 }
        );
      }

      data.difficulty = body.difficulty;
    }

    if (body.isFavorite !== undefined) {
      data.isFavorite = Boolean(body.isFavorite);
    }

    if (body.reviewDate !== undefined) {
      const reviewDate = parseOptionalDate(body.reviewDate);

      if (reviewDate === undefined) {
        return NextResponse.json(
          { error: "Invalid review date." },
          { status: 400 }
        );
      }

      data.reviewDate = reviewDate;
    }

    if (body.lessonId !== undefined) {
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

      data.lessonId = lessonId;
    }

    const note = await prisma.$transaction(async (tx) => {
      await tx.learningNote.update({
        where: { id: noteId },
        data,
      });

      if (body.keywords !== undefined) {
        const keywordEntries = getKeywordEntries(body.keywords);

        await saveKeywords(
          tx,
          session.user.id,
          noteId,
          keywordEntries
        );
      }

      return tx.learningNote.findUnique({
        where: { id: noteId },
        include: noteInclude,
      });
    });

    return NextResponse.json(formatNote(note));
  } catch (error) {
    console.error("PATCH learning note error:", error);

    return NextResponse.json(
      { error: "Could not update learning note." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { id: pathId, noteId } = await params;

    const note = await prisma.learningNote.findFirst({
      where: {
        id: noteId,
        learningPathId: pathId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Learning note not found." },
        { status: 404 }
      );
    }

    await prisma.learningNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE learning note error:", error);

    return NextResponse.json(
      { error: "Could not delete learning note." },
      { status: 500 }
    );
  }
}
