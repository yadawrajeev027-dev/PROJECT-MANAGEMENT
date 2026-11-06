/**
 * typescriptAnalyzer.js
 * AST-based static analysis for TypeScript (.ts, .tsx) files using
 * @typescript-eslint/typescript-estree.
 *
 * Detects the same constructs as javascriptAnalyzer.js (functions, classes,
 * React components, Express routes, imports, exports, JSX, syntax errors)
 * plus TypeScript-specific constructs:
 *  - Interface declarations
 *  - Type alias declarations
 *  - Enum declarations
 *
 * Security: Never uses eval() or new Function(). Never executes uploaded code.
 */

import { parse as tsParse } from '@typescript-eslint/typescript-estree';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'all', 'use']);

/**
 * Parse and analyze a TypeScript/TSX source file.
 *
 * @param {string} source       - File source text
 * @param {string} relativePath - Relative path (for findings)
 * @param {object} [opts]
 * @param {boolean} [opts.isTSX]  - Whether to enable JSX parsing
 * @returns {{ findings: object[], syntaxError: string|null }}
 */
export function analyzeTypeScript(source, relativePath, opts = {}) {
  const findings = [];
  let syntaxError = null;

  const isTSX = opts.isTSX ?? /\.(tsx)$/i.test(relativePath);

  let ast;
  try {
    ast = tsParse(source, {
      jsx: isTSX || true, // enable JSX in both .ts and .tsx for safety
      loc: true,
      range: false,
      comment: false,
      tokens: false,
      errorOnUnknownASTType: false,
    });
  } catch (err) {
    syntaxError = err.message || 'TypeScript syntax error';
    const lineMatch = err.message?.match(/line (\d+)/i);
    const lineNo = lineMatch ? parseInt(lineMatch[1], 10) : 1;
    findings.push({
      type: 'syntaxError',
      filePath: relativePath,
      name: null,
      startLine: lineNo,
      endLine: lineNo,
      meta: { message: syntaxError },
    });
    return { findings, syntaxError };
  }

  // Walk the AST with a simple recursive visitor
  walkNode(ast, relativePath, findings, null);

  return { findings, syntaxError };
}

// ─── Recursive AST walker ────────────────────────────────────────────────────

function walkNode(node, relativePath, findings, parentNode) {
  if (!node || typeof node !== 'object') return;

  visitNode(node, relativePath, findings, parentNode);

  for (const key of Object.keys(node)) {
    if (key === 'parent') continue; // avoid cycles
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object' && item.type) {
          walkNode(item, relativePath, findings, node);
        }
      }
    } else if (child && typeof child === 'object' && child.type) {
      walkNode(child, relativePath, findings, node);
    }
  }
}

