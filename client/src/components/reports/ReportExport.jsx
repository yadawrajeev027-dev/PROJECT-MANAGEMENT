import React, { useState } from 'react';
import { 
  Download, 
  Printer, 
  FileJson, 
  Check, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function ReportExport({ report }) {
  const [downloaded, setDownloaded] = useState(false);

  // Trigger real JSON file export
  const handleDownloadJSON = () => {
    if (!report) return;

    const reportExportData = {
      generator: 'ProjectPulse AI Static Codebase Inspection Engine',
      reportId: report.id,
      exportedAt: new Date().toISOString(),
      project: {
        id: report.projectId,
        name: report.projectName,
        category: report.category,
        technologies: report.technologies,
      },
      auditMetrics: {
        analysisDate: report.analysisDate,
        currentProgress: report.currentProgress,
        previousProgress: report.previousProgress,
        progressChange: report.progressChange,
        requirementsAudited: report.requirementsChecked,
        missingFeaturesCount: report.missingFeaturesCount,
        status: report.status,
      },
      requirementsBreakdown: report.requirementsBreakdown,
      newlyCompletedRequirements: report.newlyCompletedRequirements,
      remainingMissingRequirements: report.remainingMissingRequirements,
      missingFeaturesList: report.missingFeaturesList,
      recommendations: report.recommendations,
      techSignaturesDetected: report.techSignaturesDetected,
      limitations: report.limitations,
      notice: 'This is an export of an illustrative sample inspection report for demonstration purposes.',
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(reportExportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `${report.id}-${report.projectName.toLowerCase().replace(/\s+/g, '-')}-report.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleDownloadJSON}
        className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#171717] bg-[#F5C400] hover:bg-[#E0B300] shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
        title="Download complete structured analysis data as a JSON file"
      >
        {downloaded ? (
          <>
            <Check size={14} className="text-emerald-800" />
            <span>JSON Downloaded!</span>
          </>
        ) : (
          <>
            <FileJson size={14} />
            <span>Export JSON Data</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#171717] bg-[#F7F7F5] hover:bg-[#EAEAEA] border border-[#EAEAEA] transition-colors flex items-center gap-1.5"
        title="Print or Save as PDF via browser print dialogue"
      >
        <Printer size={14} />
        <span>Printable View (PDF)</span>
      </button>
    </div>
  );
}
