/**
 * javascriptAnalyzer.js
 * AST-based static analysis for JavaScript (.js, .jsx, .mjs, .cjs) files
 * using @babel/parser + @babel/traverse.
 *
 * Detects:
 *  - Function declarations, arrow functions, function expressions
 *  - Classes (and class methods)
 *  - Import / export declarations
 *  - Variable declarations
 *  - React functional components (capitalized name + JSX return)
 *  - React class components (extends React.Component / Component)
 *  - Express route declarations (app.get, router.post, etc.)
 *  - JSX elements
 *  - Syntax errors
 *
 * Security: Never uses eval() or new Function(). Never executes uploaded code.
 */

import { parse as babelParse } from '@babel/parser';
import _traverse from '@babel/traverse';

// @babel/traverse ships as a CommonJS module; handle both ESM and CJS interop
const traverse = _traverse.default ?? _traverse;

// HTTP verbs recognized for Express route detection
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'all', 'use']);

/**
 * @typedef {Object} AnalysisFinding
 * @property {string}  type        - 'function' | 'arrowFunction' | 'class' | 'classMethod' | 'import' | 'export' | 'reactComponent' | 'expressRoute' | 'jsxElement' | 'syntaxError'
 * @property {string}  filePath    - Relative file path
 * @property {string}  [name]      - Identifier name when available
 * @property {number}  startLine
 * @property {number}  endLine
 * @property {object}  [meta]      - Additional metadata
 */

/**
 * Parse and analyze a JavaScript/JSX source file.
 *
 * @param {string} source       - File source text
 * @param {string} relativePath - Relative path (for findings)
 * @param {object} [opts]
 * @param {boolean} [opts.isJSX]  - Force JSX plugin
 * @returns {{ findings: AnalysisFinding[], syntaxError: string|null }}
 */
