/**
 * ProjectPulse AI - Comprehensive Illustrative Project Dossiers
 * 
 * IMPORTANT:
 * All records in this file represent illustrative sample analysis dossiers
 * designed for interface demonstration and software engineering interview explanation.
 * In Task 4 and Task 5, these structures will be populated dynamically by the
 * AST static parser and OpenAI/LLM requirement evaluator.
 */

import { MY_PROJECTS_SAMPLE_DATA, INITIAL_PROJECTS } from './sampleData.js';

export const DETAILED_PROJECTS = {
  'proj-food-quality': {
    id: 'proj-food-quality',
    name: 'Food Quality Prediction',
    tagline: 'Multi-Sensor Spectral Regression & Freshness Classification',
    description:
      'Machine learning and sensor regression pipeline predicting freshness metrics, spoilage indicators, and estimated shelf-life based on spectral telemetry.',
    category: 'Machine Learning',
    technologies: ['FastAPI', 'React', 'Python', 'Scikit-Learn', 'MongoDB'],
    status: 'In Progress',
    lastUpdated: '2 hours ago',
    lastAnalysisDate: 'Nov 4, 2026 • 14:32 IST',
    completionPercentage: 74,
    totalRequirements: 18,
    completedRequirements: 12,
    partialRequirements: 2,
    missingRequirements: 4,
    repoBranch: 'main',
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
        description: 'SVG circular gauge displaying spoilage probability and estimated hours before quality threshold breaches.',
        priority: 'Medium',
        weight: 15,
        status: 'Verified',
        evidence: 'Implemented in client/src/components/Gauge.jsx with dynamic color transitions (Green -> Amber -> Red).',
      },
      {
        id: 'REQ-005',
        title: 'User Authentication & Role-Based Access Control',
        description: 'JWT Bearer token authentication with roles (Lab Technician, Quality Inspector, Admin).',
        priority: 'High',
        weight: 15,
        status: 'Partial',
        evidence: 'JWT token verification middleware active in server/middleware/auth.py, but role checking logic is hardcoded.',
      },
      {
        id: 'REQ-006',
        title: 'Token-Bucket Rate Limiter on Prediction Endpoint',
        description: 'Limit prediction requests to 60 calls/minute per client IP to safeguard ML compute capacity.',
        priority: 'Medium',
        weight: 10,
        status: 'Not Found',
        evidence: 'No rate limiting or Redis throttling middleware found in FastAPI router stack.',
      },
      {
        id: 'REQ-007',
        title: 'Automated Pytest ML Inference Failure Edge Cases',
        description: 'Test suite simulating corrupted sensor arrays, NaN spectral bands, and out-of-order batches.',
        priority: 'High',
        weight: 15,
        status: 'Not Found',
        evidence: 'tests/ directory only contains 2 basic sanity checks; zero edge-case or failure mode tests exist.',
      },
      {
        id: 'REQ-008',
        title: 'Batch CSV Telemetry Import & Background Job Queue',
        description: 'Upload multipart CSV with asynchronous Celery or background task execution.',
        priority: 'Low',
        weight: 10,
        status: 'Needs Review',
        evidence: 'Found partial prototype in server/api/batch.py, but no Celery worker or task broker connection is configured.',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-01',
        feature: 'Automated Pytest Inference Failure Suite',
        importance: 'Without automated failure simulations, corrupted or zero-length spectral batches could cause unhandled NumPy exceptions in production.',
        relatedRequirement: 'REQ-007',
        priority: 'High',
        suggestedImplementation: 'Create tests/test_inference.py utilizing pytest parameterized fixtures to assert HTTP 422 Unprocessable Entity when values are NaN or out-of-bounds.',
      },
      {
        id: 'MF-02',
        feature: 'API Rate Limiting Middleware',
        importance: 'The ML model prediction route is compute-intensive; unthrottled requests expose the server to denial-of-service and memory exhaustion.',
        relatedRequirement: 'REQ-006',
        priority: 'Medium',
        suggestedImplementation: 'Add slowapi (token-bucket limiter) to FastAPI: @limiter.limit("60/minute") on the /api/v1/predict route.',
      },
      {
        id: 'MF-03',
        feature: 'Granular Role-Based Route Guards',
        importance: 'Currently any authenticated user can overwrite calibration thresholds intended strictly for Lab Administrators.',
        relatedRequirement: 'REQ-005',
        priority: 'Medium',
        suggestedImplementation: 'Extend Depends(get_current_user) with a require_roles(["Admin", "LabHead"]) dependency injection decorator.',
      },
    ],
    recommendations: [
      {
        id: 'REC-01',
        title: 'Implement Pytest Suite for ML Model Inference Edge Cases',
        explanation: 'Write parameterized unit tests exercising invalid wavelength arrays, corrupted inputs, and unexpected telemetry shapes.',
        priority: 'High',
        impact: '+10% Overall Progress',
        userCompleted: false,
      },
      {
        id: 'REC-02',
        title: 'Add slowapi Rate-Limiting to Prediction Controller',
        explanation: 'Protect the compute-heavy regression route from request flooding by adding IP-based throttling headers.',
        priority: 'Medium',
        impact: '+6% Overall Progress',
        userCompleted: false,
      },
      {
        id: 'REC-03',
        title: 'Refactor Role-Based Guard Dependencies',
        explanation: 'Replace hardcoded role checks with reusable FastAPI security dependencies on admin-restricted endpoints.',
        priority: 'Medium',
        impact: '+5% Overall Progress',
        userCompleted: false,
      },
      {
        id: 'REC-04',
        title: 'Configure GitHub Actions CI Workflow',
        explanation: 'Set up .github/workflows/ci.yml to automatically run linting and tests on every pull request.',
        priority: 'Low',
        impact: '+5% Overall Progress',
        userCompleted: false,
      },
    ],
    analysisHistory: [
      {
        id: 'RUN-104',
        date: 'Nov 4, 2026 • 14:32',
        completion: 74,
        requirementsChecked: 18,
        missingFeatures: 4,
        summary: 'Latest AST scan: Ingestion routes and Scikit-Learn pipeline verified. Missing automated test suite and rate limiter.',
      },
      {
        id: 'RUN-103',
        date: 'Oct 28, 2026 • 11:15',
        completion: 62,
        requirementsChecked: 18,
        missingFeatures: 7,
        summary: 'Added FastAPI Pydantic schemas and MongoDB historical collection indices.',
      },
      {
        id: 'RUN-102',
        date: 'Oct 21, 2026 • 16:40',
        completion: 48,
        requirementsChecked: 18,
        missingFeatures: 10,
        summary: 'Initial repository structure detected; basic ML model serializer and React scaffold verified.',
      },
      {
        id: 'RUN-101',
        date: 'Oct 14, 2026 • 09:20',
        completion: 28,
        requirementsChecked: 18,
        missingFeatures: 14,
        summary: 'Initial ZIP archive uploaded with raw Jupyter notebook dataset scripts.',
      },
    ],
    progressTrend: [
      { run: 'Run 1 (Oct 14)', progress: 28, features: 4, target: 30 },
      { run: 'Run 2 (Oct 21)', progress: 48, features: 8, target: 50 },
      { run: 'Run 3 (Oct 28)', progress: 62, features: 11, target: 65 },
      { run: 'Run 4 (Nov 4)', progress: 74, features: 14, target: 75 },
    ],
  },

  'proj-humaniza-ai': {
    id: 'proj-humaniza-ai',
    name: 'HumanizaAI',
    tagline: 'Synthetic Content Paraphraser & Tone Modulation Engine',
    description:
      'Natural language processing platform that transforms synthetic AI text into nuanced, human-sounding content with customizable tone adjustments.',
    category: 'Web Application',
    technologies: ['Next.js', 'React', 'TypeScript', 'Node.js', 'OpenAI API', 'Tailwind CSS'],
    status: 'Completed',
    lastUpdated: 'Yesterday',
    lastAnalysisDate: 'Nov 3, 2026 • 16:10 IST',
    completionPercentage: 92,
    totalRequirements: 24,
    completedRequirements: 22,
    partialRequirements: 1,
    missingRequirements: 1,
    repoBranch: 'production',
    isSample: true,
    developmentBreakdown: [
      { id: 'frontend', name: 'Frontend Development', percentage: 95, grade: 'A+', barColor: 'from-indigo-500 to-purple-500', note: 'Split-screen text editor, tone selector, readability scores' },
      { id: 'backend', name: 'Backend Development', percentage: 92, grade: 'A', barColor: 'from-blue-500 to-cyan-500', note: 'Next.js App Router API routes, streaming SSE completions' },
      { id: 'database', name: 'Database Integration', percentage: 90, grade: 'A', barColor: 'from-emerald-500 to-teal-500', note: 'PostgreSQL with Prisma ORM, user credit tracking, prompt logs' },
      { id: 'auth', name: 'Authentication System', percentage: 94, grade: 'A', barColor: 'from-purple-500 to-pink-500', note: 'NextAuth.js with Google OAuth & magic link email authentication' },
      { id: 'testing', name: 'Testing Suite', percentage: 88, grade: 'B+', barColor: 'from-emerald-500 to-teal-500', note: 'Vitest unit tests and Playwright end-to-end regression tests' },
      { id: 'deployment', name: 'Deployment & DevOps', percentage: 95, grade: 'A+', barColor: 'from-blue-500 to-indigo-500', note: 'Automated Vercel Edge deployments with database connection pooling' },
    ],
    requirements: [
      {
        id: 'REQ-101',
        title: 'Streaming SSE Paraphrase Endpoint',
        description: 'Server-Sent Events route streaming token-by-token humanized transformations.',
        priority: 'High',
        weight: 20,
        status: 'Verified',
        evidence: 'Implemented in app/api/humanize/route.ts utilizing OpenAI streaming ReadableStream.',
      },
      {
        id: 'REQ-102',
        title: 'Tone Modulation Presets (Academic, Casual, Executive)',
        description: 'Custom system prompts and temperature adjustments tailored per selected tone.',
        priority: 'Medium',
        weight: 15,
        status: 'Verified',
        evidence: 'System prompt registry verified in lib/prompts/tone_engine.ts.',
      },
      {
        id: 'REQ-103',
        title: 'Stripe Subscription & Credit Billing Webhooks',
        description: 'Webhook listener verifying subscription status and allocating word credit tokens.',
        priority: 'High',
        weight: 25,
        status: 'Verified',
        evidence: 'Stripe signature verification verified in app/api/webhooks/stripe/route.ts.',
      },
      {
        id: 'REQ-104',
        title: 'Export to DOCX and Markdown Format',
        description: 'Client-side generation of downloadable formatted documents.',
        priority: 'Low',
        weight: 10,
        status: 'Verified',
        evidence: 'Utilizes docx npm library in components/ExportButton.tsx.',
      },
      {
        id: 'REQ-105',
        title: 'Plagiarism & AI Detection Score Estimator',
        description: 'Pre-computation of perplexity and burstiness metrics before returning text.',
        priority: 'Medium',
        weight: 15,
        status: 'Partial',
        evidence: 'Perplexity formula coded in lib/metrics.ts; burstiness calculation still returns stub values.',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-11',
        feature: 'Burstiness Metric Calculation Engine',
        importance: 'Burstiness is critical to estimating how easily AI detection algorithms spot synthetic text patterns.',
        relatedRequirement: 'REQ-105',
        priority: 'Low',
        suggestedImplementation: 'Complete the sentence-length variance algorithm in lib/metrics.ts.',
      },
    ],
    recommendations: [
      {
        id: 'REC-11',
        title: 'Finalize Burstiness Sentence Variance Calculation',
        explanation: 'Compute statistical standard deviation of sentence lengths to finish plagiarism estimation.',
        priority: 'Low',
        impact: '+5% Overall Progress',
        userCompleted: false,
      },
    ],
    analysisHistory: [
      {
        id: 'RUN-203',
        date: 'Nov 3, 2026 • 16:10',
        completion: 92,
        requirementsChecked: 24,
        missingFeatures: 1,
        summary: 'Near production-ready. Stripe webhooks and streaming SSE routes fully verified.',
      },
      {
        id: 'RUN-202',
        date: 'Oct 24, 2026 • 12:30',
        completion: 78,
        requirementsChecked: 24,
        missingFeatures: 5,
        summary: 'Authentication and NextAuth integration confirmed.',
      },
      {
        id: 'RUN-201',
        date: 'Oct 10, 2026 • 10:00',
        completion: 50,
        requirementsChecked: 24,
        missingFeatures: 12,
        summary: 'Initial UI components and basic OpenAI API wrapper detected.',
      },
    ],
    progressTrend: [
      { run: 'Run 1 (Oct 10)', progress: 50, features: 12, target: 55 },
      { run: 'Run 2 (Oct 24)', progress: 78, features: 19, target: 75 },
      { run: 'Run 3 (Nov 3)', progress: 92, features: 22, target: 90 },
    ],
  },

  'proj-hostel-mgmt': {
    id: 'proj-hostel-mgmt',
    name: 'Hostel Management System',
    tagline: 'Student Residency, Room Allotment & Mess Accounting Portal',
    description:
      'Comprehensive administrative portal managing room allocation, student tenancy records, mess billing calculations, maintenance requests, and digital gate passes.',
    category: 'Full-Stack Application',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Tailwind CSS'],
    status: 'Needs Attention',
    lastUpdated: '3 days ago',
    lastAnalysisDate: 'Nov 1, 2026 • 18:20 IST',
    completionPercentage: 46,
    totalRequirements: 30,
    completedRequirements: 14,
    partialRequirements: 4,
    missingRequirements: 12,
    repoBranch: 'feature/mess-billing',
    isSample: true,
    developmentBreakdown: [
      { id: 'frontend', name: 'Frontend Development', percentage: 55, grade: 'C', barColor: 'from-indigo-500 to-purple-500', note: 'Admin student table and room grid built; student portal views missing' },
      { id: 'backend', name: 'Backend Development', percentage: 50, grade: 'C-', barColor: 'from-blue-500 to-cyan-500', note: 'Room and student controllers exist; billing calculation logic incomplete' },
      { id: 'database', name: 'Database Integration', percentage: 60, grade: 'B-', barColor: 'from-emerald-500 to-teal-500', note: 'Mongoose schemas created; missing transaction rollback for room bookings' },
      { id: 'auth', name: 'Authentication System', percentage: 48, grade: 'D+', barColor: 'from-purple-500 to-pink-500', note: 'Basic login route works; password reset and role middleware absent' },
      { id: 'testing', name: 'Testing Suite', percentage: 20, grade: 'F', barColor: 'from-rose-500 to-amber-500', note: 'No tests found in repository' },
      { id: 'deployment', name: 'Deployment & DevOps', percentage: 30, grade: 'F', barColor: 'from-amber-500 to-orange-500', note: 'No containerization or deployment scripts' },
    ],
    requirements: [
      {
        id: 'REQ-201',
        title: 'Room Inventory & Floor Allocation Grid',
        description: 'Interactive room grid displaying bed vacancy, maintenance status, and wing filters.',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Room inventory component verified in client/src/components/RoomGrid.jsx; GET /api/rooms functional.',
      },
      {
        id: 'REQ-202',
        title: 'Student Tenancy Record Management',
        description: 'CRUD operations for student personal records, guardian contacts, and enrollment IDs.',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Student controller in server/controllers/studentController.js handles validation and creation.',
      },
      {
        id: 'REQ-203',
        title: 'Monthly Mess Billing Calculation Engine',
        description: 'Compute dynamic mess fees factoring daily rebates, absent leaves, and utility surcharges.',
        priority: 'High',
        weight: 20,
        status: 'Partial',
        evidence: 'Mess bill schema exists, but rebate calculation function in billingService.js is commented out.',
      },
      {
        id: 'REQ-204',
        title: 'Digital Gate Pass QR Code Generator',
        description: 'Student gate pass requests with warden approval workflow and QR verification.',
        priority: 'Medium',
        weight: 15,
        status: 'Not Found',
        evidence: 'No routes or controllers found for gatepass generation or QR verification.',
      },
      {
        id: 'REQ-205',
        title: 'Maintenance Complaint Ticket System',
        description: 'Ticket submission with status updates (Open, In Progress, Resolved).',
        priority: 'Medium',
        weight: 10,
        status: 'Not Found',
        evidence: 'No complaint schema or controller detected in codebase.',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-21',
        feature: 'Atomic Database Transactions on Room Booking',
        importance: 'Without MongoDB sessions/transactions, two wardens allocating the same bed simultaneously will cause double-booking concurrency bugs.',
        relatedRequirement: 'REQ-201',
        priority: 'High',
        suggestedImplementation: 'Wrap room status update and student booking inside mongoose.startSession() and session.withTransaction().',
      },
      {
        id: 'MF-22',
        feature: 'Mess Rebate Calculation Service',
        importance: 'Students taking authorized leave are legally entitled to mess fee deductions; leaving this calculation unbuilt causes inaccurate invoicing.',
        relatedRequirement: 'REQ-203',
        priority: 'High',
        suggestedImplementation: 'Uncomment and implement the calculateRebate(studentId, month) helper in server/services/billingService.js.',
      },
      {
        id: 'MF-23',
        feature: 'Role-Based Warden & Student Route Middleware',
        importance: 'Currently any logged-in user can invoke warden endpoints to approve requests.',
        relatedRequirement: 'REQ-202',
        priority: 'High',
        suggestedImplementation: 'Add checkRole(["Warden", "Admin"]) middleware to protect administrative routes.',
      },
    ],
    recommendations: [
      {
        id: 'REC-21',
        title: 'Implement MongoDB Transactions for Room Allotment',
        explanation: 'Prevent race conditions when multiple users book the same room concurrently.',
        priority: 'High',
        impact: '+12% Overall Progress',
        userCompleted: false,
      },
      {
        id: 'REC-22',
        title: 'Complete Mess Rebate Invoicing Routine',
        explanation: 'Calculate student leave days against fixed mess rates to generate accurate monthly billing.',
        priority: 'High',
        impact: '+10% Overall Progress',
        userCompleted: false,
      },
      {
        id: 'REC-23',
        title: 'Build Student Gate Pass Request Workflow',
        explanation: 'Create Mongoose GatePass schema and student request form with status tracking.',
        priority: 'Medium',
        impact: '+8% Overall Progress',
        userCompleted: false,
      },
    ],
    analysisHistory: [
      {
        id: 'RUN-302',
        date: 'Nov 1, 2026 • 18:20',
        completion: 46,
        requirementsChecked: 30,
        missingFeatures: 12,
        summary: 'Room allotment active, but critical billing logic and transactions remain missing.',
      },
      {
        id: 'RUN-301',
        date: 'Oct 18, 2026 • 14:00',
        completion: 24,
        requirementsChecked: 30,
        missingFeatures: 22,
        summary: 'Initial Express backend scaffolding and student collection models.',
      },
    ],
    progressTrend: [
      { run: 'Run 1 (Oct 18)', progress: 24, features: 7, target: 35 },
      { run: 'Run 2 (Nov 1)', progress: 46, features: 14, target: 50 },
    ],
  },

  'proj-projectpulse-ai': {
    id: 'proj-projectpulse-ai',
    name: 'ProjectPulse AI',
    tagline: 'Automated Codebase Inspection & Requirement Verification Engine',
    description:
      'AI-powered software project analysis and progress tracking platform. Ingests source code ZIPs, maps AST routes, and audits feature completion against requirements.',
    category: 'Developer Tooling',
    technologies: ['React', 'Vite', 'Node.js', 'Express', 'Tailwind CSS', 'Recharts'],
    status: 'In Progress',
    lastUpdated: 'Just now',
    lastAnalysisDate: 'Nov 5, 2026 • 10:30 IST',
    completionPercentage: 35,
    totalRequirements: 22,
    completedRequirements: 8,
    partialRequirements: 2,
    missingRequirements: 12,
    repoBranch: 'develop',
    isSample: true,
    developmentBreakdown: [
      { id: 'frontend', name: 'Frontend Architecture', percentage: 85, grade: 'A', barColor: 'from-indigo-500 to-purple-500', note: 'Dashboard, Upload Page, My Projects, and Project Details views implemented' },
      { id: 'backend', name: 'Backend API Server', percentage: 30, grade: 'D+', barColor: 'from-blue-500 to-cyan-500', note: 'Express server, CORS, and GET /api/health running on port 5000' },
      { id: 'database', name: 'Database Models', percentage: 10, grade: 'F', barColor: 'from-emerald-500 to-teal-500', note: 'MongoDB connection & Mongoose schemas scheduled for Task 2' },
      { id: 'auth', name: 'Authentication System', percentage: 10, grade: 'F', barColor: 'from-purple-500 to-pink-500', note: 'Client auth views ready; backend JWT tokens scheduled for future task' },
      { id: 'testing', name: 'Testing Suite', percentage: 25, grade: 'F', barColor: 'from-rose-500 to-amber-500', note: 'Frontend production build passes; integration testing harness pending' },
      { id: 'deployment', name: 'DevOps & Packaging', percentage: 35, grade: 'D', barColor: 'from-amber-500 to-orange-500', note: 'Vite build scripts and clean root orchestration configured' },
    ],
    requirements: [
      {
        id: 'REQ-301',
        title: 'Decoupled Client & Server Project Scaffolding',
        description: 'Vite React frontend in client/ and Node Express ES module backend in server/.',
        priority: 'High',
        weight: 15,
        status: 'Verified',
        evidence: 'Verified in repository structure; GET /api/health responding on port 5000.',
      },
      {
        id: 'REQ-302',
        title: 'Professional SaaS Dashboard & Data Visualizations',
        description: 'Multi-card dashboard with Recharts weekly velocity area chart and metric cards.',
        priority: 'High',
        weight: 20,
        status: 'Verified',
        evidence: 'Implemented in client/src/components/ProgressChart.jsx with responsive tooltip.',
      },
      {
        id: 'REQ-303',
        title: 'Interactive Project Upload & Specification Form',
        description: 'Drag & drop ZIP file component with 100MB limit, requirements builder, and review modal.',
        priority: 'High',
        weight: 20,
        status: 'Verified',
        evidence: 'Implemented in client/src/pages/UploadProjectPage.jsx with localStorage draft sync.',
      },
      {
        id: 'REQ-304',
        title: 'Project Repository Management & Dynamic KPI Filters',
        description: 'Searchable repository table and grid view with dynamic statistics and action menus.',
        priority: 'Medium',
        weight: 15,
        status: 'Verified',
        evidence: 'Implemented in client/src/pages/MyProjects.jsx with live stats calculation.',
      },
      {
        id: 'REQ-305',
        title: 'MongoDB Mongoose Schemas & Database Persistence',
        description: 'Project, Requirement, and AnalysisReport Mongoose models.',
        priority: 'High',
        weight: 20,
        status: 'Not Found',
        evidence: 'Scheduled for upcoming backend database phase (Task 2).',
      },
      {
        id: 'REQ-306',
        title: 'Multer File Ingestion & ZIP Extraction Engine',
        description: 'Multipart streaming file upload with directory path sanitization and unzipping.',
        priority: 'High',
        weight: 20,
        status: 'Not Found',
        evidence: 'Scheduled for upcoming file storage phase (Task 3).',
      },
    ],
    missingFeatures: [
      {
        id: 'MF-31',
        feature: 'Mongoose Database Schema Layer',
        importance: 'Projects and analysis reports must be persisted in MongoDB collections to survive server restarts.',
        relatedRequirement: 'REQ-305',
        priority: 'High',
        suggestedImplementation: 'Create server/src/models/Project.js and server/src/models/Analysis.js with Mongoose connection in Task 2.',
      },
      {
        id: 'MF-32',
        feature: 'Multer ZIP File Stream Processor',
        importance: 'Enables real ZIP uploads from the client to be safely decompressed into temporary disk sandboxes for AST parsing.',
        relatedRequirement: 'REQ-306',
        priority: 'High',
        suggestedImplementation: 'Configure multer with diskStorage and fileFilter to accept only .zip archives in Task 3.',
      },
    ],
    recommendations: [
      {
        id: 'REC-31',
        title: 'Configure MongoDB Database Connection & Schemas',
        explanation: 'Define Mongoose schemas for Projects, Requirements, and Reports to establish the database layer.',
        priority: 'High',
        impact: '+20% Overall Progress',
        userCompleted: false,
      },
      {
        id: 'REC-32',
        title: 'Implement Multer Archive Ingestion Route',
        explanation: 'Create POST /api/projects/upload endpoint accepting multipart form data with ZIP validation.',
        priority: 'High',
        impact: '+18% Overall Progress',
        userCompleted: false,
      },
    ],
    analysisHistory: [
      {
        id: 'RUN-402',
        date: 'Nov 5, 2026 • 10:30',
        completion: 35,
        requirementsChecked: 22,
        missingFeatures: 12,
        summary: 'Frontend architecture, Upload Wizard, and My Projects repository complete. Backend database next.',
      },
      {
        id: 'RUN-401',
        date: 'Nov 5, 2026 • 09:15',
        completion: 15,
        requirementsChecked: 22,
        missingFeatures: 18,
        summary: 'Phase 1 core initialization: Express server with GET /api/health and React Vite client.',
      },
    ],
    progressTrend: [
      { run: 'Run 1 (09:15)', progress: 15, features: 3, target: 20 },
      { run: 'Run 2 (10:30)', progress: 35, features: 8, target: 40 },
    ],
  },
};

