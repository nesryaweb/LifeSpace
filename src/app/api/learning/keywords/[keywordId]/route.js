
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getOwnedKeyword(keywordId, userId) {
  return prisma.learningKeyword.findFirst({
    where: {
      id: keywordId,
      userId,
    },
  });
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

    const { keywordId } = await params;
    const existing = await getOwnedKeyword(
      keywordId,
      session.user.id
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Keyword not found." },
        { status: 404 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : existing.name;

    const meaning =
      typeof body.meaning === "string"
        ? body.meaning.trim()
        : existing.meaning;

    const example =
      typeof body.example === "string"
        ? body.example.trim()
        : existing.example || "";

    if (!name) {
      return NextResponse.json(
        { error: "Please enter a keyword name." },
        { status: 400 }
      );
    }

    if (!meaning) {
      return NextResponse.json(
        { error: "Please enter the keyword meaning." },
        { status: 400 }
      );
    }

    const normalizedName = name.toLowerCase();

    const duplicate = await prisma.learningKeyword.findFirst({
      where: {
        userId: session.user.id,
        normalizedName,
        NOT: {
          id: keywordId,
        },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error: "You already have a keyword with this name in your glossary.",
        },
        { status: 409 }
      );
    }

    const keyword = await prisma.learningKeyword.update({
      where: {
        id: keywordId,
      },
      data: {
        name,
        normalizedName,
        meaning,
        example: example || null,
      },
    });

    return NextResponse.json({
      keyword,
    });
  } catch (error) {
    console.error("PATCH learning keyword error:", error);

    return NextResponse.json(
      { error: "Could not update this keyword." },
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

    const { keywordId } = await params;
    const existing = await getOwnedKeyword(
      keywordId,
      session.user.id
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Keyword not found." },
        { status: 404 }
      );
    }

    await prisma.learningKeyword.delete({
      where: {
        id: keywordId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Keyword deleted from your glossary.",
    });
  } catch (error) {
    console.error("DELETE learning keyword error:", error);

    return NextResponse.json(
      { error: "Could not delete this keyword." },
      { status: 500 }
    );
  }
}