export function analyzeJavaScript(source, relativePath, opts = {}) {
  const findings = [];
  let syntaxError = null;

  const isJSX = opts.isJSX ?? /\.(jsx)$/i.test(relativePath);

  let ast;
  try {
    ast = babelParse(source, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      allowSuperOutsideMethod: true,
      allowUndeclaredExports: true,
      errorRecovery: false,
      plugins: [
        'jsx',
        'decorators-legacy',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'importAttributes',
      ],
    });
  } catch (err) {
    try {
      ast = babelParse(source, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        allowSuperOutsideMethod: true,
        allowUndeclaredExports: true,
        errorRecovery: false,
        plugins: ['jsx', 'exportDefaultFrom', 'exportNamespaceFrom'],
      });
    } catch (err2) {
      syntaxError = err.message || err2.message || 'Syntax error';
      const loc = err.loc || err2.loc;
      findings.push({
        type: 'syntaxError',
        filePath: relativePath,
        name: null,
        startLine: loc?.line ?? 1,
        endLine: loc?.line ?? 1,
        meta: { message: syntaxError },
      });
      return { findings, syntaxError };
    }
  }

  // ── Track which function nodes return JSX (for React component detection) ──
  const jsxReturningNodes = new Set();

  // ── Collect JSX elements ─────────────────────────────────────────────────
  traverse(ast, {
    JSXElement(nodePath) {
      findings.push({
        type: 'jsxElement',
        filePath: relativePath,
        name: getJSXElementName(nodePath.node),
        startLine: nodePath.node.loc?.start?.line ?? 0,
        endLine: nodePath.node.loc?.end?.line ?? 0,
        meta: {},
      });
      // Mark ancestor function as JSX-returning
      let parent = nodePath.parentPath;
      while (parent) {
        if (
          parent.isFunctionDeclaration() ||
          parent.isArrowFunctionExpression() ||
          parent.isFunctionExpression() ||
          parent.isClassMethod()
        ) {
          jsxReturningNodes.add(parent.node);
          break;
        }
        parent = parent.parentPath;
      }
    },
  });

  // ── Collect React class components ───────────────────────────────────────
  const reactClassNodes = new Set();
  traverse(ast, {
    ClassDeclaration(nodePath) {
      if (isReactClassComponent(nodePath.node)) {
        reactClassNodes.add(nodePath.node);
        findings.push({
          type: 'reactComponent',
          filePath: relativePath,
          name: nodePath.node.id?.name ?? 'AnonymousClass',
          startLine: nodePath.node.loc?.start?.line ?? 0,
          endLine: nodePath.node.loc?.end?.line ?? 0,
          meta: { kind: 'classComponent' },
        });
      }
    },
    ClassExpression(nodePath) {
      if (isReactClassComponent(nodePath.node)) {
        reactClassNodes.add(nodePath.node);
        findings.push({
          type: 'reactComponent',
          filePath: relativePath,
          name: nodePath.node.id?.name ?? 'AnonymousClass',
          startLine: nodePath.node.loc?.start?.line ?? 0,
          endLine: nodePath.node.loc?.end?.line ?? 0,
          meta: { kind: 'classComponent' },
        });
      }
    },
  });

  // ── Main traversal ───────────────────────────────────────────────────────
  traverse(ast, {
    // Import declarations
    ImportDeclaration(nodePath) {
      const specifiers = nodePath.node.specifiers.map((s) => {
        if (s.type === 'ImportDefaultSpecifier') return { kind: 'default', local: s.local.name };
        if (s.type === 'ImportNamespaceSpecifier') return { kind: 'namespace', local: s.local.name };
        return { kind: 'named', local: s.local?.name, imported: s.imported?.name ?? s.imported?.value };
      });
      findings.push({
        type: 'import',
        filePath: relativePath,
        name: nodePath.node.source.value,
        startLine: nodePath.node.loc?.start?.line ?? 0,
        endLine: nodePath.node.loc?.end?.line ?? 0,
        meta: { source: nodePath.node.source.value, specifiers },
      });
    },

    // Export declarations
    ExportNamedDeclaration(nodePath) {
      findings.push({
        type: 'export',
        filePath: relativePath,
        name: getExportName(nodePath.node),
        startLine: nodePath.node.loc?.start?.line ?? 0,
        endLine: nodePath.node.loc?.end?.line ?? 0,
        meta: { kind: 'named' },
      });
    },
    ExportDefaultDeclaration(nodePath) {
      findings.push({
        type: 'export',
        filePath: relativePath,
        name: getDefaultExportName(nodePath.node),
        startLine: nodePath.node.loc?.start?.line ?? 0,
        endLine: nodePath.node.loc?.end?.line ?? 0,
        meta: { kind: 'default' },
      });
    },

    // Function declarations
    FunctionDeclaration(nodePath) {
      const name = nodePath.node.id?.name ?? null;
      const isAsync = nodePath.node.async;
      const isGenerator = nodePath.node.generator;
      const returnsJSX = jsxReturningNodes.has(nodePath.node);
      const isReactComp = returnsJSX && name && /^[A-Z]/.test(name);

      if (isReactComp) {
        findings.push({
          type: 'reactComponent',
          filePath: relativePath,
          name,
          startLine: nodePath.node.loc?.start?.line ?? 0,
          endLine: nodePath.node.loc?.end?.line ?? 0,
          meta: { kind: 'functionComponent', async: isAsync },
        });
      }

      findings.push({
        type: 'function',
        filePath: relativePath,
        name,
        startLine: nodePath.node.loc?.start?.line ?? 0,
        endLine: nodePath.node.loc?.end?.line ?? 0,
        meta: { async: isAsync, generator: isGenerator, returnsJSX },
      });
    },

    // Arrow functions
    ArrowFunctionExpression(nodePath) {
      const name = getVariableName(nodePath);
      const isAsync = nodePath.node.async;
      const returnsJSX = jsxReturningNodes.has(nodePath.node);
      const isReactComp = returnsJSX && name && /^[A-Z]/.test(name);

      if (isReactComp) {
        findings.push({
          type: 'reactComponent',
          filePath: relativePath,
          name,
          startLine: nodePath.node.loc?.start?.line ?? 0,
          endLine: nodePath.node.loc?.end?.line ?? 0,
          meta: { kind: 'arrowFunctionComponent', async: isAsync },
        });
      }

      findings.push({
        type: 'arrowFunction',
        filePath: relativePath,
        name,
        startLine: nodePath.node.loc?.start?.line ?? 0,
        endLine: nodePath.node.loc?.end?.line ?? 0,
        meta: { async: isAsync, returnsJSX },
      });
    },

    // Function expressions (named and anonymous)
    FunctionExpression(nodePath) {
      // Skip class method bodies
      if (nodePath.parentPath?.isClassMethod()) return;
      const name = nodePath.node.id?.name ?? getVariableName(nodePath);
      const isAsync = nodePath.node.async;
      const returnsJSX = jsxReturningNodes.has(nodePath.node);

      findings.push({
        type: 'function',
        filePath: relativePath,
        name,
        startLine: nodePath.node.loc?.start?.line ?? 0,
        endLine: nodePath.node.loc?.end?.line ?? 0,
        meta: { kind: 'expression', async: isAsync, returnsJSX },
      });
    },

    // Class declarations
    ClassDeclaration(nodePath) {
      if (reactClassNodes.has(nodePath.node)) return; // already reported
      const name = nodePath.node.id?.name ?? null;
      findings.push({
        type: 'class',
        filePath: relativePath,
        name,
        startLine: nodePath.node.loc?.start?.line ?? 0,
        endLine: nodePath.node.loc?.end?.line ?? 0,
        meta: { superClass: getSuperClassName(nodePath.node) },
      });
      // Record class methods
      for (const member of nodePath.node.body?.body ?? []) {
        if (member.type === 'ClassMethod' || member.type === 'ClassPrivateMethod') {
          const methodName = member.key?.name ?? member.key?.id?.name ?? '(computed)';
          findings.push({
            type: 'classMethod',
            filePath: relativePath,
            name: `${name ?? '(anonymous)'}.${methodName}`,
            startLine: member.loc?.start?.line ?? 0,
            endLine: member.loc?.end?.line ?? 0,
            meta: { static: member.static, kind: member.kind, async: member.value?.async ?? false },
          });
        }
      }
    },

    // Express route detection: app.get(...), router.post(...), etc.
    CallExpression(nodePath) {
      const route = extractExpressRoute(nodePath.node, relativePath);
      if (route) findings.push(route);
    },
  });

  return { findings, syntaxError };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getVariableName(nodePath) {
  const parent = nodePath.parent;
  if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
    return parent.id.name;
  }
  if (parent?.type === 'AssignmentExpression' && parent.left?.type === 'Identifier') {
    return parent.left.name;
  }
  if (parent?.type === 'Property' && parent.key?.type === 'Identifier') {
    return parent.key.name;
  }
  return null;
}

