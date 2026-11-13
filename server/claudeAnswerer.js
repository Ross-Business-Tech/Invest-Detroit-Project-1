// Alternative to OpenAI (server/openaiAnswerer.js): answers allowed chat questions with Claude,
// using our knowledge base. Used only when ANTHROPIC_API_KEY is set and OpenAI isn't (see
// server/aiProvider.js). The key is read from the server's environment, never the site.
//
// Plugs into handleAssistantRequest() as its `answer` function, so the guardrails, privacy
// checks and output check in assistantHandler.js still run before and after every call.
//
// Settings (environment variables, all optional except the key):
//   ANTHROPIC_API_KEY   the key (required for Claude answers; without it the field guide answers)
//   ASSISTANT_MODEL     model id, default claude-opus-5-5
//   ASSISTANT_EFFORT    low | medium | high, default low (quick, conversational answers)

import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './systemPrompt.js'
import { KNOWLEDGE_TEXT, REPLY_SCHEMA, toChatMessages, fallbackReply, finishReply } from './modelReply.js'

export const DEFAULT_MODEL = 'claude-opus-5-5'
export { REPLY_SCHEMA }
const FROM = 'claude'

/** Claude's messages: history must start with the applicant, and the language goes with the question. */
export const toClaudeMessages = toChatMessages

/**
 * @param {{ client?: Anthropic, model?: string, effort?: string, onEvent?: Function }} [opts]
 * @returns {({ modelInput }) => Promise<object>} an `answer` function for handleAssistantRequest
 */
export function createClaudeAnswerer({ client, model = process.env.ASSISTANT_MODEL || DEFAULT_MODEL, effort = process.env.ASSISTANT_EFFORT || 'low', onEvent = () => {} } = {}) {
  const api = client || new Anthropic() // reads ANTHROPIC_API_KEY from the environment
  return async ({ modelInput }) => {
    const response = await api.beta.messages.create({
      model,
      max_tokens: 8000,
      // If Claude's safety filters decline a request, the API retries it on a suitable model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort, format: { type: 'json_schema', schema: REPLY_SCHEMA } },
      system: [
        { type: 'text', text: SYSTEM_PROMPT },
        // The knowledge base never changes between questions, so it is cached and billed at a fraction.
        { type: 'text', text: KNOWLEDGE_TEXT, cache_control: { type: 'ephemeral' } },
      ],
      messages: toClaudeMessages(modelInput),
    })
    onEvent({ type: 'ai_answer', provider: 'anthropic', stop_reason: response.stop_reason, input_tokens: response.usage?.input_tokens, cached_tokens: response.usage?.cache_read_input_tokens, output_tokens: response.usage?.output_tokens })

    // Declined or cut off: say so and point to the team, never show a partial answer.
    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') return fallbackReply(FROM)
    return finishReply(response.content.filter((b) => b.type === 'text').map((b) => b.text).join(''), FROM)
  }
}
