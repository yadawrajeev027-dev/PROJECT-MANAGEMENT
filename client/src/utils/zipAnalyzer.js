/**
 * ProjectPulse AI - Codebase ZIP Inspector & Manifest Analyzer
 * 
 * Inspects uploaded ZIP archives client-side using JSZip:
 * 1. Counts real source code files (stripping out node_modules, git, and dist artifacts).
 * 2. Parses package.json and requirements.txt to detect REAL technologies used in the code.
 * 3. Extracts and parses PROJECT_REQUIREMENTS.md to import actual requirements into the matrix.
 * 4. Ensures no hardcoded assumptions (such as MongoDB) are applied unless actually present.
 */

import JSZip from 'jszip';
import { parseRequirementsMarkdown } from './markdownParser.js';

// Known dependency mappings from npm packages to display names
const NPM_TECH_MAP = [
  { test: /^(react|react-dom)$/i, name: 'React' },
  { test: /^express$/i, name: 'Express' },
  { test: /^next$/i, name: 'Next.js' },
  { test: /^vite$/i, name: 'Vite' },
  { test: /^vue$/i, name: 'Vue' },
  { test: /^@angular/i, name: 'Angular' },
  { test: /^(sqlite3|better-sqlite3|sqlite)$/i, name: 'SQLite' },
  { test: /^(mongoose|mongodb)$/i, name: 'MongoDB' },
  { test: /^(pg|postgres)$/i, name: 'PostgreSQL' },
  { test: /^(mysql|mysql2)$/i, name: 'MySQL' },
  { test: /^(@prisma\/client|prisma)$/i, name: 'Prisma' },
  { test: /^sequelize$/i, name: 'Sequelize' },
  { test: /^tailwindcss$/i, name: 'Tailwind CSS' },
  { test: /^(jsonwebtoken|jose)$/i, name: 'JWT' },
  { test: /^(bcrypt|bcryptjs|argon2)$/i, name: 'Bcrypt' },
  { test: /^(jest|vitest|mocha|supertest)$/i, name: 'Testing Suite' },
  { test: /^typescript$/i, name: 'TypeScript' },
  { test: /^(socket\.io|socket\.io-client)$/i, name: 'Socket.io' },
  { test: /^(redux|@reduxjs\/toolkit)$/i, name: 'Redux' },
  { test: /^axios$/i, name: 'Axios' },
  { test: /^cors$/i, name: 'Node.js / Express' },
  { test: /^(fastapi|uvicorn)$/i, name: 'FastAPI' },
  { test: /^flask$/i, name: 'Flask' },
  { test: /^django$/i, name: 'Django' },
];

