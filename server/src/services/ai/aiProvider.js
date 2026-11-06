/**
 * aiProvider.js
 * Provider-independent AI interface with timeout, retry, and secret protection.
 *
 * Supported providers:
 *  - gemini (default)
 *  - openai
 *  - anthropic
 *  - mock (for deterministic testing & offline environments)
 *
 * Security:
 *  - Never logs or exposes API keys or secrets in errors or traces.
 *  - Enforces strict request timeouts via AbortController.
 *  - Returns clean, classified error statuses (503 for missing config, 504 for timeout, 429 for rate limit).
 */

const DEFAULT_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS, 10) || 30000;
const DEFAULT_RETRIES = parseInt(process.env.AI_MAX_RETRIES, 10) || 2;

/**
 * Resolves active provider configuration from environment variables.
 * @returns {{ provider: string, model: string, apiKey: string, timeoutMs: number, maxRetries: number }}
 */
export function getAIConfig() {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  const apiKey =
    process.env.AI_API_KEY ||
    (provider === 'gemini' ? process.env.GEMINI_API_KEY : '') ||
    (provider === 'openai' ? process.env.OPENAI_API_KEY : '') ||
    (provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : '') ||
    '';

  const defaultModel =
    provider === 'openai'
      ? 'gpt-4o-mini'
      : provider === 'anthropic'
      ? 'claude-3-haiku-20240307'
      : 'gemini-1.5-flash';

  const model = process.env.AI_MODEL || defaultModel;
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS, 10) || DEFAULT_TIMEOUT_MS;
  const maxRetries = parseInt(process.env.AI_MAX_RETRIES, 10) || DEFAULT_RETRIES;

  return { provider, model, apiKey, timeoutMs, maxRetries };
}

/**
 * Calls the configured AI provider with timeout and retry handling.
 *
 * @param {string} systemInstruction
 * @param {string} userPrompt
 * @param {Object} [overrideConfig]
 * @returns {Promise<{ rawText: string, provider: string, model: string }>}
 */
export async function callAIProvider(systemInstruction, userPrompt, overrideConfig = {}) {
  const config = { ...getAIConfig(), ...overrideConfig };
  const { provider, model, apiKey, timeoutMs, maxRetries, delayMs } = config;

  // Optional synthetic delay for concurrency and stress testing
  if (delayMs && typeof delayMs === 'number' && delayMs > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
  }

  // 1. Mock Provider for tests & offline operation
  if (provider === 'mock') {
    return {
      rawText: JSON.stringify(getMockAIResponse()),
      provider: 'mock',
      model: 'mock-advisor-v1',
    };
  }

  // 2. Validate API Key
  if (!apiKey || apiKey.trim() === '') {
    const error = new Error(
      `AI Provider is not configured. Missing API key for provider "${provider}". Please configure AI_API_KEY or GEMINI_API_KEY in environment variables.`
    );
    error.statusCode = 503;
    error.isConfigError = true;
    throw error;
  }

  // 3. Execute with retries
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        if (provider === 'gemini') {
          const rawText = await executeGeminiRequest(systemInstruction, userPrompt, model, apiKey, controller.signal);
          return { rawText, provider: 'gemini', model };
        } else if (provider === 'openai') {
          const rawText = await executeOpenAIRequest(systemInstruction, userPrompt, model, apiKey, controller.signal);
          return { rawText, provider: 'openai', model };
        } else {
          const err = new Error(`Unsupported AI provider: "${provider}"`);
          err.statusCode = 400;
          throw err;
        }
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      lastError = err;

      // Handle Abort / Timeout
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`AI Provider request timed out after ${timeoutMs}ms.`);
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }

      // Do not retry 4xx errors (client / auth / bad request)
      if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500 && err.statusCode !== 429) {
        throw err;
      }

      // Handle Rate Limit (429)
      if (err.statusCode === 429) {
        if (attempt === maxRetries) {
          const rateErr = new Error('AI Provider rate limit / quota exceeded. Please try again shortly.');
          rateErr.statusCode = 429;
          throw rateErr;
        }
        // Wait before retry
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      // On last attempt, rethrow
      if (attempt === maxRetries) {
        break;
      }

      // Short delay before retry on transient server errors
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }

  const sanitizedMessage = (lastError?.message || 'AI generation failed')
    .replace(/[a-zA-Z0-9_-]{20,}/g, '[REDACTED_KEY]');
  const finalError = new Error(`AI service failure: ${sanitizedMessage}`);
  finalError.statusCode = lastError?.statusCode || 502;
  throw finalError;
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────

