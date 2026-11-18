// Which AI service answers the chat, decided by the keys in the server's environment settings:
//   OPENAI_API_KEY set     -> OpenAI (the main setup)
//   ANTHROPIC_API_KEY set  -> Claude (kept as an alternative)
//   neither                -> the built-in field guide answers; nothing is sent to an AI service
// If both keys are set, OpenAI is used unless AI_PROVIDER=anthropic.

import { createOpenAIAnswerer } from './openaiAnswerer.js'
import { createClaudeAnswerer } from './claudeAnswerer.js'

export const PROVIDER_NAME = { openai: 'OpenAI', anthropic: 'Claude' }

/** @returns {'openai'|'anthropic'|null} */
export function aiProvider(env = process.env) {
  const forced = String(env.AI_PROVIDER || '').trim().toLowerCase()
  if (forced === 'openai') return env.OPENAI_API_KEY ? 'openai' : null
  if (forced === 'anthropic' || forced === 'claude') return env.ANTHROPIC_API_KEY ? 'anthropic' : null
  if (String(env.OPENAI_API_KEY || '').trim()) return 'openai'
  if (String(env.ANTHROPIC_API_KEY || '').trim()) return 'anthropic'
  return null
}

export function createAnswerer(provider, opts = {}) {
  if (provider === 'openai') return createOpenAIAnswerer(opts)
  if (provider === 'anthropic') return createClaudeAnswerer(opts)
  return null
}
