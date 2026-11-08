
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedTypes = ["image", "note", "quote"];

function toClientItem(item) {
  const size =
    item.width <= 250
      ? "small"
      : item.width >= 330
        ? "large"
        : "medium";

  return {
    id: item.id,
    type: item.type.toLowerCase(),
    title: item.title || "",
    text: item.description || "",
    image: item.imageUrl || "",
    size,
    color: item.color,
    x: item.positionX,
    y: item.positionY,
    zIndex: item.zIndex,
    rotation: `${item.rotation}deg`,
  };
}

async function getUserBoard(userId) {
  return prisma.visionBoard.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      items: {
        orderBy: {
          zIndex: "asc",
        },
      },
    },
  });
}

// GET: Load the signed-in user's vision board.
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    const board = await getUserBoard(session.user.id);

    return NextResponse.json({
      items: board.items.map(toClientItem),
    });
  } catch (error) {
    console.error("Vision board GET error:", error);

    return NextResponse.json(
      { message: "Could not load your vision board." },
      { status: 500 }
    );
  }
}

// PUT: Create, update, and delete board items.
export async function PUT(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!Array.isArray(body.items) || body.items.length > 500) {
      return NextResponse.json(
        { message: "Invalid vision board data." },
        { status: 400 }
      );
    }

    const ids = new Set();

    const items = [];

    for (let index = 0; index < body.items.length; index++) {
      const item = body.items[index];

      if (
        !item ||
        typeof item.id !== "string" ||
        !item.id.trim() ||
        item.id.length > 100 ||
        !allowedTypes.includes(item.type) ||
        !Number.isFinite(item.x) ||
        !Number.isFinite(item.y) ||
        Math.abs(item.x) > 100000 ||
        Math.abs(item.y) > 100000
      ) {
        return NextResponse.json(
          { message: "Invalid vision board item." },
          { status: 400 }
        );
      }

      if (ids.has(item.id)) {
        return NextResponse.json(
          { message: "Duplicate card IDs." },
          { status: 400 }
        );
      }

      ids.add(item.id);

      const rotation = Number.parseFloat(
        String(item.rotation || "0").replace("deg", "")
      );

      const width =
        item.size === "small"
          ? 230
          : item.size === "large"
            ? 360
            : 290;

      const color =
        typeof item.color === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(item.color)
          ? item.color
          : "#F7DCE5";

      items.push({
        id: item.id,
        type: item.type.toUpperCase(),
        title:
          typeof item.title === "string"
            ? item.title.slice(0, 300)
            : null,
        description:
          typeof item.text === "string"
            ? item.text.slice(0, 5000)
            : null,
        imageUrl:
          typeof item.image === "string"
            ? item.image.slice(0, 2000)
            : null,
        positionX: item.x,
        positionY: item.y,
        width,
        rotation: Number.isFinite(rotation)
          ? Math.max(-180, Math.min(180, rotation))
          : 0,
        zIndex: Number.isFinite(item.zIndex)
          ? Math.trunc(item.zIndex)
          : index + 1,
        color,
      });
    }

    const board = await getUserBoard(session.user.id);

    await prisma.$transaction(async (tx) => {
      const existingItems = await tx.visionItem.findMany({
        where: {
          boardId: board.id,
        },
        select: {
          id: true,
        },
      });

      const existingIds = new Set(
        existingItems.map((item) => item.id)
      );

      for (const item of items) {
        const { id, ...data } = item;

        if (existingIds.has(id)) {
          await tx.visionItem.update({
            where: { id },
            data,
          });
        } else {
          await tx.visionItem.create({
            data: {
              id,
              boardId: board.id,
              ...data,
            },
          });
        }
      }

      const retainedIds = items.map((item) => item.id);

      await tx.visionItem.deleteMany({
        where: {
          boardId: board.id,
          ...(retainedIds.length
            ? {
                id: {
                  notIn: retainedIds,
                },
              }
            : {}),
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Vision board PUT error:", error);

    return NextResponse.json(
      { message: "Could not save your vision board." },
      { status: 500 }
    );
  }
}