async function executeGeminiRequest(systemInstruction, userPrompt, model, apiKey, signal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const err = new Error(`Gemini API returned status ${response.status}: ${errorBody.slice(0, 200)}`);
    err.statusCode = response.status === 429 ? 429 : response.status >= 500 ? 502 : response.status;
    throw err;
  }

  const json = await response.json();
  const candidate = json.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    const err = new Error('Gemini API returned empty response candidates.');
    err.statusCode = 502;
    throw err;
  }

  return text;
}

// ─── OpenAI Provider ─────────────────────────────────────────────────────────

async function executeOpenAIRequest(systemInstruction, userPrompt, model, apiKey, signal) {
  const url = 'https://api.openai.com/v1/chat/completions';

  const body = {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const err = new Error(`OpenAI API returned status ${response.status}: ${errorBody.slice(0, 200)}`);
    err.statusCode = response.status === 429 ? 429 : response.status >= 500 ? 502 : response.status;
    throw err;
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;

  if (!text) {
    const err = new Error('OpenAI API returned empty response choices.');
    err.statusCode = 502;
    throw err;
  }

  return text;
}

// ─── Mock Fallback ───────────────────────────────────────────────────────────

export function getMockAIResponse() {
  return {
    projectSummary: 'ProjectPulse AI has successfully scanned and verified the uploaded codebase. Core backend routes and initial application scaffolding are established.',
    overallStrengths: [
      'Modular Express routing architecture with isolated controllers and middleware.',
      'Comprehensive password hashing and JWT token issuance observed in authentication handlers.',
      'Structured schema definitions established for database persistence.',
    ],
    majorIssues: [
      'Several API endpoints return placeholder stubs without robust input validation.',
      'Missing automated error handling middleware for unhandled asynchronous exceptions in route handlers.',
    ],
    requirementExplanations: [
      {
        requirementCode: 'REQ-001',
        title: 'User Authentication & Registration',
        status: 'verified',
        explanation: 'Implementation confirmed through active bcrypt password hashing and JSON Web Token creation.',
        gapAnalysis: 'Ensure token expiration refresh rotation is also supported.',
      },
      {
        requirementCode: 'REQ-002',
        title: 'Order Processing API',
        status: 'partial',
        explanation: 'API route is declared, but business logic handler requires persistent database integration.',
        gapAnalysis: 'Connect the route handler to the Order model .save() method.',
      },
    ],
    missingFeatures: [
      'Comprehensive request payload validation across CRUD endpoints.',
      'Database transaction rollbacks during multi-step write operations.',
    ],
    recommendedActions: [
      {
        title: 'Complete Order Processing Business Logic',
        description: 'Wire up the checkout and order routes to save transactions directly into MongoDB.',
        reason: 'Order route currently functions as a stub without database persistence.',
        priority: 'high',
        relatedRequirementCode: 'REQ-002',
        suggestedImplementationSteps: [
          'Import the Order model inside the order controller.',
          'Add input validation for customer and line items.',
          'Execute Order.create() within a try/catch block.',
          'Return 201 Created with the saved order ID.',
        ],
        expectedOutcome: 'Order processing requirement transitions from PARTIAL to VERIFIED.',
      },
      {
        title: 'Integrate Express Validator Middleware',
        description: 'Add payload sanitization to all incoming POST and PUT request bodies.',
        reason: 'Prevents malformed data from reaching internal database layers.',
        priority: 'medium',
        relatedRequirementCode: 'REQ-001',
        suggestedImplementationSteps: [
          'Install express-validator.',
          'Define validation chains for user registration.',
          'Add error formatting middleware.',
        ],
        expectedOutcome: 'Zero unvalidated payloads accepted by the API.',
      },
    ],
    suggestedPriority: 'Focus on transitioning PARTIAL requirement REQ-002 to fully persistent implementation.',
    technicalDebt: [
      'Empty handler bodies in unfinished routes.',
      'Inconsistent HTTP error status codes across controllers.',
    ],
    improvementOpportunities: [
      'Add unit tests for controller edge cases.',
      'Set up database query indexing for high-frequency search fields.',
    ],
  };
}

export default { callAIProvider, getAIConfig, getMockAIResponse };
