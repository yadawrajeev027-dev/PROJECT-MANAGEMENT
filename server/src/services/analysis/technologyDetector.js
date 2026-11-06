/**
 * technologyDetector.js
 * Detects technologies from project manifest files and source imports.
 *
 * Evidence sources (in order of confidence):
 *   1. package.json  – declared dependencies / devDependencies
 *   2. requirements.txt – Python packages
 *   3. pyproject.toml – Python project metadata
 *   4. pom.xml / build.gradle – Java/JVM dependencies
 *   5. Source imports (JS/TS) – import statements observed in AST findings
 *
 * Never claims a technology is "actively used" merely because a filename
 * contains the technology name.
 */

import fs from 'fs';
import path from 'path';

/**
 * @typedef {Object} TechEntry
 * @property {string}   name       - Technology/package name
 * @property {string}   version    - Declared version string (if known) or ''
 * @property {string}   source     - 'package.json' | 'requirements.txt' | 'pyproject.toml' | 'pom.xml' | 'build.gradle' | 'source-import'
 * @property {string}   category   - 'dependency' | 'devDependency' | 'import' | 'build'
 */

// Well-known library → readable technology label
const KNOWN_TECH_LABELS = {
  react:                   'React',
  'react-dom':             'React',
  'react-router':          'React Router',
  'react-router-dom':      'React Router',
  next:                    'Next.js',
  vue:                     'Vue.js',
  angular:                 'Angular',
  '@angular/core':         'Angular',
  svelte:                  'Svelte',
  express:                 'Express',
  fastify:                 'Fastify',
  koa:                     'Koa',
  hapi:                    '@hapi/hapi',
  mongoose:                'Mongoose (MongoDB)',
  sequelize:               'Sequelize',
  typeorm:                 'TypeORM',
  prisma:                  'Prisma',
  '@prisma/client':        'Prisma',
  knex:                    'Knex.js',
  mongodb:                 'MongoDB Driver',
  pg:                      'PostgreSQL (pg)',
  mysql:                   'MySQL',
  mysql2:                  'MySQL',
  redis:                   'Redis',
  ioredis:                 'Redis (ioredis)',
  socket:                  'Socket.io',
  'socket.io':             'Socket.io',
  axios:                   'Axios',
  graphql:                 'GraphQL',
  'apollo-server':         'Apollo Server',
  'apollo-server-express': 'Apollo Server',
  '@apollo/server':        'Apollo Server',
  jest:                    'Jest',
  mocha:                   'Mocha',
  chai:                    'Chai',
  vitest:                  'Vitest',
  webpack:                 'Webpack',
  vite:                    'Vite',
  rollup:                  'Rollup',
  parcel:                  'Parcel',
  tailwindcss:             'Tailwind CSS',
  bootstrap:               'Bootstrap',
  'styled-components':     'Styled Components',
  '@emotion/react':        'Emotion CSS',
  'framer-motion':         'Framer Motion',
  redux:                   'Redux',
  '@reduxjs/toolkit':      'Redux Toolkit',
  zustand:                 'Zustand',
  recoil:                  'Recoil',
  jotai:                   'Jotai',
  'react-query':           'React Query',
  '@tanstack/react-query': 'React Query',
  typescript:              'TypeScript',
  eslint:                  'ESLint',
  prettier:                'Prettier',
  babel:                   'Babel',
  '@babel/core':           'Babel',
  dotenv:                  'dotenv',
  jsonwebtoken:            'JWT (jsonwebtoken)',
  bcrypt:                  'bcrypt',
  bcryptjs:                'bcrypt',
  zod:                     'Zod',
  joi:                     'Joi',
  yup:                     'Yup',
  multer:                  'Multer',
  cors:                    'CORS',
  helmet:                  'Helmet',
  nodemailer:              'Nodemailer',
  stripe:                  'Stripe',
  firebase:                'Firebase',
  'firebase-admin':        'Firebase Admin',
  supabase:                'Supabase',
  '@supabase/supabase-js': 'Supabase',
  django:                  'Django',
  flask:                   'Flask',
  fastapi:                 'FastAPI',
  sqlalchemy:              'SQLAlchemy',
  spring:                  'Spring',
};

/**
 * Attempt to read and parse a JSON file safely.
 * @param {string} absPath
 * @returns {object|null}
 */
