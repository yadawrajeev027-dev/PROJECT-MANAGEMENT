/**
 * requirementNormalizer.js
 * Analyzes requirement text (title, description, code, priority, weight)
 * and extracts semantic intentions, domain categories, and expected evidence signatures.
 *
 * Preserves the original requirement text without mutating it.
 */

// Common stop-words to exclude from semantic token extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must',
  'shall', 'it', 'its', 'this', 'that', 'these', 'those', 'user', 'system',
  'application', 'project', 'feature', 'must', 'should', 'allow', 'able',
  'properly', 'correctly', 'efficiently', 'ensure', 'implement', 'support',
]);

// Domain-specific keyword mappings for capability classification
const DOMAIN_SIGNATURES = {
  authentication: {
    keywords: ['auth', 'login', 'signin', 'sign-in', 'register', 'signup', 'sign-up', 'password', 'jwt', 'token', 'session', 'credential', 'logout', 'oauth'],
    routes: ['/login', '/signin', '/register', '/signup', '/auth', '/token', '/logout', '/me'],
    components: ['login', 'signin', 'register', 'signup', 'auth', 'userprofile'],
    functions: ['login', 'register', 'authenticate', 'hash', 'compare', 'verifytoken', 'generatetoken'],
    models: ['user', 'account', 'session', 'auth'],
    tech: ['jsonwebtoken', 'bcrypt', 'bcryptjs', 'passport'],
  },
  database_persistence: {
    keywords: ['database', 'db', 'mongo', 'mongodb', 'mongoose', 'model', 'schema', 'persist', 'persistence', 'save', 'store', 'collection', 'table', 'sql', 'query', 'record'],
    routes: [],
    components: [],
    functions: ['save', 'create', 'find', 'findone', 'findbyid', 'update', 'delete', 'query'],
    models: ['schema', 'model'],
    tech: ['mongoose', 'mongodb', 'sequelize', 'typeorm', 'prisma', 'pg', 'mysql'],
  },
  crud_api: {
    keywords: ['api', 'route', 'endpoint', 'rest', 'crud', 'http', 'get', 'post', 'put', 'patch', 'delete', 'fetch', 'request', 'response', 'handler'],
    routes: ['/api', '/projects', '/items', '/products', '/users', '/tasks', '/reports'],
    components: [],
    functions: ['create', 'update', 'delete', 'get', 'fetch', 'list', 'handler'],
    models: [],
    tech: ['express', 'fastify', 'axios', 'cors'],
  },
  ui_component: {
    keywords: ['ui', 'component', 'view', 'page', 'screen', 'modal', 'card', 'button', 'form', 'table', 'dashboard', 'frontend', 'render', 'display', 'layout', 'header', 'sidebar'],
    routes: [],
    components: ['page', 'card', 'table', 'modal', 'form', 'button', 'view', 'header', 'sidebar', 'dashboard'],
    functions: ['render', 'handleclick', 'handlesubmit'],
    models: [],
    tech: ['react', 'react-dom', 'vue', 'angular', 'tailwind', 'styled-components'],
  },
  file_handling: {
    keywords: ['file', 'upload', 'download', 'zip', 'archive', 'extract', 'extraction', 'storage', 'multipart', 'stream', 'multer'],
    routes: ['/upload', '/download', '/extract', '/file'],
    components: ['upload', 'file', 'dropzone'],
    functions: ['upload', 'extract', 'stream', 'pipe', 'readfile', 'writefile', 'unzip'],
    models: ['file', 'attachment'],
    tech: ['multer', 'yauzl', 'adm-zip', 'unzipper', 'fs'],
  },
  validation_security: {
    keywords: ['validate', 'validation', 'validator', 'sanitiz', 'sanitize', 'security', 'rate-limit', 'helmet', 'cors', 'idor', 'csrf', 'xss'],
    routes: [],
    components: [],
    functions: ['validate', 'check', 'sanitize'],
    models: [],
    tech: ['express-validator', 'joi', 'zod', 'yup', 'helmet', 'express-rate-limit'],
  },
};

/**
 * Tokenize a text string into normalized, lower-cased semantic stems
 * @param {string} text
 * @returns {string[]}
 */
export function extractTokens(text = '') {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length > 2 && !STOP_WORDS.has(tok));
}

/**
 * Normalizes a raw requirement document into a structured verification definition.
 * 
 * @param {Object} req - The Requirement document from MongoDB
 * @returns {Object} Normalized requirement representation
 */
export function normalizeRequirement(req) {
  const code = (req.requirementCode || '').trim();
  const title = (req.title || '').trim();
  const description = (req.description || '').trim();
  const combinedText = `${code} ${title} ${description}`.toLowerCase();

  const tokens = Array.from(new Set([...extractTokens(title), ...extractTokens(description)]));

  // Detect domain classifications based on keyword matches
  const detectedCategories = [];
  for (const [category, meta] of Object.entries(DOMAIN_SIGNATURES)) {
    const hasKeyword = meta.keywords.some((kw) => combinedText.includes(kw));
    if (hasKeyword) {
      detectedCategories.push(category);
    }
  }

  // Fallback category if none matched
  if (detectedCategories.length === 0) {
    detectedCategories.push('general_logic');
  }

  // Primary category
  const primaryCategory = detectedCategories[0];

  // Requirements characteristics / flags
  const requiresAuth = detectedCategories.includes('authentication') ||
    combinedText.includes('login') || combinedText.includes('auth') || combinedText.includes('jwt');

  const requiresPersistence = detectedCategories.includes('database_persistence') ||
    combinedText.includes('database') || combinedText.includes('db') || combinedText.includes('store') || combinedText.includes('persist');

  const requiresBackend = requiresAuth || requiresPersistence || detectedCategories.includes('crud_api') ||
    detectedCategories.includes('file_handling') || combinedText.includes('api') || combinedText.includes('route') || combinedText.includes('server');

  const requiresUI = detectedCategories.includes('ui_component') ||
    combinedText.includes('ui') || combinedText.includes('component') || combinedText.includes('page') || combinedText.includes('form') || combinedText.includes('button');

  // Collect expected target names from signatures
  const expectedRoutes = [];
  const expectedComponents = [];
  const expectedFunctions = [];
  const expectedModels = [];
  const expectedTech = [];

  for (const cat of detectedCategories) {
    const sig = DOMAIN_SIGNATURES[cat];
    if (sig) {
      expectedRoutes.push(...sig.routes);
      expectedComponents.push(...sig.components);
      expectedFunctions.push(...sig.functions);
      expectedModels.push(...sig.models);
      expectedTech.push(...sig.tech);
    }
  }

  return {
    rawId: req._id,
    code,
    title,
    description,
    priority: req.priority || 'medium',
    weight: typeof req.weight === 'number' ? req.weight : 1,
    categories: detectedCategories,
    primaryCategory,
    tokens,
    flags: {
      requiresBackend,
      requiresAuth,
      requiresPersistence,
      requiresUI,
    },
    expectedSignatures: {
      routes: Array.from(new Set(expectedRoutes)),
      components: Array.from(new Set(expectedComponents)),
      functions: Array.from(new Set(expectedFunctions)),
      models: Array.from(new Set(expectedModels)),
      technologies: Array.from(new Set(expectedTech)),
    },
  };
}

export default { normalizeRequirement, extractTokens };
