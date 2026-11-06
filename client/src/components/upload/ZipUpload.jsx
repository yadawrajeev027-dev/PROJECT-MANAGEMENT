import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileArchive, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ShieldAlert,
  HardDrive
} from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export default function ZipUpload({
  selectedFile,
  onFileSelect,
  onFileRemove,
  error,
  setError,
  isExtractingZip = false,
  detectedTech = [],
  totalFiles = null,
  requirementsSourceFile = null,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Format file size utility
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file selection
  const validateAndSetFile = (file) => {
    if (!file) return;

    // Check extension and mime type
    const isZip = 
      file.name.toLowerCase().endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed' ||
      file.type === 'multipart/x-zip';

    if (!isZip) {
      setError(
        `Invalid file type "${file.name}". ProjectPulse AI only accepts compressed .zip archives.`
      );
      return;
    }

    // Check file size limit (100 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `File size (${formatFileSize(file.size)}) exceeds the 100 MB limit. Please compress your project excluding node_modules, build directories, or large datasets.`
      );
      return;
    }

    // Clear any previous error and register file
    setError(null);
    onFileSelect(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const handleTriggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
            <FileArchive size={18} className="text-[#F5C400]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#171717] tracking-tight">
              2. Source Codebase Archive
            </h3>
            <p className="text-xs text-[#777777]">
              Select or drop your project ZIP file for upcoming AST analysis
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#171717] bg-[#F7F7F5] px-2.5 py-1 rounded-full border border-[#EAEAEA]">
          Step 2 of 3
        </span>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Zone */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleTriggerBrowse}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer group ${
            isDragOver
              ? 'border-[#F5C400] bg-[#F5C400]/10 scale-[1.01]'
              : 'border-[#EAEAEA] hover:border-[#F5C400] bg-[#F7F7F5]'
          }`}
        >
          <div className="flex flex-col items-center justify-center pointer-events-none space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              isDragOver
                ? 'bg-[#F5C400] text-black shadow-sm'
                : 'bg-white text-[#171717] border border-[#EAEAEA]'
            }`}>
              <UploadCloud size={32} />
            </div>

            <div>
              <p className="text-sm font-bold text-[#171717]">
                {isDragOver ? (
                  <span className="text-[#171717]">Drop your ZIP archive here</span>
                ) : (
                  <>
                    Drag and drop your project ZIP, or{' '}
                    <span className="text-[#171717] underline decoration-[#F5C400] decoration-2 underline-offset-4">
                      browse computer
                    </span>
                  </>
                )}
              </p>
              <p className="text-xs text-[#777777] mt-1">
                Accepted format: <strong className="text-[#171717] font-mono">.zip</strong> only &bull; Max size: <strong className="text-[#171717]">100 MB</strong>
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-[#777777] font-medium">
              <HardDrive size={13} className="text-[#F5C400]" />
              <span>Excludes node_modules, build &amp; .git folders automatically</span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card State */
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F7F5] border border-[#EAEAEA] flex flex-col gap-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-xl bg-white text-[#171717] border border-[#EAEAEA] shrink-0">
                <FileArchive size={26} className="text-[#F5C400]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#171717] truncate">
                    {selectedFile.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {isExtractingZip ? 'Extracting...' : 'Archive Loaded'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-[#777777]">
                  <span className="font-mono text-[#171717]">
                    {formatFileSize(selectedFile.size)}
                  </span>
                  {totalFiles !== null && (
                    <>
                      <span>&bull;</span>
                      <span className="text-[#171717] font-mono">
                        {totalFiles} source files
                      </span>
                    </>
                  )}
                  <span>&bull;</span>
                  <span className="text-[#777777]">
                    Last modified: {new Date(selectedFile.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleTriggerBrowse}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-colors shadow-sm"
              >
                Change File
              </button>

              <button
                type="button"
                onClick={onFileRemove}
                className="p-2 rounded-xl text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-[#EAEAEA] transition-colors shadow-sm"
                title="Remove selected file"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Inspection Details Section */}
          {isExtractingZip ? (
            <div className="p-3 rounded-xl bg-white border border-[#EAEAEA] flex items-center gap-2.5 text-xs text-[#171717] animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-[#F5C400] border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Inspecting package manifests and PROJECT_REQUIREMENTS.md in archive...</span>
            </div>
          ) : (
            (detectedTech.length > 0 || requirementsSourceFile) && (
              <div className="pt-3 border-t border-[#EAEAEA] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {detectedTech.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white border border-[#EAEAEA]">
                    <span className="text-[10px] uppercase font-bold text-[#777777] block mb-1">
                      Detected Technologies (from manifest):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {detectedTech.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F7F7F5] text-[#171717] border border-[#EAEAEA]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {requirementsSourceFile && (
                  <div className="p-2.5 rounded-xl bg-white border border-[#EAEAEA]">
                    <span className="text-[10px] uppercase font-bold text-[#777777] block mb-1">
                      Requirements Imported From:
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[#171717] text-[11px]">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{requirementsSourceFile}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Validation Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-snug">{error}</div>
        </div>
      )}

      {/* Instructions & Guidelines Box */}
      <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#EAEAEA] text-xs text-[#777777] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#171717] text-[11px] uppercase tracking-wider">
          <Info size={14} className="text-[#F5C400]" />
          <span>Upload Preparation Instructions</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-[#777777] pl-1">
          <li>Compress the entire project repository starting from the root folder containing <code className="text-[#171717] font-semibold">package.json</code> or <code className="text-[#171717] font-semibold">requirements.txt</code>.</li>
          <li>Delete or ignore huge build folders (<code className="text-[#777777]">node_modules/</code>, <code className="text-[#777777]">dist/</code>, <code className="text-[#777777]">.venv/</code>) before zipping.</li>
          <li><strong>Client-Side Boundary:</strong> File selection is maintained in your browser session memory. Backend streaming and extraction are scheduled for Task 3.</li>
        </ul>
      </div>
    </div>
  );
}
