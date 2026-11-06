/**
 * markupAnalyzer.js
 * Structural parsing for HTML (.html, .htm) and CSS (.css) files.
 *
 * HTML: uses parse5 to build a parse tree and extract:
 *  - Element counts by tag name
 *  - Script tags
 *  - Link/style tags
 *  - Meta information
 *
 * CSS: uses postcss to extract:
 *  - Rule counts
 *  - Selector list
 *  - At-rule usage (@media, @keyframes, @import, etc.)
 *
 * Security: Never uses eval(). Never executes uploaded code.
 */

import { parse as parse5Parse } from 'parse5';
import postcss from 'postcss';

// ─── HTML ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} HtmlAnalysisResult
 * @property {string}   filePath
 * @property {number}   elementCount
 * @property {string[]} scriptSrcs        - src attributes of <script> tags
 * @property {string[]} stylesheetHrefs   - href attributes of <link rel="stylesheet"> tags
 * @property {string[]} metaNames         - name attributes of <meta> tags
 * @property {string[]} findings          - structured findings
 * @property {string|null} syntaxError
 */

/**
 * Parse and analyze an HTML file.
 *
 * @param {string} source       - HTML source text
 * @param {string} relativePath - Relative path (for findings)
 * @returns {HtmlAnalysisResult}
 */
export function analyzeHtml(source, relativePath) {
  const findings = [];
  let syntaxError = null;

  let document;
  try {
    document = parse5Parse(source, { sourceCodeLocationInfo: true });
  } catch (err) {
    syntaxError = err.message ?? 'HTML parse error';
    findings.push({
      type: 'syntaxError',
      filePath: relativePath,
      name: null,
      startLine: 1,
      endLine: 1,
      meta: { message: syntaxError },
    });
    return { filePath: relativePath, elementCount: 0, scriptSrcs: [], stylesheetHrefs: [], metaNames: [], findings, syntaxError };
  }

  let elementCount = 0;
  const scriptSrcs = [];
  const stylesheetHrefs = [];
  const metaNames = [];

  function walkHtml(node) {
    if (!node) return;

    if (node.nodeName && !node.nodeName.startsWith('#')) {
      elementCount++;
      const tagName = node.nodeName.toLowerCase();
      const attrs = node.attrs ?? [];

      if (tagName === 'script') {
        const src = attrs.find((a) => a.name === 'src')?.value;
        if (src) scriptSrcs.push(src);
        findings.push({
          type: 'htmlElement',
          filePath: relativePath,
          name: 'script',
          startLine: node.sourceCodeLocation?.startLine ?? 0,
          endLine: node.sourceCodeLocation?.endLine ?? 0,
          meta: { src: src ?? null, inline: !src },
        });
      } else if (tagName === 'link') {
        const rel = attrs.find((a) => a.name === 'rel')?.value?.toLowerCase();
        const href = attrs.find((a) => a.name === 'href')?.value;
        if (rel === 'stylesheet' && href) stylesheetHrefs.push(href);
      } else if (tagName === 'meta') {
        const name = attrs.find((a) => a.name === 'name')?.value;
        if (name) metaNames.push(name);
      }
    }

    for (const child of node.childNodes ?? []) {
      walkHtml(child);
    }
  }

  walkHtml(document);

  findings.push({
    type: 'htmlDocument',
    filePath: relativePath,
    name: relativePath,
    startLine: 1,
    endLine: 0,
    meta: { elementCount, scriptCount: scriptSrcs.length, stylesheetCount: stylesheetHrefs.length },
  });

  return { filePath: relativePath, elementCount, scriptSrcs, stylesheetHrefs, metaNames, findings, syntaxError };
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CssAnalysisResult
 * @property {string}   filePath
 * @property {number}   ruleCount
 * @property {number}   atRuleCount
 * @property {string[]} atRules        - @-rule names used (e.g. 'media', 'keyframes')
 * @property {object[]} findings
 * @property {string|null} syntaxError
 */

/**
 * Parse and analyze a CSS file.
 *
 * @param {string} source       - CSS source text
 * @param {string} relativePath
 * @returns {CssAnalysisResult}
 */
export function analyzeCss(source, relativePath) {
  const findings = [];
  let syntaxError = null;
  let ruleCount = 0;
  let atRuleCount = 0;
  const atRuleNames = new Set();

  let root;
  try {
    root = postcss.parse(source, { from: undefined });
  } catch (err) {
    syntaxError = err.message ?? 'CSS parse error';
    findings.push({
      type: 'syntaxError',
      filePath: relativePath,
      name: null,
      startLine: err.line ?? 1,
      endLine: err.line ?? 1,
      meta: { message: syntaxError },
    });
    return { filePath: relativePath, ruleCount: 0, atRuleCount: 0, atRules: [], findings, syntaxError };
  }

  root.walk((node) => {
    if (node.type === 'rule') {
      ruleCount++;
      findings.push({
        type: 'cssRule',
        filePath: relativePath,
        name: node.selector,
        startLine: node.source?.start?.line ?? 0,
        endLine: node.source?.end?.line ?? 0,
        meta: { selector: node.selector },
      });
    } else if (node.type === 'atrule') {
      atRuleCount++;
      atRuleNames.add(node.name);
      findings.push({
        type: 'cssAtRule',
        filePath: relativePath,
        name: `@${node.name}`,
        startLine: node.source?.start?.line ?? 0,
        endLine: node.source?.end?.line ?? 0,
        meta: { name: node.name, params: node.params },
      });
    }
  });

  return {
    filePath: relativePath,
    ruleCount,
    atRuleCount,
    atRules: [...atRuleNames],
    findings,
    syntaxError,
  };
}

export default { analyzeHtml, analyzeCss };
