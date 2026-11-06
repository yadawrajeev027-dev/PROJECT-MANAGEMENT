# ProjectPulse AI 🚀
> **AI-Powered Software Project Analysis & Progress Tracking Platform**

ProjectPulse AI inspects uploaded software project repositories (ZIP archives), extracts and analyzes source code against user-defined functional requirements, estimates completion percentages, detects missing or implemented features, and generates actionable engineering reports.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Lightning-fast HMR, component modularity, high performance. |
| **Routing** | React Router v6 (`react-router-dom`) | Declarative client-side routing with layout nesting, dynamic params, and 404 handling. |
| **Styling & Design System** | Tailwind CSS v3.4 | Modern dark navy SaaS design system with purple/blue glowing accents, responsive breakpoints, and custom light-mode overrides. |
| **Icons** | Lucide React | Consistent, accessible, modern SVG icon set. |
| **Data Visualizations** | Recharts v3 | Responsive Area charts, radial indicators, and trend lines for code progress metrics. |
| **Global State Management** | React Context API | Modular state slices (`ProjectContext`, `ProfileContext`, `ThemeContext`, `SettingsContext`) with localStorage persistence without Redux overhead. |
| **Backend (Scaffolded)** | Node.js + Express.js | Asynchronous REST foundation with ES Modules, `/api/health` checks, and reverse proxy support. |
| **Database (Upcoming)** | MongoDB + Mongoose | Document storage for projects, requirements, reports, and user accounts. |

---

## 📂 Project Structure

