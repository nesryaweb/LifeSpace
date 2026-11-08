
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      success: true,
      message: "LifeSpace database connected successfully!",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return Response.json(
      {
        success: false,
        message: "Database connection failed.",
      },
      { status: 500 }
    );
  }
}