/**
 * Universal project details resolver
 * Matches either known sample projects or custom user-uploaded projects
 */
export function getProjectDetails(projectId) {
  if (!projectId) return null;

  // 1. Direct match in sample detailed projects
  if (DETAILED_PROJECTS[projectId]) {
    return DETAILED_PROJECTS[projectId];
  }

  // 2. Check if it's a custom project saved in localStorage
  try {
    const custom = JSON.parse(localStorage.getItem('projectpulse_custom_projects') || '[]');
    const foundCustom = custom.find((p) => p.id === projectId);
    if (foundCustom) {
      // Synthesize a clean detailed dossier for custom projects
      return {
        id: foundCustom.id,
        name: foundCustom.name,
        tagline: foundCustom.category + ' Project',
        description: foundCustom.description || 'Custom project uploaded to workspace repository.',
        category: foundCustom.category || 'Web Application',
        technologies: foundCustom.technologies || ['JavaScript', 'React'],
        status: foundCustom.status || 'In Progress',
        lastUpdated: foundCustom.lastUpdated || 'Just now',
        lastAnalysisDate: 'Pending Initial Scan',
        completionPercentage: foundCustom.completionPercentage || 0,
        totalRequirements: foundCustom.requirementsCount || 4,
        completedRequirements: 0,
        partialRequirements: 0,
        missingRequirements: foundCustom.requirementsCount || 4,
        repoBranch: foundCustom.repoBranch || 'main',
        isSample: false,
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
            id: 'REQ-CUSTOM-1',
            title: 'Initial Archive Decompression & AST Route Mapping',
            description: 'Extract uploaded ZIP archive and detect express/fastapi route controllers.',
            priority: 'High',
            weight: 25,
            status: 'Not Found',
            evidence: 'Waiting for Task 3 backend unzipper execution.',
          },
        ],
        missingFeatures: [
          {
            id: 'MF-CUSTOM-1',
            feature: 'Initial Source Ingestion & Extraction',
            importance: 'Required before static AST scanner can evaluate project code.',
            relatedRequirement: 'REQ-CUSTOM-1',
            priority: 'High',
            suggestedImplementation: 'Trigger analysis once backend extraction endpoints are active.',
          },
        ],
        recommendations: [
          {
            id: 'REC-CUSTOM-1',
            title: 'Trigger Initial Code Inspection',
            explanation: 'Initiate file extraction and AST route discovery.',
            priority: 'High',
            impact: '+25% Progress',
            userCompleted: false,
          },
        ],
        analysisHistory: [
          {
            id: 'RUN-INIT',
            date: 'Registered Just Now',
            completion: 0,
            requirementsChecked: foundCustom.requirementsCount || 4,
            missingFeatures: foundCustom.requirementsCount || 4,
            summary: 'Project registered in local workspace. Awaiting backend extraction pipeline.',
          },
        ],
        progressTrend: [
          { run: 'Registered', progress: 0, features: 0, target: 20 },
        ],
      };
    }
  } catch (e) {
    console.warn('Error reading custom projects for details:', e);
  }

  // 3. Fallback: check INITIAL_PROJECTS and MY_PROJECTS_SAMPLE_DATA
  const matchedInitial = (INITIAL_PROJECTS || []).find(
    (p) => p.id === projectId || p.name.toLowerCase() === (projectId || '').toLowerCase()
  );
  if (matchedInitial) {
    if (DETAILED_PROJECTS[matchedInitial.id]) {
      return DETAILED_PROJECTS[matchedInitial.id];
    }
    return matchedInitial;
  }

  const fallback = MY_PROJECTS_SAMPLE_DATA.find(
    (p) => p.id === projectId || p.name.toLowerCase() === (projectId || '').toLowerCase()
  );
  if (fallback && DETAILED_PROJECTS[fallback.id]) {
    return DETAILED_PROJECTS[fallback.id];
  }

  return null;
}