```text
ProjectPulse-AI/
├── client/                                # React + Vite Frontend Application
│   ├── public/                            # Static public assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── details/                   # Project Details specialized components
│   │   │   │   ├── AnalysisTimeline.jsx
│   │   │   │   ├── DevelopmentBreakdown.jsx
│   │   │   │   ├── MissingFeatures.jsx
│   │   │   │   ├── NextActions.jsx
│   │   │   │   ├── ProjectHeader.jsx
│   │   │   │   ├── ProjectOverview.jsx
│   │   │   │   ├── ProjectProgressTrend.jsx
│   │   │   │   └── RequirementTable.jsx
│   │   │   ├── layout/                    # Layout & Shell components
│   │   │   │   └── AppLayout.jsx          # Sidebar, Topbar, Outlet, and modal orchestrator
│   │   │   ├── profile/                   # Profile components
│   │   │   │   ├── ActivitySummary.jsx
│   │   │   │   ├── ProfileForm.jsx
│   │   │   │   └── ProfileHeader.jsx
│   │   │   ├── projects/                  # My Projects views & modals
│   │   │   │   ├── DeleteProjectModal.jsx
│   │   │   │   ├── EditProjectModal.jsx
│   │   │   │   ├── ProjectActionMenu.jsx
│   │   │   │   ├── ProjectCard.jsx
│   │   │   │   ├── ProjectFilters.jsx
│   │   │   │   ├── ProjectGrid.jsx
│   │   │   │   ├── ProjectList.jsx
│   │   │   │   └── ProjectStats.jsx
│   │   │   ├── reports/                   # Reports History components
│   │   │   │   ├── ProgressComparison.jsx
│   │   │   │   ├── ReportDetail.jsx
│   │   │   │   ├── ReportExport.jsx
│   │   │   │   ├── ReportFilters.jsx
│   │   │   │   ├── ReportsTable.jsx
│   │   │   │   └── ReportStats.jsx
│   │   │   ├── settings/                  # Platform Settings components
│   │   │   │   ├── AnalysisPreferences.jsx
│   │   │   │   ├── AppearanceSettings.jsx
│   │   │   │   ├── DeleteAccountModal.jsx
│   │   │   │   ├── NotificationSettings.jsx
│   │   │   │   ├── PrivacySettings.jsx
│   │   │   │   └── SecuritySettings.jsx
│   │   │   ├── upload/                    # Upload Project components
│   │   │   │   ├── ProjectInformationForm.jsx
│   │   │   │   ├── ProjectSummary.jsx
│   │   │   │   ├── RequirementCard.jsx
│   │   │   │   ├── RequirementsBuilder.jsx
│   │   │   │   ├── ReviewProjectModal.jsx
│   │   │   │   └── ZipUpload.jsx
│   │   │   ├── AIInsights.jsx             # Actionable engineering recommendations
│   │   │   ├── AnalysisBreakdown.jsx      # Architectural 6-layer breakdown
│   │   │   ├── CircularProgress.jsx       # SVG radial progress meter
│   │   │   ├── ProgressChart.jsx          # Recharts weekly progress area chart
│   │   │   ├── ProjectCard.jsx            # Featured project dashboard hero card
│   │   │   ├── ProjectDetailsModal.jsx    # Quick overview modal
│   │   │   ├── ReanalyseModal.jsx         # Simulated re-analysis scanner modal
│   │   │   ├── RecentProjects.jsx         # Dashboard repository table
│   │   │   ├── Sidebar.jsx                # Collapsible sidebar with active route states
│   │   │   ├── StatCard.jsx               # Dashboard metric KPI card
│   │   │   └── Topbar.jsx                 # Global search, notifications, & user menu
│   │   ├── context/                       # Global React Context state management
│   │   │   ├── index.jsx                  # Bundled AppProviders & custom hook exports
│   │   │   ├── ProfileContext.jsx         # User identity & bio state
│   │   │   ├── ProjectContext.jsx         # Centralized project CRUD & calculated stats
│   │   │   ├── SettingsContext.jsx        # Notification & analysis preference state
│   │   │   └── ThemeContext.jsx           # Dark / Light / System theme controller
│   │   ├── data/                          # Shared Centralized Datasets
│   │   │   ├── centralData.js             # Single source of truth for projects & stats
│   │   │   ├── projectDetailsData.js      # Dossiers & analysis breakdown mappings
│   │   │   ├── reportsData.js             # Historical AST inspection reports
│   │   │   └── sampleData.js              # Backward-compatible re-exports & chart fixtures
│   │   ├── pages/                         # Core Routed Application Pages
│   │   │   ├── DashboardPage.jsx          # Executive dashboard (/dashboard)
│   │   │   ├── MyProjects.jsx             # Grid / List repository manager (/projects)
│   │   │   ├── NotFoundPage.jsx           # 404 Route catch-all (*)
│   │   │   ├── Profile.jsx                # User developer profile (/profile)
│   │   │   ├── ProjectDetails.jsx         # Deep inspection dossier (/projects/:id)
│   │   │   ├── ReportsHistory.jsx         # Audit trail & diff comparison (/reports, /reports/:id)
│   │   │   ├── Settings.jsx               # Appearance, preferences & security (/settings)
│   │   │   └── UploadProjectPage.jsx      # ZIP upload & requirements builder (/upload)
│   │   ├── App.css
│   │   ├── App.jsx                        # React Router Routes declaration
│   │   ├── index.css                      # Tailwind base, dark/light utility classes
│   │   └── main.jsx                       # Client entry point with BrowserRouter & Providers
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                                # Node.js + Express Backend
│   ├── src/
│   │   └── server.js                      # Express server entry point & /api/health
│   ├── .env.example                       # Environment variable template
│   └── package.json                       # Backend dependencies
│
├── .gitignore
├── package.json                           # Root orchestration scripts
└── README.md                              # Project documentation
```

---

## 🚀 Installation & Run Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v20/v24)
- **npm**: v9.0.0 or higher

### Option A: Running via Root Orchestration Scripts (Recommended)

```bash
# 1. Install dependencies for both server and client
npm run install:all

# 2. Start backend server in one terminal (Port 5000)
npm run dev:server

# 3. Start frontend client in a second terminal (Port 5173)
npm run dev:client
```

### Option B: Running Client & Server Independently

