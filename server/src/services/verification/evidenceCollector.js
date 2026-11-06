/**
 * evidenceCollector.js
 * Scans persisted Step 7 AST sourceAnalysis artifacts and relevant source files
 * to gather concrete, line-referenced implementation evidence.
 *
 * Enforces strict verification principles:
 * - Comments and README claims are NEVER counted as implementation evidence.
 * - Empty route stubs (e.g. `res.send('ok')`) are explicitly labeled as weak/stub evidence.
 * - Distinguishes between UI components and backend processing logic.
 * - Strips any internal server paths and only returns clean relative paths.
 */

import fs from 'fs';
import path from 'path';

/**
 * Safely extracts a source code snippet around lineStart to lineEnd.
 *
 * @param {string} extractedRoot - Absolute path to extracted project root
 * @param {string} relativePath  - Relative file path
 * @param {number} lineStart     - 1-based start line
 * @param {number} lineEnd       - 1-based end line
 * @param {number} [maxLines=10] - Maximum lines to excerpt
 * @returns {string} Sanitized source snippet
 */
export function safeGetSnippet(extractedRoot, relativePath, lineStart, lineEnd, maxLines = 10) {
  if (!extractedRoot || !relativePath) return '';

  try {
    const root = path.resolve(extractedRoot);
    const resolvedPath = path.resolve(root, relativePath);
    const rel = path.relative(root, resolvedPath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return '';
    }
    if (!fs.existsSync(resolvedPath)) {
      return '';
    }

    const content = fs.readFileSync(resolvedPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const start = Math.max(0, (lineStart || 1) - 1);
    const end = Math.min(lines.length, (lineEnd || lineStart || 1));
    const count = Math.min(end - start, maxLines);

    return lines
      .slice(start, start + count)
      .map((l, idx) => `${start + idx + 1}: ${l}`)
      .join('\n');
  } catch {
    return '';
  }
}

/**
 * Determines whether a given source code string looks like an empty or superficial stub
 * @param {string} codeSnippet
 * @returns {boolean}
 */
export function isStubSnippet(codeSnippet = '') {
  if (!codeSnippet) return true;
  const cleaned = codeSnippet
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove comments
    .replace(/\s+/g, ' ')
    .trim();

  // If it has real operations like create, find, hash, sign, verify, it is NOT a stub
  if (/\b(jwt|bcrypt|sign|verify|hash|compare|save|create|findOne|find|findById|update|delete|next)\b/i.test(cleaned)) {
    return false;
  }

  // Common stub patterns: empty body, res.send('ok'), res.json({}), todo placeholders
  if (
    cleaned === '' ||
    /TODO|FIXME|NOT_IMPLEMENTED/i.test(cleaned) ||
    /^(\w+\s*=\s*)?(\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*\{\s*(res\.(send|json)\(\s*['"]?(ok|success|placeholder|todo)?['"]?\s*\);?)?\s*\}$/i.test(cleaned) ||
    /^function[^{]*\{\s*(return(\s+null|\s+undefined|\s+['"]ok['"])?;?)?\s*\}$/i.test(cleaned)
  ) {
    return true;
  }
  return false;
}

/**
 * Checks whether source text demonstrates actual database persistence logic
 * @param {string} code
 * @returns {boolean}
 */
export function hasPersistenceLogic(code = '') {
  if (!code) return false;
  return /\b(save|create|findOne|findById|updateOne|deleteOne|find|insertMany|aggregate|countDocuments)\s*\(/i.test(code);
}

/**
 * Checks whether source text demonstrates actual authentication verification logic
 * @param {string} code
 * @returns {boolean}
 */
export function hasAuthLogic(code = '') {
  if (!code) return false;
  return /\b(compare|hash|sign|verify|verifyToken|generateToken|bcrypt|jwt|authenticate)\s*\(/i.test(code) ||
    /\b(req\.user|req\.headers\.authorization)\b/i.test(code);
}

/**
 * Collects evidence from Step 7 sourceAnalysis findings for a normalized requirement.
 *
 * @param {Object} normalizedReq - Output of normalizeRequirement
 * @param {Object} sourceAnalysis - The sourceAnalysis payload from AnalysisReport
 * @param {string} [extractedRoot] - Absolute extracted storage path on disk (optional)
 * @returns {Array<Object>} List of collected evidence items
 */
export function collectEvidence(normalizedReq, sourceAnalysis, extractedRoot = null) {
  if (!sourceAnalysis) return [];

  const evidence = [];
  const { tokens, expectedSignatures, flags } = normalizedReq;

  const functions = sourceAnalysis.functions || [];
  const routes = sourceAnalysis.expressRoutes || [];
  const reactComponents = sourceAnalysis.reactComponents || [];
  const classes = sourceAnalysis.classes || [];
  const imports = sourceAnalysis.imports || [];
  const fileInventory = sourceAnalysis.fileInventory || [];

  // Helper to test if identifier matches any requirement tokens
  const matchesTokens = (str = '') => {
    if (!str) return false;
    const lower = str.toLowerCase();
    return tokens.some((tok) => lower.includes(tok));
  };

  // Helper to test if identifier matches expected signatures
  const matchesSignatures = (str = '', signatureList = []) => {
    if (!str) return false;
    const lower = str.toLowerCase();
    return signatureList.some((sig) => lower.includes(sig.toLowerCase()));
  };

  // ── 1. API Route Evidence ──────────────────────────────────────────────────
  for (const r of routes) {
    const routePath = (r.meta?.path || r.name || '').toLowerCase();
    const routeMethod = (r.meta?.method || '').toUpperCase();
    const isTokenMatch = matchesTokens(routePath);
    const isSignatureMatch = matchesSignatures(routePath, expectedSignatures.routes);

    if (isTokenMatch || isSignatureMatch) {
      const snippet = extractedRoot
        ? safeGetSnippet(extractedRoot, r.filePath, r.startLine, r.endLine)
        : '';
      const isStub = isStubSnippet(snippet);

      let strength = 'moderate';
      let confidence = 75;
      let explanation = `Express ${routeMethod} route declared at "${routePath}".`;

      if (isStub && snippet) {
        strength = 'weak';
        confidence = 35;
        explanation += ' Warning: Implementation appears to be an empty or stub handler without business logic.';
      } else if (snippet && (hasPersistenceLogic(snippet) || hasAuthLogic(snippet))) {
        strength = 'strong';
        confidence = 90;
        if (hasAuthLogic(snippet)) {
          explanation += ' Verified cryptographic or token authentication logic in route handler.';
        } else {
          explanation += ' Verified database persistence logic in route handler body.';
        }
      }

      evidence.push({
        filePath: r.filePath,
        lineStart: r.startLine,
        lineEnd: r.endLine,
        evidenceType: 'api_route',
        strength,
        confidence,
        explanation,
        snippet: snippet.slice(0, 300),
      });
    }
  }

  // ── 2. Function / Method Evidence ──────────────────────────────────────────
  for (const fn of functions) {
    const fnName = fn.name || '';
    if (!fnName) continue;

    const isTokenMatch = matchesTokens(fnName);
    const isSignatureMatch = matchesSignatures(fnName, expectedSignatures.functions);

    if (isTokenMatch || isSignatureMatch) {
      const snippet = extractedRoot
        ? safeGetSnippet(extractedRoot, fn.filePath, fn.startLine, fn.endLine)
        : '';
      const isStub = isStubSnippet(snippet);

      let strength = 'moderate';
      let confidence = 70;
      let explanation = `Function "${fnName}" declared in "${fn.filePath}".`;

      if (isStub && snippet) {
        strength = 'weak';
        confidence = 30;
        explanation += ' Warning: Function body contains no actionable implementation logic.';
      } else if (snippet) {
        if (flags.requiresAuth && hasAuthLogic(snippet)) {
          strength = 'strong';
          confidence = 90;
          explanation += ' Verified cryptographic or token authentication logic.';
        } else if (flags.requiresPersistence && hasPersistenceLogic(snippet)) {
          strength = 'strong';
          confidence = 90;
          explanation += ' Verified database query and persistence operation.';
        }
      }

      evidence.push({
        filePath: fn.filePath,
        lineStart: fn.startLine,
        lineEnd: fn.endLine,
        evidenceType: 'function',
        strength,
        confidence,
        explanation,
        snippet: snippet.slice(0, 300),
      });
    }
  }

  // ── 3. React Component Evidence ───────────────────────────────────────────
  for (const comp of reactComponents) {
    const compName = comp.name || '';
    const isTokenMatch = matchesTokens(compName);
    const isSignatureMatch = matchesSignatures(compName, expectedSignatures.components);

    if (isTokenMatch || isSignatureMatch) {
      const snippet = extractedRoot
        ? safeGetSnippet(extractedRoot, comp.filePath, comp.startLine, comp.endLine)
        : '';

      const isAuthReq = flags.requiresAuth;
      let strength = 'moderate';
      let confidence = 65;
      let explanation = `React component "${compName}" declared at lines ${comp.startLine}-${comp.endLine}.`;

      // CRITICAL RULE: A login component alone does NOT prove authentication works!
      if (isAuthReq) {
        strength = 'weak';
        confidence = 45;
        explanation += ' Note: UI components alone do not prove backend authentication or credential validation.';
      }

      evidence.push({
        filePath: comp.filePath,
        lineStart: comp.startLine,
        lineEnd: comp.endLine,
        evidenceType: 'react_component',
        strength,
        confidence,
        explanation,
        snippet: snippet.slice(0, 300),
      });
    }
  }

  // ── 4. Classes / Database Models ──────────────────────────────────────────
  for (const cls of classes) {
    const clsName = cls.name || '';
    const isTokenMatch = matchesTokens(clsName);
    const isSignatureMatch = matchesSignatures(clsName, expectedSignatures.models);

    if (isTokenMatch || isSignatureMatch) {
      const snippet = extractedRoot
        ? safeGetSnippet(extractedRoot, cls.filePath, cls.startLine, cls.endLine)
        : '';

      let strength = 'moderate';
      let confidence = 60;
      let explanation = `Class or model "${clsName}" declared in "${cls.filePath}".`;

      if (flags.requiresPersistence) {
        const hasQuery = hasPersistenceLogic(snippet);
        if (hasQuery) {
          strength = 'strong';
          confidence = 85;
          explanation += ' Verified database model with active query/persistence logic.';
        } else {
          strength = 'weak';
          confidence = 40;
          explanation += ' Model schema defined, but query/persistence operations not verified in this block.';
        }
      }

      evidence.push({
        filePath: cls.filePath,
        lineStart: cls.startLine,
        lineEnd: cls.endLine,
        evidenceType: 'database_model',
        strength,
        confidence,
        explanation,
        snippet: snippet.slice(0, 300),
      });
    }
  }

  // ── 5. Supporting Import / Library Evidence ────────────────────────────────
  for (const imp of imports) {
    const importSource = (imp.name || imp.meta?.source || '').toLowerCase();
    const isTechMatch = expectedSignatures.technologies.some((t) => importSource.includes(t));

    if (isTechMatch) {
      evidence.push({
        filePath: imp.filePath,
        lineStart: imp.startLine,
        lineEnd: imp.endLine,
        evidenceType: 'import',
        strength: 'weak',
        confidence: 30,
        explanation: `Library dependency "${importSource}" imported. Supporting evidence only.`,
        snippet: '',
      });
    }
  }

  // Deduplicate evidence items sharing identical file + line numbers
  const seenKeys = new Set();
  const deduped = [];
  for (const item of evidence) {
    const key = `${item.filePath}:${item.lineStart}:${item.evidenceType}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}

export default { collectEvidence, safeGetSnippet, isStubSnippet, hasPersistenceLogic, hasAuthLogic };
