/**
 * ProjectPulse AI - Centralized Shared Sample Data Module
 * 
 * NOTE FOR CODE AUDIT & INTERVIEWS:
 * This module is the single source of truth for all frontend sample datasets,
 * maintaining consistent unique IDs, synchronized requirements, report linkages,
 * and dynamically calculated dashboard & project portfolio statistics.
 * 
 * In Task 4 & Task 5, these structures map directly to MongoDB schema models.
 */

import { SAMPLE_REPORTS } from './reportsData.js';

export { SAMPLE_REPORTS };

export const INITIAL_PROJECTS = [
  {
    id: 'proj-food-quality',
    name: 'Food Quality Prediction',
    tagline: 'Multi-Sensor Spectral Regression & Freshness Classification',
    description:
      'Machine learning and sensor regression pipeline predicting freshness metrics, spoilage indicators, and estimated shelf-life based on spectral telemetry.',
    category: 'Machine Learning',
    technologies: ['FastAPI', 'React', 'Python', 'Scikit-Learn', 'MongoDB'],
    status: 'In Progress',
    statusColor: 'purple',
    lastUpdated: '2 hours ago',
    updatedTimestamp: 1730790000000,
    lastAnalysisDate: 'Nov 4, 2026 • 14:32 IST',
    completionPercentage: 74,
    repoBranch: 'main',
    requirementsCount: 18,
    isSample: true,
    developmentBreakdown: [
      { id: 'frontend', name: 'Frontend Development', percentage: 82, grade: 'A-', barColor: 'from-indigo-500 to-purple-500', note: 'Interactive real-time gauge, sensor dashboard, responsive viewports' },
      { id: 'backend', name: 'Backend Development', percentage: 78, grade: 'B+', barColor: 'from-blue-500 to-cyan-500', note: 'FastAPI routes, asynchronous telemetry workers, schema validation' },
      { id: 'database', name: 'Database Integration', percentage: 90, grade: 'A', barColor: 'from-emerald-500 to-teal-500', note: 'MongoDB collections, sensor time-series indexing, aggregation queries' },
      { id: 'auth', name: 'Authentication System', percentage: 65, grade: 'C+', barColor: 'from-purple-500 to-pink-500', note: 'JWT Bearer token verification; refresh token rotation missing' },
      { id: 'testing', name: 'Testing Suite', percentage: 38, grade: 'D', barColor: 'from-rose-500 to-amber-500', note: 'Minimal unit tests on utility scripts; no automated model failure tests' },
      { id: 'deployment', name: 'Deployment & DevOps', percentage: 45, grade: 'D+', barColor: 'from-amber-500 to-orange-500', note: 'Dockerfile scaffolded; CI/CD GitHub Actions workflow pending' },
    ],
    requirements: [
      {
        id: 'REQ-001',
        title: 'Sensor Spectral Data Ingestion Route',
        description: 'POST /api/v1/sensors/telemetry accepts batch JSON spectral absorbance readings and validates float ranges.',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Found route handler in server/api/v1/sensors.py (lines 34-62); Pydantic schema validation active.',
      },
      {
        id: 'REQ-002',
        title: 'Scikit-Learn Model Serializer & Inference Pipeline',
        description: 'Load trained Random Forest and Gradient Boosted regression models using Joblib during app lifecycle startup.',
        priority: 'High',
        weight: 20,
        status: 'Verified',
        evidence: 'Found model loader in server/ml/model_engine.py; model cached in FastAPI application state on startup.',
      },
      {
        id: 'REQ-003',
        title: 'Time-Series Sensor History Storage in MongoDB',
        description: 'Persist timestamped sensor batches with TTL indices for historical freshness degradation curves.',
        priority: 'Medium',
        weight: 15,
        status: 'Verified',
        evidence: 'MongoDB collections sensor_readings and quality_reports configured with compound index on (batch_id, timestamp).',
      },
      {
        id: 'REQ-004',
        title: 'Real-Time Freshness Gauge UI Component',
        description: 'Interactive SVG / Canvas circular gauge displaying freshness scores (0-100) with color transition thresholds.',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Found component in client/src/components/Gauge.jsx with Recharts/Canvas radial rendering.',
      },
      {
        id: 'REQ-005',
        title: 'JWT Authentication & Role-Based Access for Inspectors',
        description: 'Inspectors authenticate with JWT Bearer tokens to approve or override automated model classifications.',
        priority: 'Medium',
        weight: 10,
        status: 'Partial',
        evidence: 'Login route functional; token refresh and role claim verification decorator missing on /override endpoint.',
      },
      {
        id: 'REQ-006',
        title: 'Token-Bucket Rate Limiter on Prediction Endpoint',
        description: 'Prevent compute exhaustion by throttling client inferences to a maximum of 60 requests per minute.',
        priority: 'Medium',
        weight: 10,
        status: 'Not Found',
        evidence: 'No slowapi or Redis rate-limiting middleware configured on POST /predict in router definitions.',
      },
      {
        id: 'REQ-007',
        title: 'Automated Pytest ML Inference Failure Edge Cases',
        description: 'Unit tests asserting graceful degradation when sensor inputs contain NaN, extreme outliers, or empty batches.',
        priority: 'High',
        weight: 15,
        status: 'Not Found',
        evidence: 'tests/ directory contains basic utility unit tests only; no pytest fixtures for corrupt telemetry vectors.',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-001',
        feature: 'Automated Pytest Inference Failure Suite',
        importance: 'Critical for enterprise ML stability — model server crashes when telemetry contains corrupt spectrum arrays.',
        relatedRequirement: 'REQ-007',
        priority: 'High',
        suggestedImplementation: 'Add tests/test_inference.py with pytest parametrization for corrupt payloads.',
      },
      {
        id: 'MF-002',
        feature: 'Prediction Endpoint Rate Limiting Middleware',
        importance: 'Prevents CPU starvation attacks from unauthenticated rapid inference requests.',
        relatedRequirement: 'REQ-006',
        priority: 'Medium',
        suggestedImplementation: 'Integrate slowapi with in-memory or Redis token-bucket throttling on /api/v1/predict.',
      },
    ],
    recommendations: [
      {
        id: 'REC-001',
        title: 'Add Parameterized Pytest Inference Suite',
        explanation: 'Create test fixtures in tests/test_inference.py for corrupt sensor inputs.',
        priority: 'High',
        impact: '+12% Progress',
        userCompleted: false,
      },
      {
        id: 'REC-002',
        title: 'Configure Rate-Limiting Decorator',
        explanation: 'Add slowapi limiter to @router.post("/predict") to guard against compute exhaustion.',
        priority: 'Medium',
        impact: '+8% Progress',
        userCompleted: false,
      },
    ],
    progressTrend: [
      { run: 'Run 1 (Oct 27)', progress: 50, features: 6, target: 50 },
      { run: 'Run 2 (Nov 1)', progress: 62, features: 9, target: 65 },
      { run: 'Run 3 (Nov 4)', progress: 74, features: 12, target: 75 },
    ],
    analysisHistory: [
      {
        id: 'REP-2026-104',
        date: 'Nov 4, 2026 • 14:32 IST',
        completion: 74,
        requirementsChecked: 18,
        missingFeatures: 4,
        summary: 'AST scan verified Scikit-Learn inference pipeline, Pydantic telemetry models, and FastAPI routes.',
      },
      {
        id: 'REP-2026-103',
        date: 'Nov 1, 2026 • 11:15 IST',
        completion: 62,
        requirementsChecked: 18,
        missingFeatures: 6,
        summary: 'Added MongoDB compound indexes. Missing pytest inference edge tests and rate limiting.',
      },
    ]
  },
  {
    id: 'proj-humaniza-ai',
    name: 'HumanizaAI',
    tagline: 'Natural Text Humanization Engine',
    description:
      'Natural language processing platform that transforms synthetic AI text into nuanced, human-sounding content with customizable tone adjustments.',
    category: 'Web Application',
    technologies: ['Next.js', 'React', 'TypeScript', 'Node.js', 'OpenAI API', 'Tailwind CSS'],
    status: 'Completed',
    statusColor: 'emerald',
    lastUpdated: 'Yesterday',
    updatedTimestamp: 1730700000000,
    lastAnalysisDate: 'Nov 3, 2026',
    completionPercentage: 92,
    repoBranch: 'production',
    requirementsCount: 24,
    isSample: true,
    developmentBreakdown: [
      { id: 'frontend', name: 'Frontend Development', percentage: 95, grade: 'A+', barColor: 'from-indigo-500 to-purple-500', note: 'Interactive editor, tone sliders, side-by-side diffing viewer' },
      { id: 'backend', name: 'Backend Development', percentage: 90, grade: 'A', barColor: 'from-blue-500 to-cyan-500', note: 'Streaming OpenAI SDK endpoints, chunked token parsers' },
      { id: 'database', name: 'Database Integration', percentage: 92, grade: 'A', barColor: 'from-emerald-500 to-teal-500', note: 'User history archives, token usage ledgers, cached paraphrases' },
      { id: 'auth', name: 'Authentication System', percentage: 88, grade: 'A-', barColor: 'from-purple-500 to-pink-500', note: 'NextAuth session verification, OAuth2 Google login verified' },
      { id: 'testing', name: 'Testing Suite', percentage: 85, grade: 'B+', barColor: 'from-emerald-500 to-teal-500', note: 'Jest integration tests on text chunkers and API error recovery' },
      { id: 'deployment', name: 'Deployment & DevOps', percentage: 96, grade: 'A+', barColor: 'from-emerald-500 to-teal-500', note: 'Vercel Edge functions configured, production environment verified' },
    ],
    requirements: [
      {
        id: 'REQ-H01',
        title: 'OpenAI Streaming Token Response Proxy',
        description: 'Server-Sent Events (SSE) route streaming paraphrased tokens with backpressure regulation.',
        priority: 'High',
        weight: 20,
        status: 'Verified',
        evidence: 'Found route handler in app/api/humanize/route.ts utilizing OpenAI ReadableStream reader.',
      },
      {
        id: 'REQ-H02',
        title: 'Dual-Pane Side-by-Side Text Diffing View',
        description: 'Highlight syntactic substitutions, perplexity reductions, and burstiness improvements.',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Found component in components/DiffViewer.tsx using jsdiff tokens and colored span markers.',
      },
      {
        id: 'REQ-H03',
        title: 'User Credit Consumption & Stripe Metering',
        description: 'Deduct token balances per 100 words transformed and record ledger transactions.',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Stripe webhook receiver in app/api/webhooks/stripe/route.ts updates user balance in MongoDB.',
      },
      {
        id: 'REQ-H04',
        title: 'Export to DOCX and Markdown Format',
        description: 'Enable immediate file download of humanized output with preserved styling.',
        priority: 'Low',
        weight: 10,
        status: 'Partial',
        evidence: 'Markdown export verified; DOCX binary packager pending file-saver integration.',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-H01',
        feature: 'DOCX Binary Document Generator',
        importance: 'Nice to have for non-developer academic users.',
        relatedRequirement: 'REQ-H04',
        priority: 'Low',
        suggestedImplementation: 'Add docx npm package serializer in utils/exportDocx.ts.',
      },
    ],
    recommendations: [
      {
        id: 'REC-H01',
        title: 'Add DOCX Export Support',
        explanation: 'Package humanized text into formatted .docx documents for non-technical users.',
        priority: 'Low',
        impact: '+4% Progress',
        userCompleted: false,
      },
    ],
    progressTrend: [
      { run: 'Run 1 (Oct 20)', progress: 65, features: 14, target: 60 },
      { run: 'Run 2 (Oct 29)', progress: 80, features: 19, target: 75 },
      { run: 'Run 3 (Nov 3)', progress: 92, features: 22, target: 90 },
    ],
    analysisHistory: [
      {
        id: 'REP-2026-203',
        date: 'Nov 3, 2026 • 16:10 IST',
        completion: 92,
        requirementsChecked: 24,
        missingFeatures: 2,
        summary: 'Streaming SSE route, dual-pane diff viewer, and Stripe metering verified.',
      },
    ]
  },
  {
    id: 'proj-hostel-mgmt',
    name: 'Hostel Management System',
    tagline: 'Automated Student Accommodation Portal',
    description:
      'Comprehensive administrative portal managing room allocation, student tenancy records, mess billing calculations, maintenance requests, and digital gate passes.',
    category: 'Backend Application',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Tailwind CSS'],
    status: 'Needs Attention',
    statusColor: 'amber',
    lastUpdated: '3 days ago',
    updatedTimestamp: 1730500000000,
    lastAnalysisDate: 'Nov 1, 2026',
    completionPercentage: 46,
    repoBranch: 'feature/mess-billing',
    requirementsCount: 30,
    isSample: true,
    developmentBreakdown: [
      { id: 'frontend', name: 'Frontend Development', percentage: 60, grade: 'C+', barColor: 'from-indigo-500 to-purple-500', note: 'Basic student tables and room forms; mess billing UI incomplete' },
      { id: 'backend', name: 'Backend Development', percentage: 52, grade: 'C', barColor: 'from-blue-500 to-cyan-500', note: 'Student CRUD functional; fee calculation ledger endpoints missing' },
      { id: 'database', name: 'Database Integration', percentage: 65, grade: 'B-', barColor: 'from-emerald-500 to-teal-500', note: 'Room and student schemas defined; transaction locks missing on booking' },
      { id: 'auth', name: 'Authentication System', percentage: 70, grade: 'B', barColor: 'from-purple-500 to-pink-500', note: 'Warden vs Student role authorization active' },
      { id: 'testing', name: 'Testing Suite', percentage: 15, grade: 'F', barColor: 'from-rose-500 to-amber-500', note: 'No automated tests found in repository' },
      { id: 'deployment', name: 'Deployment & DevOps', percentage: 20, grade: 'F', barColor: 'from-rose-500 to-amber-500', note: 'No container or deployment files configured' },
    ],
    requirements: [
      {
        id: 'REQ-HM01',
        title: 'Student Room Allocation with Concurrency Lock',
        description: 'Reserve room slot using MongoDB session transactions to prevent double-booking.',
        priority: 'High',
        weight: 20,
        status: 'Partial',
        evidence: 'Allocation route exists in routes/rooms.js but does not wrap update in session transaction.',
      },
      {
        id: 'REQ-HM02',
        title: 'Automated Monthly Mess Rebate & Bill Calculation',
        description: 'Calculate daily meal attendance and deduct approved leave rebates from monthly invoices.',
        priority: 'High',
        weight: 20,
        status: 'Not Found',
        evidence: 'No cron or aggregation pipeline calculating rebates found in services/messService.js.',
      },
      {
        id: 'REQ-HM03',
        title: 'Digital Gate Pass QR Code Generator',
        description: 'Issue signed JWT QR pass for warden digital scanner checkouts.',
        priority: 'Medium',
        weight: 15,
        status: 'Verified',
        evidence: 'QR code generation route verified in routes/gatepass.js using qrcode library.',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-HM01',
        feature: 'Atomic Concurrency Booking Locks',
        importance: 'Critical to prevent two students from reserving the same room concurrently.',
        relatedRequirement: 'REQ-HM01',
        priority: 'High',
        suggestedImplementation: 'Wrap Room.findByIdAndUpdate in mongoose.startSession() transaction.',
      },
      {
        id: 'MF-HM02',
        feature: 'Mess Rebate Calculation Service',
        importance: 'Primary administrative requirement for hostel fee settlement.',
        relatedRequirement: 'REQ-HM02',
        priority: 'High',
        suggestedImplementation: 'Implement services/messRebate.js aggregation pipeline.',
      },
    ],
    recommendations: [
      {
        id: 'REC-HM01',
        title: 'Add Session Transactions to Room Allocation',
        explanation: 'Enforce atomic MongoDB reservations to stop race conditions during allocation.',
        priority: 'High',
        impact: '+18% Progress',
        userCompleted: false,
      },
      {
        id: 'REC-HM02',
        title: 'Implement Mess Billing Pipeline',
        explanation: 'Create cron job service computing monthly student attendance against fee schedules.',
        priority: 'High',
        impact: '+15% Progress',
        userCompleted: false,
      },
    ],
    progressTrend: [
      { run: 'Run 1 (Oct 25)', progress: 30, features: 8, target: 40 },
      { run: 'Run 2 (Nov 1)', progress: 46, features: 14, target: 50 },
    ],
    analysisHistory: [
      {
        id: 'REP-2026-302',
        date: 'Nov 1, 2026 • 09:45 IST',
        completion: 46,
        requirementsChecked: 30,
        missingFeatures: 12,
        summary: 'Digital QR gate pass verified. Mess billing calculation and concurrency booking locks missing.',
      },
    ]
  },
  {
    id: 'proj-projectpulse-ai',
    name: 'ProjectPulse AI',
    tagline: 'AI-Powered Software Analysis & Progress Tracking',
    description:
      'AI-powered software project analysis and progress tracking platform. Ingests source code ZIPs, maps AST routes, and audits feature completion against requirements.',
    category: 'Developer Tooling',
    technologies: ['React', 'Vite', 'Node.js', 'Express', 'Tailwind CSS', 'Recharts'],
    status: 'In Progress',
    statusColor: 'purple',
    lastUpdated: 'Just now',
    updatedTimestamp: 1730800000000,
    lastAnalysisDate: 'Nov 5, 2026',
    completionPercentage: 85,
    repoBranch: 'develop',
    requirementsCount: 22,
    isSample: true,
    developmentBreakdown: [
      { id: 'frontend', name: 'Frontend Architecture', percentage: 95, grade: 'A+', barColor: 'from-indigo-500 to-purple-500', note: 'All views, dashboard, router, theme switching, and local storage state active' },
      { id: 'backend', name: 'Backend API Foundation', percentage: 70, grade: 'B', barColor: 'from-blue-500 to-cyan-500', note: 'Express server, health checks, modular project route structure ready' },
      { id: 'database', name: 'MongoDB Architecture', percentage: 75, grade: 'B+', barColor: 'from-emerald-500 to-teal-500', note: 'Project, requirement, and report schema designs prepared' },
      { id: 'auth', name: 'Authentication Layer', percentage: 40, grade: 'F', barColor: 'from-purple-500 to-pink-500', note: 'Frontend UI ready; backend JWT issuance and password hashing pending Task 4' },
      { id: 'testing', name: 'Testing & Verification', percentage: 80, grade: 'A-', barColor: 'from-emerald-500 to-teal-500', note: 'Vite build verified, sandbox network tests passing' },
      { id: 'deployment', name: 'Production Build', percentage: 90, grade: 'A', barColor: 'from-emerald-500 to-teal-500', note: 'Optimized production bundle with zero compilation errors' },
    ],
    requirements: [
      {
        id: 'REQ-PP01',
        title: 'Interactive Project Dashboard with Recharts Visualizations',
        description: 'Provide live completion area charts, project breakdowns, and quick action cards.',
        priority: 'High',
        weight: 20,
        status: 'Verified',
        evidence: 'Verified in client/src/pages/DashboardPage.jsx with Recharts AreaChart & ResponsiveContainer.',
      },
      {
        id: 'REQ-PP02',
        title: 'ZIP Drag & Drop Repository Ingestion with 100MB Limit',
        description: 'Validate .zip extensions and reject files exceeding 100 megabytes.',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Verified in client/src/components/upload/ZipUpload.jsx with drag listeners and size guards.',
      },
      {
        id: 'REQ-PP03',
        title: 'Centralized React Router & Navigation System',
        description: 'Connect all core views (/dashboard, /upload, /projects, /reports, /profile, /settings).',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Verified in client/src/App.jsx with React Router v6 routing and AppLayout.',
      },
      {
        id: 'REQ-PP04',
        title: 'Backend Multer ZIP Extraction & AST Analysis Pipeline',
        description: 'Decompress uploaded archives, extract JavaScript/Python AST tokens, and verify routes.',
        priority: 'High',
        weight: 25,
        status: 'Partial',
        evidence: 'Express foundation active; unzipper controller scheduled for backend task.',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-PP01',
        feature: 'Backend Unzipper & AST Code Scanner',
        importance: 'Required for real-world automated code analysis beyond interface preview.',
        relatedRequirement: 'REQ-PP04',
        priority: 'High',
        suggestedImplementation: 'Implement server/services/unzipService.js and AST visitor in Task 3.',
      },
    ],
    recommendations: [
      {
        id: 'REC-PP01',
        title: 'Connect Multer ZIP Extraction Service',
        explanation: 'Wire Express backend endpoint to decompress archives into temporary sandboxes.',
        priority: 'High',
        impact: '+15% Progress',
        userCompleted: false,
      },
    ],
    progressTrend: [
      { run: 'Run 1 (Nov 2)', progress: 60, features: 12, target: 60 },
      { run: 'Run 2 (Nov 5)', progress: 85, features: 18, target: 80 },
    ],
    analysisHistory: [
      {
        id: 'REP-2026-402',
        date: 'Nov 5, 2026 • 11:30 IST',
        completion: 85,
        requirementsChecked: 22,
        missingFeatures: 3,
        summary: 'Dashboard, Upload, Projects, Details, Reports, Profile, and Settings verified with React Router.',
      },
    ]
  },
  {
    id: 'proj-smart-energy',
    name: 'Smart Energy Grid Monitor',
    tagline: 'IoT Substation Load Balancing',
    description:
      'IoT telemetry ingestion pipeline and substation load-balancing monitor. Awaiting initial source archive upload and feature requirements specification.',
    category: 'Backend Application',
    technologies: ['Python', 'MQTT', 'InfluxDB', 'Docker'],
    status: 'Not Analyzed',
    statusColor: 'slate',
    lastUpdated: '1 week ago',
    updatedTimestamp: 1730100000000,
    lastAnalysisDate: 'Never',
    completionPercentage: 0,
    repoBranch: 'main',
    requirementsCount: 12,
    isSample: true,
    developmentBreakdown: [
      { id: 'frontend', name: 'Frontend Development', percentage: 0, grade: 'N/A', barColor: 'from-indigo-500 to-purple-500', note: 'Pending AST inspection' },
      { id: 'backend', name: 'Backend Development', percentage: 0, grade: 'N/A', barColor: 'from-blue-500 to-cyan-500', note: 'Pending AST inspection' },
      { id: 'database', name: 'Database Integration', percentage: 0, grade: 'N/A', barColor: 'from-emerald-500 to-teal-500', note: 'Pending AST inspection' },
      { id: 'auth', name: 'Authentication System', percentage: 0, grade: 'N/A', barColor: 'from-purple-500 to-pink-500', note: 'Pending AST inspection' },
      { id: 'testing', name: 'Testing Suite', percentage: 0, grade: 'N/A', barColor: 'from-rose-500 to-amber-500', note: 'Pending AST inspection' },
      { id: 'deployment', name: 'Deployment & DevOps', percentage: 0, grade: 'N/A', barColor: 'from-amber-500 to-orange-500', note: 'Pending AST inspection' },
    ],
    requirements: [
      {
        id: 'REQ-SE01',
        title: 'MQTT Substation Sensor Ingestion Broker',
        description: 'Connect to Mosquitto MQTT broker on port 1883 and parse sensor payloads.',
        priority: 'High',
        weight: 30,
        status: 'Not Found',
        evidence: 'No source repository uploaded yet.',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-SE01',
        feature: 'Source Code Archive Upload',
        importance: 'Archive required to evaluate substation telemetry pipeline.',
        relatedRequirement: 'REQ-SE01',
        priority: 'High',
        suggestedImplementation: 'Upload project repository ZIP in the Upload Project view.',
      },
    ],
    recommendations: [
      {
        id: 'REC-SE01',
        title: 'Upload Repository Archive',
        explanation: 'Provide the codebase ZIP to initiate the AST analysis parser.',
        priority: 'High',
        impact: '+50% Progress',
        userCompleted: false,
      },
    ],
    progressTrend: [
      { run: 'Initial Registration', progress: 0, features: 0, target: 30 },
    ],
    analysisHistory: []
  }
];

