import type { FastifyInstance } from 'fastify';

const AI_SERVICES_URL = process.env.AI_SERVICES_URL || 'http://localhost:5100';

interface EmbedBody {
  text?: string;
  texts?: string[];
}

export async function embedRoutes(fastify: FastifyInstance) {
  /**
   * POST /embed
   * Proxy embedding requests to the AI services embed endpoint.
   * Accepts { text: string } for single or { texts: string[] } for batch.
   */
  fastify.post<{ Body: EmbedBody }>('/embed', async (request, reply) => {
    const { text, texts } = request.body;

    if (!text && (!texts || texts.length === 0)) {
      reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: "Provide either 'text' or 'texts'" },
      });
      return;
    }

    const aiResp = await fetch(`${AI_SERVICES_URL}/api/ai/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      reply.status(aiResp.status).send({
        success: false,
        error: { code: 'AI_SERVICE_ERROR', message: errText },
      });
      return;
    }

    const data = await aiResp.json();
    return data;
  });
}
