import React, { useState, useMemo } from 'react';
import { 
  ListChecks, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle,
  FileCode2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Code2,
  Layers
} from 'lucide-react';

export default function RequirementTable({ requirements = [], onToggleStatus }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReqId, setExpandedReqId] = useState(null);

  const statuses = ['ALL', 'Pending', 'Verified', 'Partial', 'Not Found', 'Needs Review'];
  const priorities = ['ALL', 'High', 'Medium', 'Low'];

  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      const q = searchQuery.toLowerCase().trim();
      const reqId = (req.requirementCode || req.id || '').toLowerCase();
      const evidenceText = typeof req.evidence === 'string'
        ? req.evidence.toLowerCase()
        : Array.isArray(req.evidence)
        ? req.evidence.map((e) => `${e.filePath} ${e.explanation}`).join(' ').toLowerCase()
        : '';

      const matchesSearch =
        !q ||
        reqId.includes(q) ||
        req.title.toLowerCase().includes(q) ||
        (req.description && req.description.toLowerCase().includes(q)) ||
        (req.explanation && req.explanation.toLowerCase().includes(q)) ||
        evidenceText.includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (req.status || 'Pending').toLowerCase().replace('_', ' ') === statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === 'ALL' ||
        (req.priority || 'medium').toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requirements, searchQuery, statusFilter, priorityFilter]);

  const getStatusBadge = (status = 'Pending') => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'not_found':
      case 'not found':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'needs_review':
      case 'needs review':
        return 'bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]';
      case 'pending':
      default:
        return 'bg-[#F7F7F5] text-[#777777] border border-[#EAEAEA]';
    }
  };

  const getStatusLabel = (status = 'Pending') => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'verified': return 'Verified';
      case 'partial': return 'Partial';
      case 'not_found': return 'Not Found';
      case 'needs_review': return 'Needs Review';
      case 'pending':
      default: return 'Pending';
    }
  };

  const getStatusIcon = (status = 'Pending') => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'verified':
        return <CheckCircle2 size={13} className="text-emerald-600" />;
      case 'partial':
        return <Clock size={13} className="text-amber-600" />;
      case 'not_found':
      case 'not found':
        return <AlertCircle size={13} className="text-rose-600" />;
      case 'needs_review':
      case 'needs review':
        return <HelpCircle size={13} className="text-[#171717]" />;
      case 'pending':
      default:
        return <Clock size={13} className="text-[#777777]" />;
    }
  };

  const getPriorityBadge = (priority = 'Medium') => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'low':
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (typeof confidence !== 'number') return null;
    if (confidence >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (confidence >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const toggleExpand = (reqId) => {
    setExpandedReqId((prev) => (prev === reqId ? null : reqId));
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-sm space-y-5">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              Requirements Implementation Matrix
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
              {filteredRequirements.length} of {requirements.length}
            </span>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Verified AST source code artifacts and evidence matched against requirement specifications
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, keyword, file path or explanation..."
            className="w-full bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl pl-9 pr-3 py-2 text-xs text-[#171717] placeholder-[#777777] focus:outline-none focus:bg-white focus:border-[#F5C400]"
          />
        </div>

        {/* Status and Priority Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] overflow-x-auto">
            {statuses.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-[#080808] text-white shadow-sm'
                    : 'text-[#777777] hover:text-[#171717]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#F7F7F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:bg-white focus:border-[#F5C400] cursor-pointer"
          >
            {priorities.map((pr) => (
              <option key={pr} value={pr} className="bg-white text-[#171717]">
                {pr === 'ALL' ? 'All Priorities' : `${pr} Priority`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        {filteredRequirements.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[11px] font-semibold text-[#777777] uppercase tracking-wider bg-[#F7F7F5]">
                <th className="py-3 px-3">Req ID</th>
                <th className="py-3 px-4 min-w-[220px]">Requirement &amp; Specification</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Weight</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-4 min-w-[240px]">AST Verification Evidence</th>
                <th className="py-3 px-2 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filteredRequirements.map((req) => {
                const reqKey = req.id || req.requirementCode;
                const isExpanded = expandedReqId === reqKey;
                const evidenceList = Array.isArray(req.evidence) ? req.evidence : [];
                const hasDetailedEvidence = evidenceList.length > 0;

                return (
                  <React.Fragment key={reqKey}>
                    <tr className={`hover:bg-[#F7F7F5] transition-colors group ${isExpanded ? 'bg-[#F7F7F5]' : ''}`}>
                      {/* ID */}
                      <td className="py-3 px-3 font-mono font-bold text-[#171717] text-[11px] whitespace-nowrap">
                        {req.requirementCode || req.id}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#171717]">
                          {req.title}
                        </div>
                        {req.description && (
                          <div className="text-[11px] text-[#777777] mt-0.5 line-clamp-2">
                            {req.description}
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(req.priority)}`}>
                          {req.priority || 'medium'}
                        </span>
                      </td>

                      {/* Weight */}
                      <td className="py-3 px-3 font-mono font-bold text-[#171717] text-[11px]">
                        {req.weight} pts
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {onToggleStatus ? (
                          <button
                            type="button"
                            onClick={() => onToggleStatus(reqKey)}
                            title="Click to cycle status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap transition-transform active:scale-95 cursor-pointer hover:brightness-105 ${getStatusBadge(req.status)}`}
                          >
                            {getStatusIcon(req.status)}
                            <span>{getStatusLabel(req.status)}</span>
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${getStatusBadge(req.status)}`}>
                            {getStatusIcon(req.status)}
                            <span>{getStatusLabel(req.status)}</span>
                          </span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {typeof req.confidence === 'number' && req.confidence > 0 ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getConfidenceBadge(req.confidence)}`}>
                            <ShieldCheck size={11} />
                            {req.confidence}%
                          </span>
                        ) : (
                          <span className="text-[#777777] text-[11px] font-mono">-</span>
                        )}
                      </td>

                      {/* Evidence Summary / Explanation */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 text-[11px] text-[#171717] bg-[#F7F7F5] p-2 rounded-lg border border-[#EAEAEA]">
                          {req.explanation && (
                            <div className="text-[#171717] font-medium leading-snug">
                              {req.explanation}
                            </div>
                          )}
                          {hasDetailedEvidence ? (
                            <div className="flex items-center gap-1.5 text-[#777777] font-mono text-[10px] truncate">
                              <FileCode2 size={12} className="text-[#F5C400] shrink-0" />
                              <span>{evidenceList[0].filePath} (L{evidenceList[0].lineStart || 1})</span>
                              {evidenceList.length > 1 && (
                                <span className="text-[#171717] font-semibold">+{evidenceList.length - 1} more</span>
                              )}
                            </div>
                          ) : typeof req.evidence === 'string' && req.evidence ? (
                            <div className="flex items-start gap-1.5 text-[#777777]">
                              <FileCode2 size={12} className="text-[#F5C400] shrink-0 mt-0.5" />
                              <span className="leading-snug">{req.evidence}</span>
                            </div>
                          ) : (
                            <span className="text-[#777777] italic">No AST evidence recorded yet.</span>
                          )}
                        </div>
                      </td>

                      {/* Inspect Evidence Button */}
                      <td className="py-3 px-2 text-center">
                        {hasDetailedEvidence ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(reqKey)}
                            title={isExpanded ? 'Collapse evidence' : 'Inspect detailed evidence'}
                            className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-white transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        ) : (
                          <span className="text-[#777777]">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Collapsible Evidence Inspector Drawer */}
                    {isExpanded && hasDetailedEvidence && (
                      <tr className="bg-[#F7F7F5] border-b border-[#EAEAEA] animate-in fade-in">
                        <td colSpan={8} className="p-4 sm:p-5">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers size={14} className="text-[#F5C400]" />
                                <span className="font-bold text-xs text-[#171717]">
                                  AST Evidence Breakdown ({evidenceList.length} Artifact{evidenceList.length === 1 ? '' : 's'})
                                </span>
                              </div>
                              <span className="text-[10px] text-[#777777] font-mono">
                                Scope: {req.requirementCode || req.id} — {req.title}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {evidenceList.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white border border-[#EAEAEA] shadow-sm rounded-xl p-3 space-y-2 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2 border-b border-[#EAEAEA] pb-1.5">
                                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#171717] truncate">
                                      <FileCode2 size={13} className="text-[#F5C400] shrink-0" />
                                      <span className="font-semibold truncate">{item.filePath}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F7F7F5] text-[#171717] shrink-0 border border-[#EAEAEA]">
                                      {item.lineStart && item.lineEnd && item.lineStart !== item.lineEnd
                                        ? `Lines ${item.lineStart}-${item.lineEnd}`
                                        : item.lineStart
                                        ? `Line ${item.lineStart}`
                                        : 'AST Node'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
                                      {item.evidenceType || 'code'}
                                    </span>
                                    {item.strength && (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        item.strength === 'strong' ? 'text-emerald-700 bg-emerald-50' :
                                        item.strength === 'weak' ? 'text-rose-700 bg-rose-50' :
                                        'text-amber-700 bg-amber-50'
                                      }`}>
                                        {item.strength}
                                      </span>
                                    )}
                                    {typeof item.confidence === 'number' && (
                                      <span className="text-[10px] font-mono text-[#777777] ml-auto">
                                        Confidence: {item.confidence}%
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-[11px] text-[#777777] leading-relaxed">
                                    {item.explanation}
                                  </p>

                                  {item.snippet && (
                                    <div className="bg-[#F7F7F5] rounded-lg p-2 font-mono text-[10px] text-[#171717] overflow-x-auto border border-[#EAEAEA]">
                                      <pre className="whitespace-pre">{item.snippet}</pre>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-xs">
            <ListChecks size={24} className="text-[#777777] mx-auto mb-2" />
            <h4 className="font-semibold text-[#171717]">No matching requirements found</h4>
            <p className="text-[#777777] text-[11px] mt-1">
              Adjust your status filter or clear the search field to view requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
