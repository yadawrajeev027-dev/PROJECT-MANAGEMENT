/**
 * ProjectPulse AI - Markdown Requirements Parser
 * 
 * Accurately extracts functional requirements from PROJECT_REQUIREMENTS.md,
 * requirements.md, SRS, or specification files without hardcoding.
 * Supports multiple standard markdown structures:
 * 1. Headings (### REQ-01: Title \n Description: ... \n Priority: ... \n Weight: ...)
 * 2. Markdown Tables (| Req ID | Title | Description | Priority | Weight |)
 * 3. Checklists (- [ ] REQ-01: Title - Description)
 * 4. Numbered Lists (1. **Title**: Description)
 */

export function parseRequirementsMarkdown(markdownText = '') {
  if (!markdownText || typeof markdownText !== 'string') {
    return [];
  }

  const text = markdownText.replace(/\r\n/g, '\n').trim();
  const requirements = [];

  // 1. Try Markdown Table Format: | ID | Title | Description | Priority | Weight |
  const tableRows = text.split('\n').filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
  if (tableRows.length >= 3) {
    const headerLine = tableRows[0].toLowerCase();
    if (headerLine.includes('req') || headerLine.includes('title') || headerLine.includes('requirement')) {
      const headers = tableRows[0].split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
      // Skip row 1 (separator |---|---|)
      for (let i = 2; i < tableRows.length; i++) {
        const cols = tableRows[i].split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cols.length >= 2) {
          const idIdx = headers.findIndex(h => h.includes('id') || h.includes('req'));
          const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('feature') || h.includes('name'));
          const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('spec') || h.includes('detail'));
          const priorityIdx = headers.findIndex(h => h.includes('prior'));
          const weightIdx = headers.findIndex(h => h.includes('weight') || h.includes('point') || h.includes('score'));

          const id = idIdx !== -1 && cols[idIdx] ? cols[idIdx].replace(/[*`_]/g, '').trim() : `REQ-${String(requirements.length + 1).padStart(3, '0')}`;
          const title = titleIdx !== -1 && cols[titleIdx] ? cols[titleIdx].replace(/[*`_]/g, '').trim() : cols[0].replace(/[*`_]/g, '').trim();
          const description = descIdx !== -1 && cols[descIdx] ? cols[descIdx].replace(/[*`_]/g, '').trim() : '';
          const priorityRaw = priorityIdx !== -1 && cols[priorityIdx] ? cols[priorityIdx].replace(/[*`_]/g, '').trim() : 'Medium';
          const weightRaw = weightIdx !== -1 && cols[weightIdx] ? parseInt(cols[weightIdx].replace(/[^0-9]/g, ''), 10) : 10;

          if (title && !title.includes('---')) {
            requirements.push({
              id: id || `REQ-${String(requirements.length + 1).padStart(3, '0')}`,
              title,
              description: description || title,
              priority: normalizePriority(priorityRaw),
              weight: Number.isFinite(weightRaw) && weightRaw > 0 ? weightRaw : 10,
              status: 'Pending',
              evidence: 'Awaiting AST parser extraction.',
            });
          }
        }
      }

      if (requirements.length > 0) {
        return normalizeWeights(requirements);
      }
    }
  }

  // 2. Try Heading Format: ### REQ-XX: Title or ## Requirement XX: Title
  const headingRegex = /^(?:#{2,4})\s*(?:(?:\*\*)?(REQ[-_]?[0-9A-Z]+|(?:Requirement|Feature)\s*[-_:]?\s*[0-9A-Z]+)(?:\*\*)?[:\s-]+)?([^\n]+)/gim;
  let match;
  const headingMatches = [];

  while ((match = headingRegex.exec(text)) !== null) {
    const rawId = match[1] ? match[1].replace(/[*`_]/g, '').trim() : null;
    const rawTitle = match[2] ? match[2].replace(/[*`_#]/g, '').trim() : '';
    
    // Ignore meta headings like "Functional Requirements", "Overview", etc.
    const isMetaHeading = /^(functional requirements|non-functional requirements|requirements|specifications|functional specifications|project overview|introduction|architecture|tech stack|milestones|project requirements|background|scope)$/i.test(rawTitle);
    if (!isMetaHeading && rawTitle.length > 2) {
      headingMatches.push({
        index: match.index,
        endIndex: match.index + match[0].length,
        rawId,
        rawTitle,
      });
    }
  }

  if (headingMatches.length > 0) {
    for (let i = 0; i < headingMatches.length; i++) {
      const current = headingMatches[i];
      const nextIndex = i + 1 < headingMatches.length ? headingMatches[i + 1].index : text.length;
      const body = text.substring(current.endIndex, nextIndex).trim();

      const descMatch = body.match(/(?:description|spec|details?|summary):\s*([^\n]+(?:\n(?!(?:priority|weight|status|evidence):)[^\n]+)*)/i);
      const priorityMatch = body.match(/(?:priority):\s*([a-z]+)/i);
      const weightMatch = body.match(/(?:weight|points?):\s*([0-9]+)/i);

      let cleanTitle = current.rawTitle;
      let finalId = current.rawId;

      // Extract ID if embedded in title, e.g. "REQ-1: User Authentication"
      const idTitleMatch = cleanTitle.match(/^(REQ[-_]?[0-9A-Z]+)[:\s-]+(.+)$/i);
      if (idTitleMatch) {
        finalId = idTitleMatch[1];
        cleanTitle = idTitleMatch[2].trim();
      }

      // If heading has no REQ- id and no structured requirement fields in body, it's a section header, not a requirement
      const hasReqDetails = descMatch || priorityMatch || weightMatch;
      if (!finalId && !hasReqDetails) {
        continue;
      }

      if (!finalId) {
        finalId = `REQ-${String(requirements.length + 1).padStart(3, '0')}`;
      } else if (!finalId.toUpperCase().startsWith('REQ')) {
        finalId = `REQ-${finalId.replace(/[^0-9A-Z]/gi, '')}`;
      }

      const description = descMatch ? descMatch[1].replace(/[*`_]/g, '').trim() : body.split('\n')[0]?.replace(/[*`_]/g, '').trim() || cleanTitle;
      const priority = priorityMatch ? normalizePriority(priorityMatch[1]) : extractPriorityFromText(body);
      const weight = weightMatch ? parseInt(weightMatch[1], 10) : extractWeightFromText(body) || 10;

      requirements.push({
        id: finalId.toUpperCase(),
        title: cleanTitle,
        description: description || cleanTitle,
        priority: normalizePriority(priority),
        weight: Number.isFinite(weight) && weight > 0 ? weight : 10,
        status: 'Pending',
        evidence: 'Awaiting AST parser extraction.',
      });
    }

    if (requirements.length > 0) {
      return normalizeWeights(requirements);
    }
  }

  // 3. Try Checklists: - [ ] REQ-1: Title (Priority: High, Weight: 20)
  const checklistRegex = /^[-*]\s*\[[\sxX]\]\s*(?:(?:\*\*)?(REQ[-_]?[0-9A-Z]+)(?:\*\*)?[:\s-]+)?([^\n]+)/gim;
  let chkMatch;
  while ((chkMatch = checklistRegex.exec(text)) !== null) {
    const rawId = chkMatch[1] ? chkMatch[1].replace(/[*`_]/g, '').trim() : null;
    let content = chkMatch[2] ? chkMatch[2].trim() : '';

    const priorityMatch = content.match(/\((?:priority:\s*)?(high|medium|low)\)/i);
    const weightMatch = content.match(/(?:weight:\s*|points?:\s*|pts:\s*)([0-9]+)/i);

    let title = content.replace(/\([^)]+\)/g, '').replace(/[*`_]/g, '').trim();
    let id = rawId;

    const idTitleMatch = title.match(/^(REQ[-_]?[0-9A-Z]+)[:\s-]+(.+)$/i);
    if (idTitleMatch) {
      id = idTitleMatch[1];
      title = idTitleMatch[2].trim();
    }

    if (!id) {
      id = `REQ-${String(requirements.length + 1).padStart(3, '0')}`;
    }

    // Split title and description if separated by " - " or ": "
    let description = title;
    const splitDash = title.split(/\s+[-—]\s+/);
    if (splitDash.length >= 2) {
      title = splitDash[0].trim();
      description = splitDash.slice(1).join(' - ').trim();
    }

    requirements.push({
      id: id.toUpperCase(),
      title,
      description: description || title,
      priority: priorityMatch ? normalizePriority(priorityMatch[1]) : 'Medium',
      weight: weightMatch ? parseInt(weightMatch[1], 10) : 10,
      status: 'Pending',
      evidence: 'Awaiting AST parser extraction.',
    });
  }

  if (requirements.length > 0) {
    return normalizeWeights(requirements);
  }

  // 4. Try Numbered Lists: 1. **Title**: Description
  const numberedListRegex = /^[0-9]+\.\s*(?:\*\*(.*?)\*\*|([^\n:]+))(?::\s*|\s*-\s*)([^\n]+)/gim;
  let numMatch;
  let numIdx = 1;
  while ((numMatch = numberedListRegex.exec(text)) !== null) {
    const title = (numMatch[1] || numMatch[2] || '').replace(/[*`_]/g, '').trim();
    const description = (numMatch[3] || '').replace(/[*`_]/g, '').trim();

    if (title && title.length > 2) {
      requirements.push({
        id: `REQ-${String(numIdx).padStart(3, '0')}`,
        title,
        description: description || title,
        priority: extractPriorityFromText(description),
        weight: extractWeightFromText(description) || 10,
        status: 'Pending',
        evidence: 'Awaiting AST parser extraction.',
      });
      numIdx++;
    }
  }

  return normalizeWeights(requirements);
}

function normalizePriority(val) {
  if (!val) return 'Medium';
  const lower = String(val).toLowerCase().trim();
  if (lower.includes('high') || lower.includes('crit') || lower.includes('p1')) return 'High';
  if (lower.includes('low') || lower.includes('minor') || lower.includes('p3')) return 'Low';
  return 'Medium';
}

function extractPriorityFromText(text) {
  if (!text) return 'Medium';
  if (/high\s*priority|priority:\s*high|critical/i.test(text)) return 'High';
  if (/low\s*priority|priority:\s*low|minor/i.test(text)) return 'Low';
  return 'Medium';
}

function extractWeightFromText(text) {
  if (!text) return null;
  const match = text.match(/(?:weight|points?|pts):\s*([0-9]+)/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

function normalizeWeights(reqs) {
  if (!reqs || reqs.length === 0) return [];
  const currentTotal = reqs.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  // If weights aren't set or total is 0, give each an equal slice totaling 100
  if (currentTotal === 0 || currentTotal === reqs.length * 10) {
    const slice = Math.floor(100 / reqs.length);
    const remainder = 100 - (slice * reqs.length);
    return reqs.map((r, idx) => ({
      ...r,
      weight: idx === 0 ? slice + remainder : slice,
    }));
  }
  return reqs;
}