function safeReadJson(absPath) {
  try {
    const content = fs.readFileSync(absPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Attempt to read a text file safely.
 * @param {string} absPath
 * @returns {string|null}
 */
function safeReadText(absPath) {
  try {
    return fs.readFileSync(absPath, { encoding: 'utf8', flag: 'r' });
  } catch {
    return null;
  }
}

/**
 * Normalize a package name to a readable technology label.
 * @param {string} pkgName
 * @returns {string}
 */
function labelFor(pkgName) {
  return KNOWN_TECH_LABELS[pkgName] ?? pkgName;
}

/**
 * Detect technologies from manifest files found in the extraction root.
 *
 * @param {string} extractionRoot   - Absolute path to the extraction root
 * @returns {TechEntry[]}
 */
export function detectFromManifests(extractionRoot) {
  const findings = [];

  // ── 1. package.json ──────────────────────────────────────────────────────
  const pkgPath = path.join(extractionRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = safeReadJson(pkgPath);
    if (pkg) {
      for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
        findings.push({
          name: labelFor(name),
          rawName: name,
          version: typeof version === 'string' ? version : '',
          source: 'package.json',
          category: 'dependency',
        });
      }
      for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
        findings.push({
          name: labelFor(name),
          rawName: name,
          version: typeof version === 'string' ? version : '',
          source: 'package.json',
          category: 'devDependency',
        });
      }
    }
  }

  // ── 2. requirements.txt ──────────────────────────────────────────────────
  const reqPath = path.join(extractionRoot, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    const content = safeReadText(reqPath);
    if (content) {
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        // "package==1.2.3" or "package>=1.0"
        const [nameRaw] = trimmed.split(/[=><!~\s]/);
        const name = nameRaw.trim();
        if (name) {
          findings.push({
            name: labelFor(name.toLowerCase()),
            rawName: name,
            version: '',
            source: 'requirements.txt',
            category: 'dependency',
          });
        }
      }
    }
  }

  // ── 3. pyproject.toml (basic extraction — no TOML parser dep required) ──
  const pyprojectPath = path.join(extractionRoot, 'pyproject.toml');
  if (fs.existsSync(pyprojectPath)) {
    const content = safeReadText(pyprojectPath);
    if (content) {
      // Extract lines like: "django = "^4.0""  or  `"django"` from arrays
      const matches = content.matchAll(/["']?([\w-]+)["']?\s*[=><~!]+/g);
      for (const m of matches) {
        const name = m[1].trim();
        if (name && name !== 'python') {
          findings.push({
            name: labelFor(name.toLowerCase()),
            rawName: name,
            version: '',
            source: 'pyproject.toml',
            category: 'dependency',
          });
        }
      }
    }
  }

  // ── 4. pom.xml (Java Maven — simple regex extraction) ───────────────────
  const pomPath = path.join(extractionRoot, 'pom.xml');
  if (fs.existsSync(pomPath)) {
    const content = safeReadText(pomPath);
    if (content) {
      const artifactIds = [...content.matchAll(/<artifactId>([^<]+)<\/artifactId>/g)];
      for (const m of artifactIds) {
        const name = m[1].trim();
        findings.push({
          name: labelFor(name.toLowerCase()),
          rawName: name,
          version: '',
          source: 'pom.xml',
          category: 'build',
        });
      }
    }
  }

  // ── 5. build.gradle ──────────────────────────────────────────────────────
  const gradlePath = path.join(extractionRoot, 'build.gradle');
  if (fs.existsSync(gradlePath)) {
    const content = safeReadText(gradlePath);
    if (content) {
      // implementation 'group:artifact:version' or implementation("group:artifact:version")
      const matches = content.matchAll(/implementation\s*[\("']+[^"']+:([^"':]+):[^"']+["')\s]+/g);
      for (const m of matches) {
        const name = m[1].trim();
        findings.push({
          name: labelFor(name.toLowerCase()),
          rawName: name,
          version: '',
          source: 'build.gradle',
          category: 'build',
        });
      }
    }
  }

  return findings;
}

/**
 * Derive technology findings from AST import data.
 *
 * @param {Array<{source: string}>} imports  - Array of import findings from JS/TS analyzer
 * @returns {TechEntry[]}
 */
export function detectFromImports(imports) {
  const seen = new Set();
  const findings = [];

  for (const imp of imports) {
    // Import findings store the module specifier in `name` (and also in `meta.source`)
    const src = imp.meta?.source ?? imp.name ?? imp.source ?? '';
    // Skip relative imports
    if (src.startsWith('.') || src.startsWith('/')) continue;

    // Normalize scoped packages: "@babel/parser" → "@babel/parser"
    // Regular packages: "express" → "express" (strip sub-paths like "react/jsx-runtime")
    let pkgName = src;
    if (!src.startsWith('@')) {
      pkgName = src.split('/')[0];
    } else {
      const parts = src.split('/');
      pkgName = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : src;
    }

    if (!seen.has(pkgName)) {
      seen.add(pkgName);
      findings.push({
        name: labelFor(pkgName),
        rawName: pkgName,
        version: '',
        source: 'source-import',
        category: 'import',
      });
    }
  }

  return findings;
}

/**
 * Merge manifest and import findings, deduplicating by name+source.
 * Manifest evidence takes precedence over import evidence.
 *
 * @param {TechEntry[]} manifestFindings
 * @param {TechEntry[]} importFindings
 * @returns {TechEntry[]}
 */
export function mergeTechFindings(manifestFindings, importFindings) {
  const seen = new Set();
  const merged = [];

  for (const entry of [...manifestFindings, ...importFindings]) {
    const key = `${entry.name}::${entry.source}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(entry);
    }
  }
  return merged;
}

export default { detectFromManifests, detectFromImports, mergeTechFindings };