/**
 * Dynamically calculate project portfolio metrics from a given project list
 */
export function calculateProjectStats(projectsList = []) {
  const total = projectsList.length;
  const completed = projectsList.filter(
    (p) => p.status === 'Completed' || (p.completionPercentage || 0) >= 90
  ).length;
  const inProgress = projectsList.filter(
    (p) => p.status === 'In Progress' && (p.completionPercentage || 0) < 90
  ).length;
  const needsAttention = projectsList.filter(
    (p) => p.status === 'Needs Attention' || p.status === 'Not Analyzed'
  ).length;

  return { total, completed, inProgress, needsAttention };
}

/**
 * Dynamically generate the 4 Dashboard Stat Cards based on shared project data
 */
export function calculateDashboardStats(projectsList = [], reportsList = []) {
  const { total, completed, inProgress, needsAttention } = calculateProjectStats(projectsList);
  const completionRate = total > 0 ? ((completed / total) * 100).toFixed(0) : '0';

  return [
    {
      id: 'total-projects',
      title: 'Total Projects',
      value: String(total),
      change: `${projectsList.filter(p => !p.isSample).length} custom created`,
      changeType: 'positive',
      description: 'Synchronized from shared repository state',
      iconName: 'FolderKanban',
      gradient: 'from-blue-600/20 to-indigo-600/10',
      borderGlow: 'hover:border-blue-500/40',
      accentColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      id: 'completed-projects',
      title: 'Completed Projects',
      value: String(completed),
      change: `${completionRate}% portfolio rate`,
      changeType: 'positive',
      description: 'Met 90%+ requirement checklists',
      iconName: 'CheckCircle2',
      gradient: 'from-emerald-600/20 to-teal-600/10',
      borderGlow: 'hover:border-emerald-500/40',
      accentColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      value: String(inProgress),
      change: 'Active iterative analysis',
      changeType: 'neutral',
      description: 'Under continuous code audit',
      iconName: 'Clock',
      gradient: 'from-purple-600/20 to-pink-600/10',
      borderGlow: 'hover:border-purple-500/40',
      accentColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      id: 'needs-attention',
      title: 'Needs Attention',
      value: String(needsAttention),
      change: needsAttention > 0 ? 'Gaps identified' : 'All targets met',
      changeType: needsAttention > 0 ? 'negative' : 'positive',
      description: needsAttention > 0 ? 'Contains unverified critical features' : 'Zero blockers detected',
      iconName: 'AlertTriangle',
      gradient: 'from-amber-600/20 to-rose-600/10',
      borderGlow: 'hover:border-amber-500/40',
      accentColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
  ];
}
