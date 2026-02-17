import { embed } from "ai";
import { drizzle } from "drizzle-orm/postgres-js";
import mammoth from "mammoth";
import postgres from "postgres";
import { openai } from "@/lib/ai/openai";
import { requireAdmin } from "@/lib/auth/admin";
import { documents } from "@/lib/db/schema";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function chunkText(text: string, maxLength = 1500) {
  const chunks: string[] = [];
  let current = text.trim();

  while (current.length > maxLength) {
    let splitIndex = current.lastIndexOf("\n\n", maxLength);
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }
    const chunk = current.slice(0, splitIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    current = current.slice(splitIndex).trim();
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

export async function POST(request: Request) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    return Response.json({ error: "Database not configured" }, { status: 500 });
  }

  const client = postgres(postgresUrl);
  const db = drizzle(client);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "general";
    const language = (formData.get("language") as string) || "en";
    const url =
      (formData.get("url") as string) || "https://www.nyenglishteacher.com";

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".docx")) {
      return Response.json(
        {
          error:
            "Invalid file type. Only DOCX files are supported for this endpoint.",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return Response.json(
        { error: "DOCX file is empty or corrupted" },
        { status: 400 },
      );
    }

    if (buffer.length > MAX_FILE_BYTES) {
      return Response.json(
        { error: "DOCX file is too large" },
        { status: 400 },
      );
    }

    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || "").trim();

    if (!text) {
      return Response.json(
        {
          error:
            "No text content found in DOCX. The document may be empty or unsupported.",
        },
        { status: 400 },
      );
    }

    const chunks = chunkText(text);

    for (const chunk of chunks) {
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: chunk,
      });

      await db.insert(documents).values({
        content: chunk,
        url,
        embedding: embedding as any,
        metadata: JSON.stringify({
          type,
          language,
          sourceFile: file.name,
          sourceType: "docx",
        }),
      });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing DOCX knowledge upload:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: `Failed to process DOCX: ${errorMessage}` },
      { status: 500 },
    );
  }
}
