/**
 * languageDetector.js
 * Maps file extensions to language names and AST-support status.
 *
 * IMPORTANT: Language detection ≠ AST parsing.
 * If a language is detected but no parser is integrated, it is reported
 * as detected with astSupported: false.
 */

/**
 * @typedef {Object} LanguageInfo
 * @property {string}  name           - Human-readable language name
 * @property {string}  group          - Broad group: 'javascript' | 'typescript' | 'markup' | 'style' | 'data' | 'other'
 * @property {boolean} astSupported   - True when a real AST parser is integrated
 */

/** @type {Map<string, LanguageInfo>} */
const EXTENSION_MAP = new Map([
  ['.js',   { name: 'JavaScript', group: 'javascript', astSupported: true  }],
  ['.jsx',  { name: 'JSX',        group: 'javascript', astSupported: true  }],
  ['.mjs',  { name: 'JavaScript', group: 'javascript', astSupported: true  }],
  ['.cjs',  { name: 'JavaScript', group: 'javascript', astSupported: true  }],
  ['.ts',   { name: 'TypeScript', group: 'typescript', astSupported: true  }],
  ['.tsx',  { name: 'TSX',        group: 'typescript', astSupported: true  }],
  ['.py',   { name: 'Python',     group: 'python',     astSupported: false }],
  ['.java', { name: 'Java',       group: 'java',       astSupported: false }],
  ['.html', { name: 'HTML',       group: 'markup',     astSupported: true  }],
  ['.htm',  { name: 'HTML',       group: 'markup',     astSupported: true  }],
  ['.css',  { name: 'CSS',        group: 'style',      astSupported: true  }],
  ['.json', { name: 'JSON',       group: 'data',       astSupported: false }],
]);

/**
 * Detect the language of a file based on its extension.
 *
 * @param {string} filePath  - File path or file name (extension is extracted)
 * @returns {LanguageInfo | null}  - Null if unrecognized
 */
export function detectLanguage(filePath) {
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  return EXTENSION_MAP.get(ext) ?? null;
}

/**
 * Aggregate language counts across a list of scanned files.
 *
 * @param {import('./fileScanner.js').ScannedFile[]} files
 * @returns {Record<string, { count: number, size: number, astSupported: boolean }>}
 */
export function aggregateLanguages(files) {
  const result = {};
  for (const file of files) {
    const info = detectLanguage(file.relativePath);
    if (!info) continue;
    if (!result[info.name]) {
      result[info.name] = { count: 0, size: 0, astSupported: info.astSupported };
    }
    result[info.name].count++;
    result[info.name].size += file.size;
  }
  return result;
}

export default { detectLanguage, aggregateLanguages, EXTENSION_MAP };
