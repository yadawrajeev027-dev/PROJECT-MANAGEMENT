/**
 * ProjectPulse AI - Harmonized Sample Data Module
 * 
 * Re-exports and derives from the single source of truth in `centralData.js`.
 */

import { 
  INITIAL_PROJECTS, 
  SAMPLE_REPORTS, 
  calculateDashboardStats, 
  calculateProjectStats 
} from './centralData.js';

export { INITIAL_PROJECTS, SAMPLE_REPORTS, calculateDashboardStats, calculateProjectStats };

// Primary Featured Project for Dashboard Hero
export const FEATURED_PROJECT = INITIAL_PROJECTS[0];

// Dynamic Dashboard Stats calculated from centralized project data
export const SAMPLE_STATS = calculateDashboardStats(INITIAL_PROJECTS, SAMPLE_REPORTS);

export const WEEKLY_PROGRESS_DATA = [
  { day: 'Mon', completion: 42, target: 50, commits: 6 },
  { day: 'Tue', completion: 48, target: 55, commits: 9 },
  { day: 'Wed', completion: 56, target: 60, commits: 14 },
  { day: 'Thu', completion: 63, target: 65, commits: 8 },
  { day: 'Fri', completion: 68, target: 70, commits: 11 },
  { day: 'Sat', completion: 71, target: 72, commits: 4 },
  { day: 'Sun', completion: 74, target: 75, commits: 7 },
];

// Harmonized project array with stable IDs
export const MY_PROJECTS_SAMPLE_DATA = INITIAL_PROJECTS;

// Recent projects table on Dashboard now uses identical stable unique IDs
export const RECENT_PROJECTS = INITIAL_PROJECTS.slice(0, 5);

export const ANALYSIS_BREAKDOWN = [
  {
    id: 'frontend',
    category: 'Frontend Development',
    percentage: 85,
    statusText: 'Responsive views & charts active',
    grade: 'A',
    color: 'from-indigo-500 to-purple-500',
    barColor: 'bg-indigo-500',
    textColor: 'text-indigo-400',
    details: '24/28 UI components created, clean state management, accessible inputs.',
  },
  {
    id: 'backend',
    category: 'Backend Development',
    percentage: 78,
    statusText: 'Core REST endpoints functioning',
    grade: 'B+',
    color: 'from-blue-500 to-cyan-500',
    barColor: 'bg-blue-500',
    textColor: 'text-blue-400',
    details: '14/18 API routes implemented, validation schema configured.',
  },
  {
    id: 'database',
    category: 'Database Integration',
    percentage: 90,
    statusText: 'Mongoose schemas & indexes ready',
    grade: 'A+',
    color: 'from-emerald-500 to-teal-500',
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    details: 'Indexed collections, timestamps, validation hooks verified.',
  },
  {
    id: 'authentication',
    category: 'Authentication System',
    percentage: 65,
    statusText: 'JWT token verification in place',
    grade: 'C+',
    color: 'from-purple-500 to-pink-500',
    barColor: 'bg-purple-500',
    textColor: 'text-purple-400',
    details: 'Bearer token auth works; refresh token rotation and OAuth2 missing.',
  },
  {
    id: 'testing-deployment',
    category: 'Testing and Deployment',
    percentage: 45,
    statusText: 'Minimal unit test coverage',
    grade: 'D',
    color: 'from-amber-500 to-rose-500',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    details: '52% test coverage on core utils; Dockerfile & CI pipeline pending.',
  },
];

export const AI_INSIGHTS = {
  summary:
    'ProjectPulse AI static analysis identified strong architectural foundations across the FastAPI controllers and Scikit-Learn inference pipelines, with key feature gaps remaining in automated testing and API defense.',
  keyInsights: [
    {
      id: 'ki-1',
      title: 'High Architectural Cohesion',
      description: 'Clean separation of concerns between model evaluation utilities and web service routers.',
      impact: 'Positive',
    },
    {
      id: 'ki-2',
      title: 'Model Inference Pipeline Verified',
      description: 'Joblib-serialized model loading routines properly wrapped in application lifecycle events.',
      impact: 'Positive',
    },
    {
      id: 'ki-3',
      title: 'Clean Environment Configuration',
      description: 'External configurations and thresholds isolated in environment files rather than hardcoded.',
      impact: 'Positive',
    },
  ],
  missingFeatures: [
    {
      id: 'mf-1',
      title: 'Automated Test Suite for Inference Failures',
      severity: 'High',
      description: 'No automated tests simulating corrupt sensor inputs or empty payload batches.',
    },
    {
      id: 'mf-2',
      title: 'Endpoint Rate-Limiting & Security Headers',
      severity: 'Medium',
      description: 'Prediction route lacks IP-based rate limiting, exposing the server to compute exhaustion.',
    },
    {
      id: 'mf-3',
      title: 'Centralized Error Telemetry',
      severity: 'Low',
      description: 'Unhandled exceptions print to standard console without structured log formatting.',
    },
  ],
  recommendedAction: {
    title: 'Recommended Next Action',
    actionText: 'Implement Pytest Suite & Add Rate-Limiting Middleware',
    reason:
      'Adding unit tests for edge-case sensor inputs and rate-limiting the prediction endpoint will elevate completion from 74% to 88% and satisfy remaining production criteria.',
    estimatedImpact: '+14% Progress Increase',
  },
  disclaimer:
    'These findings represent illustrative sample insights for interface preview. Real-time dynamic analysis will be performed by the AST code extraction engine and LLM verification pipeline in upcoming development phases.',
};
