import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Sparkles, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Layers,
  ArrowLeft,
  Loader2
} from 'lucide-react';

import ProjectInformationForm from '../components/upload/ProjectInformationForm';
import ZipUpload from '../components/upload/ZipUpload';
import RequirementsBuilder from '../components/upload/RequirementsBuilder';
import ProjectSummary from '../components/upload/ProjectSummary';
import ReviewProjectModal from '../components/upload/ReviewProjectModal';

import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import projectService from '../services/projectService';
import analysisService from '../services/analysisService';
import progressService from '../services/progressService';
import { inspectZipArchive } from '../utils/zipAnalyzer.js';

const DRAFT_STORAGE_KEY = 'projectpulse_project_draft_v1';

// Clean initial form data without hardcoded technology biases like MongoDB
const INITIAL_FORM_DATA = {
  name: '',
  description: '',
  category: 'Web Application',
  technologies: [],
  expectedCompletionDate: '',
};

// No fake default requirements; projects start clean or import from PROJECT_REQUIREMENTS.md
const INITIAL_REQUIREMENTS = [];

export default function UploadProjectPage() {
  const navigate = useNavigate();
  const { addProject, refreshProjects } = useProjects();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [requirements, setRequirements] = useState(INITIAL_REQUIREMENTS);
  const [errors, setErrors] = useState({});
  const [draftSavedTime, setDraftSavedTime] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Submission & Upload Progress state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatusText, setSubmitStatusText] = useState('');

  // Archive inspection state
  const [isExtractingZip, setIsExtractingZip] = useState(false);
  const [detectedTech, setDetectedTech] = useState([]);
  const [totalSourceFiles, setTotalSourceFiles] = useState(null);
  const [reqSourceFile, setReqSourceFile] = useState(null);

  // Restore draft from localStorage on initial mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.requirements && parsed.requirements.length > 0) {
          setRequirements(parsed.requirements);
        }
        if (parsed.savedAt) setDraftSavedTime(parsed.savedAt);
      }
    } catch (err) {
      console.warn('Could not restore project draft:', err);
    }
  }, []);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Form field change handler
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // File selection handlers with ZIP inspection and manifest scanning
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setFileError(null);
    setIsExtractingZip(true);

    try {
      const result = await inspectZipArchive(file);
      setTotalSourceFiles(result.totalFiles);
      setDetectedTech(result.detectedTechnologies);

      // If requirements were found inside PROJECT_REQUIREMENTS.md, import them
      if (result.requirementsFound && result.requirementsFound.length > 0) {
        setRequirements(result.requirementsFound);
        setReqSourceFile(result.requirementsSourceFile);
        showToast(
          'success',
          `Imported ${result.requirementsFound.length} requirements from ${result.requirementsSourceFile}!`
        );
      }

      // Auto-adopt detected technologies and avoid hardcoded assumptions
      if (result.detectedTechnologies && result.detectedTechnologies.length > 0) {
        setFormData((prev) => ({
          ...prev,
          technologies: Array.from(new Set([...prev.technologies, ...result.detectedTechnologies])),
          category: result.categoryHint || prev.category,
        }));
      }

      // Populate project title and description if currently blank
      if (result.detectedProjectName && !formData.name) {
        setFormData((prev) => ({ ...prev, name: result.detectedProjectName }));
      }
      if (result.detectedDescription && !formData.description) {
        setFormData((prev) => ({ ...prev, description: result.detectedDescription }));
      }
    } catch (err) {
      console.warn('ZIP inspection warning:', err);
    } finally {
      setIsExtractingZip(false);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFileError(null);
    setDetectedTech([]);
    setTotalSourceFiles(null);
    setReqSourceFile(null);
  };

  // Direct requirements import (e.g. from standalone .md file)
  const handleImportRequirements = (importedReqs, sourceName = 'Imported Specification') => {
    if (Array.isArray(importedReqs) && importedReqs.length > 0) {
      setRequirements(importedReqs);
      setReqSourceFile(sourceName);
      showToast('success', `Imported ${importedReqs.length} requirements from ${sourceName}!`);
    }
  };

  // Comprehensive Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters long';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.trim().length < 15) {
      newErrors.description = 'Please provide a more descriptive summary (min 15 characters)';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a project category';
    }

    if (!formData.technologies || formData.technologies.length === 0) {
      newErrors.technologies = 'Specify at least one technology stack entry';
    }

    if (!selectedFile) {
      setFileError('Source code ZIP archive is required for analysis');
      newErrors.file = 'ZIP archive missing';
    }

    if (!requirements || requirements.length === 0) {
      newErrors.requirements = 'Define at least one expected requirement or upload PROJECT_REQUIREMENTS.md';
    } else {
      requirements.forEach((req, idx) => {
        if (!req.title || !req.title.trim()) {
          newErrors[`req_title_${idx}`] = `Requirement #${idx + 1} must have a title`;
        }
        if (!req.description || !req.description.trim()) {
          newErrors[`req_desc_${idx}`] = `Requirement #${idx + 1} must have a description`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save draft to localStorage
  const handleSaveDraft = () => {
    try {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const draftPayload = {
        formData,
        requirements,
        detectedTech,
        totalSourceFiles,
        reqSourceFile,
        savedAt: now,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      setDraftSavedTime(now);
      showToast('success', `Project draft saved to local browser storage at ${now}`);
    } catch (err) {
      console.error('Error saving draft:', err);
      showToast('error', 'Unable to save draft to browser storage.');
    }
  };

  // Reset all fields and clear draft
  const handleResetForm = () => {
    if (window.confirm('Reset all fields and discard the current draft?')) {
      setFormData(INITIAL_FORM_DATA);
      setSelectedFile(null);
      setFileError(null);
      setRequirements(INITIAL_REQUIREMENTS);
      setDetectedTech([]);
      setTotalSourceFiles(null);
      setReqSourceFile(null);
      setErrors({});
      setDraftSavedTime(null);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      showToast('info', 'Form has been reset to initial state.');
    }
  };

  // Continue to Review
  const handleContinueToReview = () => {
    const isValid = validateForm();
    if (isValid) {
      setIsReviewOpen(true);
    } else {
      showToast('error', 'Please resolve the highlighted validation errors before continuing.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Confirm Specification from Modal
  const handleConfirmProject = async () => {
    setIsReviewOpen(false);
    setIsSubmitting(true);
    setSubmitStatusText('Creating project specification in MongoDB...');

    try {
      let targetProjectId = null;

      if (isAuthenticated) {
        // 1. Create project on backend
        const created = await projectService.createProject({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          technologies: formData.technologies,
        });

        const createdProject = created?.project || created?.data?.project || created?.data || created;
        targetProjectId = (createdProject?._id || createdProject?.id || createdProject)?.toString();

        // 2. Add requirements
        if (requirements && requirements.length > 0) {
          setSubmitStatusText(`Registering ${requirements.length} requirements in matrix...`);
          for (const req of requirements) {
            try {
              await projectService.addRequirement(targetProjectId, {
                code: req.requirementCode || req.code || req.id,
                title: req.title,
                description: req.description,
                priority: (req.priority || 'Medium').toLowerCase(),
                weight: Number(req.weight) || 10,
              });
            } catch (rErr) {
              console.warn('Failed saving requirement:', rErr);
            }
          }
        }

        // 3. Upload ZIP file if selected
        if (selectedFile) {
          setSubmitStatusText('Uploading source code archive (0%)...');
          await projectService.uploadProjectZip(targetProjectId, selectedFile, (pct) => {
            setUploadProgress(pct);
            setSubmitStatusText(`Uploading source code archive (${pct}%)...`);
          });

          // 4. Trigger extraction
          setSubmitStatusText('Extracting and verifying ZIP archive security...');
          let extractionSucceeded = false;
          try {
            await projectService.extractProjectZip(targetProjectId);
            extractionSucceeded = true;
          } catch (exErr) {
            console.warn('Extraction queued or completed with notice:', exErr);
            try {
              const status = await projectService.getExtractionStatus(targetProjectId);
              if (status?.extractionStatus === 'completed') {
                extractionSucceeded = true;
              }
            } catch (sErr) {
              console.warn('Extraction status check notice:', sErr);
            }
          }

          if (extractionSucceeded) {
            // 5. Trigger AST static source analysis
            setSubmitStatusText('Running AST static source analysis...');
            try {
              await analysisService.analyzeSource(targetProjectId);
            } catch (anErr) {
              console.warn('AST source analysis notice:', anErr);
            }

            // 6. Trigger requirement verification against AST code evidence
            setSubmitStatusText('Verifying requirements against code evidence...');
            try {
              await analysisService.verifyRequirements(targetProjectId);
            } catch (vErr) {
              console.warn('Requirement verification notice:', vErr);
            }

            // 7. Trigger AI architectural advisory (non-blocking)
            setSubmitStatusText('Synthesizing AI architectural recommendations...');
            try {
              await analysisService.generateRecommendations(targetProjectId);
            } catch (aiErr) {
              console.warn('AI advisory notice:', aiErr);
            }

            // 8. Trigger deterministic weighted progress calculation
            setSubmitStatusText('Calculating deterministic project progress...');
            try {
              await progressService.calculateProgress(targetProjectId);
            } catch (pErr) {
              console.warn('Progress calculation notice:', pErr);
            }
          }
        }

        // Refresh context projects
        if (refreshProjects) {
          await refreshProjects();
        }
      } else {
        // Fallback for unauthenticated/demo mode
        const newProject = await addProject({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          technologies: formData.technologies,
          declaredTechnologies: formData.technologies,
          detectedTechnologies: detectedTech,
          requirements,
          zipFileName: selectedFile?.name,
          zipFileSize: selectedFile?.size,
          totalFiles: totalSourceFiles,
          requirementsSourceFile: reqSourceFile || 'Manual Specification Checklist',
          analysisStatus: 'Pending',
        });
        targetProjectId = newProject.id;
      }

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (e) {
        // ignore
      }

      showToast(
        'success',
        `Project specification "${formData.name}" successfully created! Redirecting to workspace...`
      );

      setTimeout(() => {
        navigate(`/projects/${targetProjectId}`);
      }, 1000);
    } catch (err) {
      console.error('Failed submitting project:', err);
      showToast('error', err.message || 'Failed creating project on server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. Page Header & Breadcrumb */}
      <div>
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-[#777777] mb-2">
          <Link
            to="/dashboard"
            className="hover:text-[#F5C400] transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-[#777777]" />
          <span className="text-[#171717] font-semibold">Upload Project</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Upload New Project
            </h2>
            <p className="text-xs sm:text-sm text-[#777777] mt-1">
              Upload your existing software project and define its expected requirements.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#171717] bg-white hover:bg-[#F7F7F5] border border-[#EAEAEA] transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Ephemeral Toast Alert */}
      {toastMessage && (
        <div 
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-[#F7F7F5] border-[#EAEAEA] text-[#171717]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          ) : (
            <Info size={16} className="text-[#F5C400] shrink-0" />
          )}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Form Sections */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Project Information Form */}
          <ProjectInformationForm
            formData={formData}
            onChange={handleFormChange}
            errors={errors}
          />

          {/* 2. ZIP File Upload Component */}
          <ZipUpload
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            error={fileError}
            setError={setFileError}
            isExtractingZip={isExtractingZip}
            detectedTech={detectedTech}
            totalFiles={totalSourceFiles}
            requirementsSourceFile={reqSourceFile}
          />

          {/* 3. Requirements Builder Section */}
          <RequirementsBuilder
            requirements={requirements}
            setRequirements={setRequirements}
            errors={errors}
            requirementsSourceFile={reqSourceFile}
            onImportRequirements={handleImportRequirements}
          />
        </div>

        {/* Right Column (4 cols): Sticky Project Summary & Action Controls */}
        <div className="lg:col-span-4">
          <ProjectSummary
            formData={formData}
            selectedFile={selectedFile}
            requirements={requirements}
            draftSavedTime={draftSavedTime}
            onSaveDraft={handleSaveDraft}
            onReset={handleResetForm}
            onReview={handleContinueToReview}
          />
        </div>
      </div>

      {/* Review Modal Dialog */}
      <ReviewProjectModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        formData={formData}
        selectedFile={selectedFile}
        requirements={requirements}
        detectedTech={detectedTech}
        totalFiles={totalSourceFiles}
        requirementsSourceFile={reqSourceFile}
        onConfirm={handleConfirmProject}
      />

      {/* Submission & Upload Progress Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-[#EAEAEA] text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F7F5] border border-[#EAEAEA] flex items-center justify-center mx-auto text-[#171717]">
              <Loader2 size={28} className="animate-spin text-[#F5C400]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#171717] tracking-tight">Deploying Project to Pipeline</h3>
              <p className="text-xs text-[#777777] mt-1">{submitStatusText}</p>
            </div>
            {uploadProgress > 0 && (
              <div className="space-y-1.5">
                <div className="w-full bg-[#EAEAEA] rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-[#F5C400] transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#777777] text-right font-mono">{uploadProgress}% complete</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
