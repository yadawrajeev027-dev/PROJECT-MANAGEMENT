import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    severity: {
      type: String,
      enum: {
        values: ['info', 'warning', 'error', 'critical'],
        message: 'Severity must be one of: info, warning, error, critical',
      },
      default: 'info',
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    filePath: {
      type: String,
      trim: true,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

const analysisReportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Analysis report must be associated with a project'],
    },
    analysisVersion: {
      type: String,
      trim: true,
      default: '1.0.0',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'extracting', 'analyzing', 'completed', 'failed'],
        message: 'Status must be one of: pending, extracting, analyzing, completed, failed',
      },
      default: 'pending',
    },
    // Requirement Metrics (defaults strictly 0; never fabricated for pending/failed status)
    totalRequirements: {
      type: Number,
      default: 0,
      min: [0, 'Total requirements count cannot be negative'],
    },
    verifiedCount: {
      type: Number,
      default: 0,
      min: [0, 'Verified count cannot be negative'],
    },
    partialCount: {
      type: Number,
      default: 0,
      min: [0, 'Partial count cannot be negative'],
    },
    notFoundCount: {
      type: Number,
      default: 0,
      min: [0, 'Not found count cannot be negative'],
    },
    needsReviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Needs review count cannot be negative'],
    },
    pendingCount: {
      type: Number,
      default: 0,
      min: [0, 'Pending count cannot be negative'],
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Progress percentage cannot be below 0%'],
      max: [100, 'Progress percentage cannot exceed 100%'],
    },
    detectedTechnologies: {
      type: [String],
      default: [],
    },
    findings: {
      type: [findingSchema],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },

    // ── Step 7: Source Code Analysis Results ──────────────────────────────
    // Stored as Mixed to allow flexible schema evolution without breaking
    // existing documents. All absolute paths are stripped before persisting.
    sourceAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // ── Step 9: AI Analysis & Actionable Recommendations ──────────────────
    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // ── Step 10: Deterministic Progress & Coverage Snapshot ────────────────
    progressMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Atomic lock for concurrent analysis prevention
    analysisLockToken: { type: String, default: null },
    analysisStartedAt: { type: Date, default: null },

    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Database Indexes
analysisReportSchema.index({ project: 1, createdAt: -1 });
analysisReportSchema.index({ status: 1 });

const AnalysisReport =
  mongoose.models.AnalysisReport || mongoose.model('AnalysisReport', analysisReportSchema);

export default AnalysisReport;
