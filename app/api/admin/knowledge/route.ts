import { embed } from "ai";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { openai } from "@/lib/ai/openai";
import { requireAdmin } from "@/lib/auth/admin";
import { documents } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    // Check authentication
    const adminId = await requireAdmin();
    if (!adminId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return Response.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const client = postgres(postgresUrl);
    const db = drizzle(client);

    const body = await request.json();
    const { content, url, metadata } = body;

    if (!content) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    // Create embedding
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: content,
    });

    // Insert into database
    await db.insert(documents).values({
      content,
      url: url || "https://www.nyenglishteacher.com",
      embedding: embedding as any,
      metadata: JSON.stringify({ ...(metadata || {}), sourceType: "manual" }),
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error adding knowledge:", error);
    return Response.json({ error: "Failed to add content" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const adminId = await requireAdmin();
    if (!adminId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return Response.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const client = postgres(postgresUrl);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(limitParam ?? "50", 10) || 50),
    );

    if (q && q.trim().length > 0) {
      const trimmed = q.trim();
      const rows = await client`
        SELECT id, content, url, metadata, "createdAt"
        FROM "Document_Knowledge"
        WHERE content ILIKE ${`%${trimmed}%`}
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;

      return Response.json(
        {
          query: trimmed,
          count: rows.length,
          documents: rows,
        },
        { status: 200 },
      );
    }

    // Get all documents
    const allDocuments = await client`
      SELECT id, content, url, metadata, "createdAt"
      FROM "Document_Knowledge"
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;

    return Response.json({ documents: allDocuments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching knowledge:", error);
    return Response.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const adminId = await requireAdmin();
    if (!adminId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return Response.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const client = postgres(postgresUrl);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    const parsedId = Number.parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    await client`
      DELETE FROM "Document_Knowledge"
      WHERE id = ${parsedId}
    `;

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting knowledge:", error);
    return Response.json(
      { error: "Failed to delete content" },
      { status: 500 },
    );
  }
}