#### Terminal 1 — Backend:
```bash
cd server
npm install
npm run dev
# Running on http://localhost:5000 (Health check: http://localhost:5000/api/health)
```

#### Terminal 2 — Frontend:
```bash
cd client
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🧭 Connected Routes

| Path | View Component | Description |
| :--- | :--- | :--- |
| `/` | `Navigate` | Default redirect to `/dashboard` |
| `/dashboard` | `DashboardPage` | Executive overview, live completion chart, AI insights, and recent repos |
| `/upload` | `UploadProjectPage` | ZIP drag-and-drop, metadata form, requirements builder, and summary review |
| `/projects` | `MyProjects` | Grid and list views, search, category filters, sorting, and project CRUD |
| `/projects/:id` | `ProjectDetails` | Deep architectural dossier, layer breakdown, feature gaps, and progress trend |
| `/reports` | `ReportsHistory` | Inspection audit log, multi-factor filtering, and side-by-side comparison |
| `/reports/:id` | `ReportsHistory` | Deep-link to specific historical audit report inspection drawer |
| `/profile` | `Profile` | Developer identity, credentials, professional bio, and chronological activity trail |
| `/settings` | `Settings` | Theme switcher (Dark / Light / System), notification toggles, analysis policies, security |
| `*` | `NotFoundPage` | 404 error page with direct navigation back to Dashboard and Projects |

---

## ✅ Completed Frontend Features

1. **Centralized Client Routing**: React Router v6 integration with nested layouts, deep-linking (`/projects/:id`, `/reports/:id`), route fallback redirects, and a 404 page.
2. **Global React Context State**:
   - `ProjectContext`: Dynamic project CRUD, automatic progress recalculation upon requirement toggle, dynamic dashboard KPI calculations, and localStorage persistence.
   - `ProfileContext`: Synchronized user profile with instantaneous topbar reflection and persistence.
   - `ThemeContext`: Seamless Dark Navy, Clean Light, and OS System preference switching with dynamic root class toggling.
   - `SettingsContext`: Notification preferences, analysis engine configurations, and factory reset functionality.
3. **Harmonized Shared Data**:
   - Canonical stable unique IDs (`proj-food-quality`, `proj-humaniza-ai`, `proj-hostel-mgmt`, `proj-projectpulse-ai`, `proj-smart-energy`).
   - All 9 historical reports reference existing project IDs.
   - Report comparisons enforce same-project constraint with validation alert banners.
4. **Rich Interactive Views**:
   - **Upload Project**: ZIP archive size validation (100MB max limit), drag & drop, interactive requirement creation with priority and weights, draft save/restore.
   - **My Projects**: Real-time multi-attribute search, status filters (Completed, In Progress, Needs Attention), tech badges, grid/list view toggles, edit modal, delete modal.
   - **Project Details**: Circular SVG completion meter, 6-layer architecture breakdown, missing features gap analysis, prioritized next actions, and velocity trend line chart.
   - **Reports History**: Side-by-side comparison diff between two reports of the same project, JSON export download, and printable audit reports.
   - **Profile & Settings**: Interactive profile editing with regex validation, active session monitors, password validation form, and danger zone local data purge modal.

---

## ⏳ Features Awaiting Backend Implementation

The following capabilities are deliberately pending backend and database integration in subsequent tasks:

1. **ZIP Extraction Service**: Multer file upload handler and unzipper pipeline in Node.js to unpack project archives into sandboxed directories.
2. **AST Static Code Analysis Engine**: Babel/ESprima/Acorn parser for JavaScript and AST visitors for Python to extract routes, models, and controllers.
3. **Automated AI Requirement Evaluation**: LLM integration (OpenAI API / Gemini API) to verify code evidence against requirement descriptions.
4. **Persistent MongoDB Database**: Real database schemas (Users, Projects, Requirements, Reports) replacing browser `localStorage`.
5. **Authentication & Authorization**: Real JWT token issuance, refresh rotation, bcrypt password hashing, and user registration endpoints.
