import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters long'],
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      trim: true,
      default: 'Web Application',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    technologies: {
      type: [String],
      default: [],
    },
    targetMilestoneDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'uploaded', 'pending', 'analyzing', 'completed', 'failed'],
        message: 'Status must be one of: draft, uploaded, pending, analyzing, completed, failed',
      },
      default: 'draft',
    },
    // File metadata & storage reference (ZIP binary data is NOT stored in MongoDB)
    originalZipName: {
      type: String,
      trim: true,
      default: '',
    },
    zipFileSize: {
      type: Number,
      default: 0,
      min: [0, 'ZIP file size cannot be negative'],
    },
    zipStoragePath: {
      type: String,
      trim: true,
      default: '',
      select: false, // Protected: Never exposed in regular queries
    },
    latestReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnalysisReport',
      default: null,
    },
    // Extraction metadata \u0026 storage reference (protected)
    extractionLockToken: { type: String, default: null },
    extractionStartedAt: { type: Date, default: null },
    // Source analysis locking (protected)
    analysisLockToken: { type: String, default: null },
    analysisStartedAt: { type: Date, default: null },
    // Requirement verification locking (protected)
    verificationLockToken: { type: String, default: null },
    verificationStartedAt: { type: Date, default: null },
    // AI recommendation generation locking (protected)
    aiLockToken: { type: String, default: null },
    aiStartedAt: { type: Date, default: null },
    // Step 10: Progress calculation locking & metrics
    progressLockToken: { type: String, default: null },
    progressStartedAt: { type: Date, default: null },
    overallProgress: {
      type: Number,
      default: 0,
      min: [0, 'Progress percentage cannot be below 0%'],
      max: [100, 'Progress percentage cannot exceed 100%'],
    },
    progressStatus: {
      type: String,
      enum: {
        values: ['FINAL', 'PROVISIONAL', null],
        message: 'Progress status must be FINAL, PROVISIONAL, or null',
      },
      default: null,
    },
    verificationCoverage: {
      type: Number,
      default: 0,
      min: [0, 'Verification coverage cannot be below 0%'],
      max: [100, 'Verification coverage cannot exceed 100%'],
    },
    extractionStatus: {
      type: String,
      enum: {
        values: ['pending', 'extracting', 'completed', 'failed'],
        message: 'Extraction status must be one of: pending, extracting, completed, failed',
      },
      default: 'pending',
    },
    extractedStoragePath: {
      type: String,
      trim: true,
      default: '',
      select: false, // Protected: Never exposed in regular queries
    },
    extractedFileCount: {
      type: Number,
      default: 0,
      min: [0, 'Extracted file count cannot be negative'],
    },
    extractedTotalSize: {
      type: Number,
      default: 0,
      min: [0, 'Extracted total size cannot be negative'],
    },
    extractedAt: {
      type: Date,
      default: null,
    },
    extractionError: {
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
        delete ret.zipStoragePath;
        delete ret.extractedStoragePath;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret.zipStoragePath;
        delete ret.extractedStoragePath;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Database Indexes
projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;
