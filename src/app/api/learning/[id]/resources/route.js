import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const RESOURCE_TYPES = [
  "BOOK",
  "VIDEO",
  "WEBSITE",
  "COURSE",
  "ARTICLE",
  "OTHER",
];

export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const path = await prisma.learningPath.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!path) {
      return NextResponse.json({ error: "Learning path not found." }, { status: 404 });
    }

    const resources = await prisma.learningResource.findMany({
      where: { learningPathId: id },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("GET learning resources:", error);
    return NextResponse.json({ error: "Failed to load resources." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const path = await prisma.learningPath.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!path) {
      return NextResponse.json({ error: "Learning path not found." }, { status: 404 });
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Resource title is required." }, { status: 400 });
    }

    const type = body.type || "OTHER";

    if (!RESOURCE_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid resource type." }, { status: 400 });
    }

    const resource = await prisma.learningResource.create({
      data: {
        learningPathId: id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        type,
        url: body.url?.trim() || null,
        author: body.author?.trim() || null,
        position: Number.isInteger(body.position) ? body.position : 0,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("POST learning resource:", error);
    return NextResponse.json({ error: "Failed to create resource." }, { status: 500 });
  }
}