/**
 * sourceAnalysisService.js
 * Orchestrates the full static source code analysis pipeline:
 *
 *  1. File scanning (fileScanner)
 *  2. Language detection (languageDetector)
 *  3. Per-file AST analysis (javascriptAnalyzer / typescriptAnalyzer / markupAnalyzer)
 *  4. Technology detection (technologyDetector)
 *  5. Result aggregation
 *
 * Returns a structured AnalysisResult ready for MongoDB persistence.
 *
 * Security requirements:
 * - Never executes uploaded code.
 * - Never uses eval() or new Function().
 * - Never follows symlinks.
 * - Applies per-file and total size limits.
 * - Strips absolute server paths from all client-facing output.
 */

import fs from 'fs';
import path from 'path';
import { scanExtractedProject } from './fileScanner.js';
import { detectLanguage, aggregateLanguages } from './languageDetector.js';
import { detectFromManifests, detectFromImports, mergeTechFindings } from './technologyDetector.js';
import { analyzeJavaScript } from './javascriptAnalyzer.js';
import { analyzeTypeScript } from './typescriptAnalyzer.js';
import { analyzeHtml, analyzeCss } from './markupAnalyzer.js';

/** Maximum source text to read per file (5 MiB — matches fileScanner) */
const MAX_FILE_READ_BYTES = 5 * 1024 * 1024;

/**
 * @typedef {Object} AnalysisResult
 * @property {number}   totalFiles
 * @property {number}   scannedFiles
 * @property {number}   skippedFiles
 * @property {number}   totalSourceSize
 * @property {object}   languages         - { [langName]: { count, size, astSupported } }
 * @property {object[]} technologies      - TechEntry[]
 * @property {object[]} functions         - AnalysisFinding[] type=function|arrowFunction
 * @property {object[]} classes           - AnalysisFinding[] type=class
 * @property {object[]} reactComponents   - AnalysisFinding[] type=reactComponent
 * @property {object[]} expressRoutes     - AnalysisFinding[] type=expressRoute
 * @property {object[]} imports           - AnalysisFinding[] type=import
 * @property {object[]} exports           - AnalysisFinding[] type=export
 * @property {object[]} syntaxErrors      - AnalysisFinding[] type=syntaxError
 * @property {object[]} unsupportedFiles  - Files detected but not AST-analyzed
 * @property {object[]} fileInventory     - All scanned files with language info
 * @property {string[]} analysisWarnings
 */

/**
 * Run the full static analysis on an extracted project directory.
 *
 * @param {string} extractionRoot   - Absolute path to the extracted project root
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeSourceCode(extractionRoot) {
  if (!fs.existsSync(extractionRoot)) {
    throw Object.assign(new Error('Extraction directory does not exist'), { statusCode: 404 });
  }

  const warnings = [];

  // ── 1. Scan files ──────────────────────────────────────────────────────────
  const scan = await scanExtractedProject(extractionRoot);
  warnings.push(...scan.warnings);

  // ── 2. Classify files by language ──────────────────────────────────────────
  const languages = aggregateLanguages(scan.files);

  // ── 3. Per-file AST analysis ───────────────────────────────────────────────
  const allFindings = [];
  const unsupportedFiles = [];
  const fileInventory = [];

  for (const file of scan.files) {
    const langInfo = detectLanguage(file.relativePath);
    const inventoryEntry = {
      relativePath: file.relativePath,
      extension: file.extension,
      size: file.size,
      language: langInfo?.name ?? 'Unknown',
      astSupported: langInfo?.astSupported ?? false,
      analyzed: false,
      isOversized: file.isOversized,
    };

    if (!file.isSupported) {
      unsupportedFiles.push({ relativePath: file.relativePath, extension: file.extension, size: file.size });
      fileInventory.push(inventoryEntry);
      continue;
    }

    if (file.isOversized) {
      warnings.push(`File skipped (too large, ${file.size} bytes): "${file.relativePath}"`);
      unsupportedFiles.push({ relativePath: file.relativePath, extension: file.extension, size: file.size, reason: 'oversized' });
      fileInventory.push(inventoryEntry);
      continue;
    }

    if (!langInfo?.astSupported) {
      // Language detected but no AST parser — report as unsupported
      unsupportedFiles.push({
        relativePath: file.relativePath,
        extension: file.extension,
        language: langInfo?.name ?? 'Unknown',
        reason: 'no-ast-parser',
        size: file.size,
      });
      fileInventory.push(inventoryEntry);
      continue;
    }

    // Read file content
    let source;
    try {
      source = await fs.promises.readFile(file.absolutePath, { encoding: 'utf8', flag: 'r' });
    } catch (err) {
      warnings.push(`Cannot read file "${file.relativePath}": ${err.message}`);
      fileInventory.push(inventoryEntry);
      continue;
    }

    // Guard against reading oversized files (belt-and-suspenders)
    if (Buffer.byteLength(source, 'utf8') > MAX_FILE_READ_BYTES) {
      warnings.push(`File content truncated (too large): "${file.relativePath}"`);
      unsupportedFiles.push({ relativePath: file.relativePath, extension: file.extension, size: file.size, reason: 'oversized' });
      fileInventory.push(inventoryEntry);
      continue;
    }

    // Dispatch to the appropriate analyzer
    let fileFindings = [];
    const group = langInfo?.group;

    try {
      if (group === 'javascript') {
        const result = analyzeJavaScript(source, file.relativePath);
        fileFindings = result.findings;
      } else if (group === 'typescript') {
        const result = analyzeTypeScript(source, file.relativePath);
        fileFindings = result.findings;
      } else if (group === 'markup') {
        const result = analyzeHtml(source, file.relativePath);
        fileFindings = result.findings;
      } else if (group === 'style') {
        const result = analyzeCss(source, file.relativePath);
        fileFindings = result.findings;
      }
    } catch (err) {
      warnings.push(`Analysis error in "${file.relativePath}": ${err.message}`);
      fileInventory.push(inventoryEntry);
      continue;
    }

    allFindings.push(...fileFindings);
    inventoryEntry.analyzed = true;
    inventoryEntry.findingCount = fileFindings.length;
    fileInventory.push(inventoryEntry);
  }

  // ── 4. Technology detection ────────────────────────────────────────────────
  const manifestTechs = detectFromManifests(extractionRoot);

  // Collect imports for tech detection
  const importFindings = allFindings.filter((f) => f.type === 'import');
  const importTechs = detectFromImports(importFindings);
  const technologies = mergeTechFindings(manifestTechs, importTechs);

  // ── 5. Aggregate findings by type ──────────────────────────────────────────
  const functions      = allFindings.filter((f) => f.type === 'function' || f.type === 'arrowFunction');
  const classes        = allFindings.filter((f) => f.type === 'class' || f.type === 'classMethod');
  const reactComponents = allFindings.filter((f) => f.type === 'reactComponent');
  const expressRoutes  = allFindings.filter((f) => f.type === 'expressRoute');
  const imports        = allFindings.filter((f) => f.type === 'import');
  const exports        = allFindings.filter((f) => f.type === 'export');
  const syntaxErrors   = allFindings.filter((f) => f.type === 'syntaxError');

  return {
    totalFiles: scan.totalFiles,
    scannedFiles: scan.scannedFiles,
    skippedFiles: scan.skippedFiles,
    totalSourceSize: scan.totalSourceSize,
    languages,
    technologies,
    functions,
    classes,
    reactComponents,
    expressRoutes,
    imports,
    exports,
    syntaxErrors,
    unsupportedFiles,
    fileInventory,
    analysisWarnings: warnings,
  };
}

export default { analyzeSourceCode };