export async function inspectZipArchive(file) {
  if (!file) {
    throw new Error('No file provided for inspection');
  }

  const zip = new JSZip();
  let zipContent;
  try {
    zipContent = await zip.loadAsync(file);
  } catch (err) {
    throw new Error(`Failed to read ZIP archive: ${err.message || 'Invalid format'}`);
  }

  const detectedTechSet = new Set();
  let totalFiles = 0;
  let detectedProjectName = null;
  let detectedDescription = null;
  let requirementsFound = [];
  let requirementsSourceFile = null;
  let categoryHint = 'Web Application';

  const fileEntries = Object.keys(zipContent.files);

  // Filter out junk / internal directories
  const meaningfulFiles = fileEntries.filter((path) => {
    const p = path.toLowerCase();
    return (
      !zipContent.files[path].dir &&
      !p.includes('__macosx') &&
      !p.includes('.ds_store') &&
      !p.includes('/node_modules/') &&
      !p.startsWith('node_modules/') &&
      !p.includes('/.git/') &&
      !p.startsWith('.git/') &&
      !p.includes('/dist/') &&
      !p.includes('/build/') &&
      !p.includes('/.next/')
    );
  });

  totalFiles = meaningfulFiles.length;

  // 1. Inspect package.json files
  const packageJsonFiles = fileEntries.filter((p) => {
    const lower = p.toLowerCase();
    return lower.endsWith('package.json') && !lower.includes('node_modules');
  });

  for (const pkgPath of packageJsonFiles) {
    try {
      const content = await zipContent.files[pkgPath].async('string');
      const pkg = JSON.parse(content);

      if (pkg.name && !detectedProjectName) {
        // Format package name nicely, e.g. "campustask-manager" -> "CampusTask Manager"
        detectedProjectName = pkg.name
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim();
      }

      if (pkg.description && !detectedDescription) {
        detectedDescription = pkg.description.trim();
      }

      detectedTechSet.add('Node.js');

      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      Object.keys(allDeps).forEach((dep) => {
        for (const mapping of NPM_TECH_MAP) {
          if (mapping.test.test(dep)) {
            detectedTechSet.add(mapping.name);
          }
        }
      });
    } catch (e) {
      console.warn(`Could not parse ${pkgPath}:`, e);
    }
  }

  // 2. Inspect requirements.txt (Python)
  const pyReqFiles = fileEntries.filter((p) => {
    const lower = p.toLowerCase();
    return (lower.endsWith('requirements.txt') || lower.endsWith('pipfile')) && !lower.includes('node_modules');
  });

  for (const pyPath of pyReqFiles) {
    try {
      const content = await zipContent.files[pyPath].async('string');
      detectedTechSet.add('Python');
      categoryHint = 'Machine Learning';

      if (/fastapi/i.test(content)) detectedTechSet.add('FastAPI');
      if (/flask/i.test(content)) detectedTechSet.add('Flask');
      if (/django/i.test(content)) detectedTechSet.add('Django');
      if (/scikit-learn|sklearn/i.test(content)) detectedTechSet.add('Scikit-Learn');
      if (/pandas/i.test(content)) detectedTechSet.add('Pandas');
      if (/torch|pytorch/i.test(content)) detectedTechSet.add('PyTorch');
      if (/tensorflow|keras/i.test(content)) detectedTechSet.add('TensorFlow');
      if (/sqlite/i.test(content)) detectedTechSet.add('SQLite');
      if (/pymongo|motor/i.test(content)) detectedTechSet.add('MongoDB');
      if (/psycopg2|asyncpg/i.test(content)) detectedTechSet.add('PostgreSQL');
    } catch (e) {
      console.warn(`Could not parse ${pyPath}:`, e);
    }
  }

  // 3. Inspect Markdown files for Requirements (PROJECT_REQUIREMENTS.md priority)
  const markdownFiles = fileEntries.filter((p) => {
    const lower = p.toLowerCase();
    return lower.endsWith('.md') && !lower.includes('node_modules');
  });

  // Sort to prioritize files explicitly named "project_requirements.md" or "requirements.md"
  markdownFiles.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aIsReq = aLower.includes('requirement');
    const bIsReq = bLower.includes('requirement');
    if (aIsReq && !bIsReq) return -1;
    if (!aIsReq && bIsReq) return 1;
    return a.length - b.length;
  });

  for (const mdPath of markdownFiles) {
    try {
      const content = await zipContent.files[mdPath].async('string');
      const parsed = parseRequirementsMarkdown(content);
      if (parsed && parsed.length > 0) {
        requirementsFound = parsed;
        // Clean display name, e.g. "CampusTask/PROJECT_REQUIREMENTS.md" -> "PROJECT_REQUIREMENTS.md"
        requirementsSourceFile = mdPath.split('/').pop() || mdPath;
        break; // Found primary requirements specification
      }
    } catch (e) {
      console.warn(`Could not parse requirements from ${mdPath}:`, e);
    }
  }

  // Fallback project name from zip filename if not in package.json
  if (!detectedProjectName) {
    detectedProjectName = file.name
      .replace(/\.zip$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  const detectedTechnologies = Array.from(detectedTechSet);

  return {
    zipFileName: file.name,
    zipFileSize: file.size,
    totalFiles,
    detectedTechnologies,
    detectedProjectName,
    detectedDescription,
    categoryHint,
    requirementsFound,
    requirementsSourceFile,
    hasRequirementsSpec: requirementsFound.length > 0,
    meaningfulFiles: meaningfulFiles.slice(0, 50), // Sample file list for inspection
  };
}
