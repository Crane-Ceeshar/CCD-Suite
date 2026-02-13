import type { FastifyInstance } from 'fastify';

const AI_SERVICES_URL = process.env.AI_SERVICES_URL || 'http://localhost:5100';

interface AutomationRunBody {
  automation_type: string;
  automation_config?: Record<string, unknown>;
  tenant_id: string;
}

export async function automationRoutes(fastify: FastifyInstance) {
  /**
   * POST /automation/run
   * Proxy automation execution requests to the AI services automation endpoint.
   */
  fastify.post<{ Body: AutomationRunBody }>('/automation/run', async (request, reply) => {
    const { automation_type, tenant_id } = request.body;

    if (!automation_type) {
      reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'automation_type is required' },
      });
      return;
    }

    if (!tenant_id) {
      reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'tenant_id is required' },
      });
      return;
    }

    const aiResp = await fetch(`${AI_SERVICES_URL}/api/ai/automation/run`, {
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