function visitNode(node, relativePath, findings, parentNode) {
  switch (node.type) {
    case 'ImportDeclaration': {
      const specifiers = (node.specifiers ?? []).map((s) => {
        if (s.type === 'ImportDefaultSpecifier') return { kind: 'default', local: s.local?.name };
        if (s.type === 'ImportNamespaceSpecifier') return { kind: 'namespace', local: s.local?.name };
        return { kind: 'named', local: s.local?.name, imported: s.imported?.name ?? s.imported?.value };
      });
      findings.push({
        type: 'import',
        filePath: relativePath,
        name: node.source?.value ?? '',
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: { source: node.source?.value, specifiers },
      });
      break;
    }

    case 'ExportNamedDeclaration': {
      findings.push({
        type: 'export',
        filePath: relativePath,
        name: getTSExportName(node),
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: { kind: 'named' },
      });
      break;
    }

    case 'ExportDefaultDeclaration': {
      findings.push({
        type: 'export',
        filePath: relativePath,
        name: getTSDefaultExportName(node),
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: { kind: 'default' },
      });
      break;
    }

    case 'FunctionDeclaration': {
      const name = node.id?.name ?? null;
      const isAsync = node.async ?? false;
      const hasJSX = subtreeHasJSX(node);
      const isReactComp = hasJSX && name && /^[A-Z]/.test(name);

      if (isReactComp) {
        findings.push({
          type: 'reactComponent',
          filePath: relativePath,
          name,
          startLine: node.loc?.start?.line ?? 0,
          endLine: node.loc?.end?.line ?? 0,
          meta: { kind: 'functionComponent', async: isAsync },
        });
      }

      findings.push({
        type: 'function',
        filePath: relativePath,
        name,
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: { async: isAsync, generator: node.generator ?? false, returnsJSX: hasJSX },
      });
      break;
    }

    case 'ArrowFunctionExpression': {
      const name = getVariableNameFromParent(parentNode);
      const isAsync = node.async ?? false;
      const hasJSX = subtreeHasJSX(node);
      const isReactComp = hasJSX && name && /^[A-Z]/.test(name);

      if (isReactComp) {
        findings.push({
          type: 'reactComponent',
          filePath: relativePath,
          name,
          startLine: node.loc?.start?.line ?? 0,
          endLine: node.loc?.end?.line ?? 0,
          meta: { kind: 'arrowFunctionComponent', async: isAsync },
        });
      }

      findings.push({
        type: 'arrowFunction',
        filePath: relativePath,
        name,
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: { async: isAsync, returnsJSX: hasJSX },
      });
      break;
    }

    case 'FunctionExpression': {
      if (parentNode?.type === 'MethodDefinition') break; // handled by class visitor
      const name = node.id?.name ?? getVariableNameFromParent(parentNode);
      findings.push({
        type: 'function',
        filePath: relativePath,
        name,
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: { kind: 'expression', async: node.async ?? false, returnsJSX: subtreeHasJSX(node) },
      });
      break;
    }

    case 'ClassDeclaration':
    case 'ClassExpression': {
      const name = node.id?.name ?? null;
      const superClass = getSuperClassName(node);
      const isReactComp = superClass === 'Component' || superClass === 'PureComponent' ||
                          superClass === 'React.Component' || superClass === 'React.PureComponent';

      if (isReactComp) {
        findings.push({
          type: 'reactComponent',
          filePath: relativePath,
          name: name ?? 'AnonymousClass',
          startLine: node.loc?.start?.line ?? 0,
          endLine: node.loc?.end?.line ?? 0,
          meta: { kind: 'classComponent' },
        });
      } else {
        findings.push({
          type: 'class',
          filePath: relativePath,
          name,
          startLine: node.loc?.start?.line ?? 0,
          endLine: node.loc?.end?.line ?? 0,
          meta: { superClass },
        });
      }

      // Class methods
      for (const member of node.body?.body ?? []) {
        if (member.type === 'MethodDefinition' || member.type === 'TSAbstractMethodDefinition') {
          const methodName = member.key?.name ?? '(computed)';
          findings.push({
            type: 'classMethod',
            filePath: relativePath,
            name: `${name ?? '(anonymous)'}.${methodName}`,
            startLine: member.loc?.start?.line ?? 0,
            endLine: member.loc?.end?.line ?? 0,
            meta: { static: member.static ?? false, kind: member.kind },
          });
        }
      }
      break;
    }

    case 'TSInterfaceDeclaration': {
      findings.push({
        type: 'tsInterface',
        filePath: relativePath,
        name: node.id?.name ?? null,
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: {},
      });
      break;
    }

    case 'TSTypeAliasDeclaration': {
      findings.push({
        type: 'tsTypeAlias',
        filePath: relativePath,
        name: node.id?.name ?? null,
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: {},
      });
      break;
    }

    case 'TSEnumDeclaration': {
      findings.push({
        type: 'tsEnum',
        filePath: relativePath,
        name: node.id?.name ?? null,
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: {},
      });
      break;
    }

    case 'JSXElement': {
      findings.push({
        type: 'jsxElement',
        filePath: relativePath,
        name: getJSXElementName(node),
        startLine: node.loc?.start?.line ?? 0,
        endLine: node.loc?.end?.line ?? 0,
        meta: {},
      });
      break;
    }

    case 'CallExpression': {
      const route = extractExpressRoute(node, relativePath);
      if (route) findings.push(route);
      break;
    }

    default:
      break;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getVariableNameFromParent(parent) {
  if (!parent) return null;
  if (parent.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
    return parent.id.name;
  }
  if (parent.type === 'AssignmentExpression' && parent.left?.type === 'Identifier') {
    return parent.left.name;
  }
  if (parent.type === 'Property' && parent.key?.type === 'Identifier') {
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

function getJSXElementName(node) {
  const name = node.openingElement?.name;
  if (!name) return null;
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression') return `${name.object?.name}.${name.property?.name}`;
  return null;
}

function getTSExportName(node) {
  if (node.declaration) {
    if (node.declaration.id?.name) return node.declaration.id.name;
    if (node.declaration.declarations?.[0]?.id?.name) return node.declaration.declarations[0].id.name;
  }
  if (node.specifiers?.length) {
    return node.specifiers.map((s) => s.exported?.name ?? s.exported?.value).join(', ');
  }
  return null;
}

function getTSDefaultExportName(node) {
  const decl = node.declaration;
  if (!decl) return 'default';
  if (decl.type === 'Identifier') return decl.name;
  if (decl.id?.name) return decl.id.name;
  return 'default';
}

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

  const lowerObj = objName.toLowerCase();
  const isExpressLike =
    lowerObj === 'app' || lowerObj === 'router' ||
    lowerObj.includes('router') || lowerObj.includes('route') ||
    lowerObj === 'api' || lowerObj === 'server';

  if (!isExpressLike) return null;

  const firstArg = callNode.arguments?.[0];
  let routePath = null;
  if (firstArg?.type === 'Literal') routePath = firstArg.value;
  else if (firstArg?.type === 'TemplateLiteral') routePath = '(template literal)';

  return {
    type: 'expressRoute',
    filePath: relativePath,
    name: routePath ?? '(dynamic)',
    startLine: callNode.loc?.start?.line ?? 0,
    endLine: callNode.loc?.end?.line ?? 0,
    meta: { object: objName, method: methodName.toUpperCase(), path: routePath, uncertain: !routePath },
  };
}

/**
 * Lightweight check whether a node subtree contains any JSX element.
 * Used to identify React components without a full second traversal.
 * Stops as soon as a JSX node is found.
 */
function subtreeHasJSX(node, _depth = 0) {
  if (!node || typeof node !== 'object' || _depth > 20) return false;
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object' && item.type && subtreeHasJSX(item, _depth + 1)) return true;
      }
    } else if (child && typeof child === 'object' && child.type) {
      if (subtreeHasJSX(child, _depth + 1)) return true;
    }
  }
  return false;
}

export default { analyzeTypeScript };
