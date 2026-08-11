import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractText, chunkText } from "@/lib/textExtract";
import { embedDocuments } from "@/lib/voyage";

// Admin-only. Takes an uploaded file (or pasted text, sent the same shape by
// the caller) and turns it into searchable knowledge-base chunks: extract
// text -> split into chunks -> embed each chunk -> store. This is the piece
// the admin's "Upload & index" button in /admin was already calling before
// it existed.
export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_SOURCE_TYPES = new Set(["pdf", "docx", "txt"]);

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const fileName = String(body?.file_name || "").trim();
  const sourceType = String(body?.source_type || "");
  const contentBase64 = String(body?.content_base64 || "");

  if (!title || !fileName || !VALID_SOURCE_TYPES.has(sourceType) || !contentBase64) {
    return NextResponse.json(
      { error: "Missing title, file_name, a valid source_type, or content." },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const embeddingModel = process.env.VOYAGE_MODEL || "voyage-3.5-lite";

  const { data: doc, error: insertErr } = await supabaseAdmin
    .from("documents")
    .insert({
      title,
      file_name: fileName,
      source_type: sourceType,
      status: "processing",
      embedding_model: embeddingModel,
    })
    .select("id")
    .single();
  if (insertErr || !doc) {
    return NextResponse.json(
      { error: `Could not create document: ${insertErr?.message}` },
      { status: 500 }
    );
  }

  try {
    const buffer = Buffer.from(contentBase64, "base64");
    const text = await extractText(buffer, sourceType as "pdf" | "docx" | "txt");
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error("No extractable text was found in this file.");
    }

    const embeddings = await embedDocuments(chunks);

    const chunkRows = chunks.map((content, i) => ({
      document_id: doc.id,
      chunk_index: i,
      content,
      embedding: embeddings[i],
      token_count: Math.round(content.split(/\s+/).length * 1.3),
    }));
    const { error: chunksErr } = await supabaseAdmin.from("chunks").insert(chunkRows);
    if (chunksErr) throw new Error(`Saving chunks failed: ${chunksErr.message}`);

    await supabaseAdmin
      .from("documents")
      .update({ status: "indexed", chunk_count: chunkRows.length })
      .eq("id", doc.id);

    return NextResponse.json({ document_id: doc.id, chunk_count: chunkRows.length });
  } catch (err: any) {
    const message = err?.message || "Ingestion failed.";
    await supabaseAdmin
      .from("documents")
      .update({ status: "error", error_message: message })
      .eq("id", doc.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