function getSuperClassName(classNode) {
  if (!classNode.superClass) return null;
  if (classNode.superClass.type === 'Identifier') return classNode.superClass.name;
  if (classNode.superClass.type === 'MemberExpression') {
    return `${classNode.superClass.object?.name}.${classNode.superClass.property?.name}`;
  }
  return null;
}

function isReactClassComponent(classNode) {
  const superClass = getSuperClassName(classNode);
  return superClass === 'Component' || superClass === 'PureComponent' ||
         superClass === 'React.Component' || superClass === 'React.PureComponent';
}

function getJSXElementName(node) {
  const opening = node.openingElement;
  if (!opening) return null;
  const name = opening.name;
  if (name?.type === 'JSXIdentifier') return name.name;
  if (name?.type === 'JSXMemberExpression') {
    return `${name.object?.name}.${name.property?.name}`;
  }
  return null;
}

function getExportName(node) {
  if (node.declaration) {
    if (node.declaration.type === 'FunctionDeclaration') return node.declaration.id?.name ?? null;
    if (node.declaration.type === 'ClassDeclaration') return node.declaration.id?.name ?? null;
    if (node.declaration.type === 'VariableDeclaration') {
      return node.declaration.declarations?.[0]?.id?.name ?? null;
    }
  }
  if (node.specifiers?.length) {
    return node.specifiers.map((s) => s.exported?.name ?? s.exported?.value).join(', ');
  }
  return null;
}

function getDefaultExportName(node) {
  const decl = node.declaration;
  if (!decl) return 'default';
  if (decl.type === 'Identifier') return decl.name;
  if (decl.type === 'FunctionDeclaration') return decl.id?.name ?? 'default';
  if (decl.type === 'ClassDeclaration') return decl.id?.name ?? 'default';
  return 'default';
}

/**
 * Detect Express route patterns:
 *   app.get('/path', handler)
 *   router.post('/path', handler)
 *   app.use('/path', router)
 */
function extractExpressRoute(callNode, relativePath) {
  const callee = callNode.callee;
  if (callee?.type !== 'MemberExpression') return null;

  const obj = callee.object;
  const method = callee.property;

  if (!obj || !method) return null;

  const objName = obj.type === 'Identifier' ? obj.name : null;
  const methodName = method.type === 'Identifier' ? method.name : null;

  if (!objName || !methodName) return null;
  if (!HTTP_METHODS.has(methodName.toLowerCase())) return null;

  // Object must look like a router/app variable (heuristic: 'router', 'app', 'api', 'Route')
  const lowerObj = objName.toLowerCase();
  const isExpressLike =
    lowerObj === 'app' ||
    lowerObj === 'router' ||
    lowerObj.includes('router') ||
    lowerObj.includes('route') ||
    lowerObj === 'api' ||
    lowerObj === 'server';

  if (!isExpressLike) return null;

  // Extract the route path from the first argument if it's a string literal
  const firstArg = callNode.arguments?.[0];
  let routePath = null;
  if (firstArg?.type === 'StringLiteral') routePath = firstArg.value;
  else if (firstArg?.type === 'TemplateLiteral') routePath = '(template literal)';

  return {
    type: 'expressRoute',
    filePath: relativePath,
    name: routePath ?? '(dynamic)',
    startLine: callNode.loc?.start?.line ?? 0,
    endLine: callNode.loc?.end?.line ?? 0,
    meta: {
      object: objName,
      method: methodName.toUpperCase(),
      path: routePath,
      uncertain: !routePath,
    },
  };
}

export default { analyzeJavaScript };
