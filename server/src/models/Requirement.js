import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema(
  {
    filePath: {
      type: String,
      trim: true,
      default: '',
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    lineStart: {
      type: Number,
      default: null,
    },
    lineEnd: {
      type: Number,
      default: null,
    },
    evidenceType: {
      type: String,
      trim: true,
      default: 'code',
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    strength: {
      type: String,
      enum: ['strong', 'moderate', 'weak'],
      default: 'moderate',
    },
    snippet: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const requirementSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Requirement must be associated with a project'],
    },
    requirementCode: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Requirement title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Priority must be one of: low, medium, high, critical',
      },
      default: 'medium',
    },
    weight: {
      type: Number,
      required: [true, 'Requirement weight is required'],
      min: [0, 'Weight must be at least 0'],
      default: 1,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'partial', 'not_found', 'needs_review'],
        message: 'Status must be one of: pending, verified, partial, not_found, needs_review',
      },
      default: 'pending', // Default is strictly "pending" - never initialize as "not_found"
    },
    evidence: {
      type: [evidenceSchema],
      default: [],
    },
    verificationMethod: {
      type: String,
      trim: true,
      default: '',
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    analysisReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnalysisReport',
      default: null,
    },
    verifiedAt: {
      type: Date,
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
requirementSchema.index({ project: 1 });
// Compound unique index ensuring requirementCode is unique within a project when provided
requirementSchema.index(
  { project: 1, requirementCode: 1 },
  {
    unique: true,
    partialFilterExpression: { requirementCode: { $type: 'string', $gt: '' } },
  }
);

const Requirement = mongoose.models.Requirement || mongoose.model('Requirement', requirementSchema);

export default Requirement;
