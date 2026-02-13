// Edge Function: process-knowledge-base
// Processes a knowledge base document: downloads from storage, extracts text,
// chunks into ~500 token segments, generates embeddings via AI gateway, and
// stores them in ai_embeddings.
//
// Invoked with POST { knowledge_base_id: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GATEWAY_URL = Deno.env.get('API_GATEWAY_URL') || 'http://localhost:4000';

// CORS headers — required for browser-invoked edge functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ~500 tokens is roughly 2000 characters
const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

/**
 * Split text into chunks respecting paragraph boundaries where possible.
 */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // If adding this paragraph would exceed chunk size, finalize current chunk
    if (currentChunk.length + trimmed.length + 2 > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Start new chunk with overlap from end of previous chunk
      const overlapStart = Math.max(0, currentChunk.length - CHUNK_OVERLAP);
      currentChunk = currentChunk.slice(overlapStart).trim() + '\n\n';
    }

    currentChunk += trimmed + '\n\n';

    // If the paragraph itself is larger than CHUNK_SIZE, split by sentences
    if (currentChunk.length > CHUNK_SIZE) {
      const sentences = currentChunk.match(/[^.!?]+[.!?]+\s*/g) ?? [currentChunk];
      let sentenceChunk = '';

      for (const sentence of sentences) {
        if (sentenceChunk.length + sentence.length > CHUNK_SIZE && sentenceChunk.length > 0) {
          chunks.push(sentenceChunk.trim());
          const overlapStart = Math.max(0, sentenceChunk.length - CHUNK_OVERLAP);
          sentenceChunk = sentenceChunk.slice(overlapStart).trim() + ' ';
        }
        sentenceChunk += sentence;
      }

      currentChunk = sentenceChunk;
    }
  }

  // Push any remaining text
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Extract text from file content based on type.
 * Supports .txt, .md, and basic text extraction.
 */
function extractText(content: string, fileType: string): string {
  // For plain text and markdown, use as-is
  if (['text/plain', 'text/markdown', 'application/markdown'].includes(fileType)) {
    return content;
  }

  // For other text-based formats, strip HTML tags if present
  if (fileType.startsWith('text/')) {
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Default: treat as plain text
  return content;
}

/**
 * Generate embeddings for an array of text chunks via the AI gateway.
 * Processes in batches to avoid overwhelming the gateway.
 */
async function generateEmbeddings(
  chunks: string[]
): Promise<number[][]> {
  const BATCH_SIZE = 10;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const res = await fetch(`${GATEWAY_URL}/api/ai/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: batch }),
    });

    if (!res.ok) {
      // Try one at a time as fallback
      for (const chunk of batch) {
        const singleRes = await fetch(`${GATEWAY_URL}/api/ai/embed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunk }),
        });

        if (!singleRes.ok) {
          throw new Error(`Embedding failed for chunk: ${singleRes.status}`);
        }

        const singleData = await singleRes.json();
        const embedding = singleData.embedding ?? singleData.data?.[0]?.embedding;
        if (!embedding) throw new Error('No embedding returned');
        allEmbeddings.push(embedding);
      }
      continue;
    }

    const data = await res.json();
    const embeddings = data.embeddings ?? data.data?.map((d: { embedding: number[] }) => d.embedding) ?? [];

    if (embeddings.length !== batch.length) {
      throw new Error(`Expected ${batch.length} embeddings, got ${embeddings.length}`);
    }

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: corsHeaders });
  }

  try {
    // Verify the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    let body: { knowledge_base_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.knowledge_base_id) {
      return new Response(JSON.stringify({ error: 'knowledge_base_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch the document record
    const { data: doc, error: docErr } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('id', body.knowledge_base_id)
      .single();

    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to processing
    await supabase
      .from('ai_knowledge_base')
      .update({ status: 'processing' })
      .eq('id', doc.id);

    try {
      // Download file from Supabase Storage
      let fileContent: string;

      if (doc.file_url) {
        // Extract bucket and path from the file_url
        // Expected format: /storage/v1/object/public/knowledge-base/{tenant_id}/{filename}
        // or just the storage path
        const pathMatch = doc.file_url.match(/knowledge-base\/(.+)/);
        const storagePath = pathMatch ? pathMatch[1] : doc.file_url;

        const { data: fileData, error: downloadErr } = await supabase.storage
          .from('knowledge-base')
          .download(storagePath);

        if (downloadErr || !fileData) {
          throw new Error(`Failed to download file: ${downloadErr?.message ?? 'Unknown error'}`);
        }

        fileContent = await fileData.text();
      } else {
        throw new Error('No file_url set on document');
      }

      // Extract text content
      const text = extractText(fileContent, doc.file_type);

      if (!text.trim()) {
        throw new Error('No text content could be extracted from the file');
      }

      // Chunk text into segments
      const chunks = chunkText(text);
      console.log(`Document ${doc.id}: extracted ${chunks.length} chunks from ${text.length} characters`);

      if (chunks.length === 0) {
        throw new Error('No chunks could be created from the document');
      }

      // Generate embeddings for all chunks
      const embeddings = await generateEmbeddings(chunks);

      // Delete any existing embeddings for this document (re-processing)
      await supabase
        .from('ai_embeddings')
        .delete()
        .eq('knowledge_base_id', doc.id);

      // Insert new embeddings in batches
      const INSERT_BATCH = 50;
      for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
        const rows = chunks.slice(i, i + INSERT_BATCH).map((content, idx) => ({
          knowledge_base_id: doc.id,
          tenant_id: doc.tenant_id,
          chunk_index: i + idx,
          content,
          embedding: JSON.stringify(embeddings[i + idx]),
          metadata: {
            file_name: doc.file_name,
            title: doc.title,
            chunk_total: chunks.length,
          },
        }));

        const { error: insertErr } = await supabase
          .from('ai_embeddings')
          .insert(rows);

        if (insertErr) {
          throw new Error(`Failed to insert embeddings batch: ${insertErr.message}`);
        }
      }

      // Update document status to ready
      await supabase
        .from('ai_knowledge_base')
        .update({
          status: 'ready',
          chunk_count: chunks.length,
        })
        .eq('id', doc.id);

      return new Response(
        JSON.stringify({
          message: 'Document processed successfully',
          document_id: doc.id,
          chunk_count: chunks.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (processErr) {
      console.error(`Failed to process document ${doc.id}:`, processErr);

      // Update status to failed
      await supabase
        .from('ai_knowledge_base')
        .update({
          status: 'failed',
          metadata: {
            ...((doc.metadata as Record<string, unknown>) ?? {}),
            error: processErr instanceof Error ? processErr.message : 'Processing failed',
          },
        })
        .eq('id', doc.id);

      return new Response(
        JSON.stringify({
          error: processErr instanceof Error ? processErr.message : 'Processing failed',
          document_id: doc.id,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('process-knowledge-base error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
