import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Requirement from '../models/Requirement.js';
import AnalysisReport from '../models/AnalysisReport.js';

/**
 * Helper to parse technology stack from array or comma-separated string
 */
const parseTechnologies = (techInput) => {
  if (Array.isArray(techInput)) {
    return techInput
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter(Boolean);
  }
  if (typeof techInput === 'string') {
    return techInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Create a new Project
 * POST /api/projects
 */
export const createProject = async (req, res, next) => {
  try {
    const { name, description, category, technologies, targetMilestoneDate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Project name must be at least 2 characters long',
      });
    }

    // Strictly enforce ownership from the authenticated JWT session
    // Never allow client request body to specify or override the owner
    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'Web Application',
      owner: req.user._id,
      technologies: parseTechnologies(technologies),
      targetMilestoneDate: targetMilestoneDate ? new Date(targetMilestoneDate) : null,
      status: 'draft', // Initial status is always 'draft'
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects belonging to the authenticated user
 * GET /api/projects
 * 
 * Supports:
 * - Pagination: page, limit
 * - Search by name: search
 * - Filter by category & status
 */
export const getAllProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;

    // Build query scoped strictly to the authenticated user
    const filter = {
      owner: req.user._id,
    };

    // Text search on project name
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    // Category filter
    if (category && category.trim()) {
      filter.category = category.trim();
    }

    // Status filter
    if (status && status.trim()) {
      filter.status = status.trim();
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Parallel count & query for performance
    const [totalProjects, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limitNum)
        .populate('latestReport'),
    ]);

    const totalPages = Math.ceil(totalProjects / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total: totalProjects,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single project by ID with its requirements
 * GET /api/projects/:id
 */
export const getSingleProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    // Query scoped to both project ID and authenticated owner (prevents IDOR)
    const project = await Project.findOne({
      _id: id,
      owner: req.user._id,
    }).populate('latestReport');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Fetch requirements associated with this project
    const requirements = await Requirement.find({ project: project._id }).sort({ createdAt: 1 });

    const projectData = project.toJSON();
    projectData.requirements = requirements;

    return res.status(200).json({
      success: true,
      data: {
        project: projectData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project details
 * PUT /api/projects/:id
 * 
 * Whitelists editable fields to prevent mass-assignment of protected attributes
 */
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    // Verify ownership before updating
    const project = await Project.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const { name, description, category, technologies, targetMilestoneDate } = req.body;

    // Apply allowed updates only (whitelisted fields)
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project name cannot be empty',
        });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Project name must be at least 2 characters long',
        });
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = typeof description === 'string' ? description.trim() : '';
    }

    if (category !== undefined) {
      project.category = typeof category === 'string' ? category.trim() : 'Web Application';
    }

    if (technologies !== undefined) {
      project.technologies = parseTechnologies(technologies);
    }

    if (targetMilestoneDate !== undefined) {
      project.targetMilestoneDate = targetMilestoneDate ? new Date(targetMilestoneDate) : null;
    }

    // Save updated record
    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a project and its associated cascade records
 * DELETE /api/projects/:id
 */
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    }

    // Verify ownership before attempting deletion
    const project = await Project.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Cascade delete associated requirements, analysis reports, and the project record
    await Promise.all([
      Requirement.deleteMany({ project: project._id }),
      AnalysisReport.deleteMany({ project: project._id }),
      Project.deleteOne({ _id: project._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Project and associated records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated dashboard metrics for authenticated user
 * GET /api/projects/dashboard/stats
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const userProjects = await Project.find({ owner: userId }).sort({ updatedAt: -1 });
    const projectIds = userProjects.map((p) => p._id);

    const totalProjects = userProjects.length;
    const completedProjects = userProjects.filter((p) => p.status === 'completed' || p.overallProgress === 100).length;
    const analyzingProjects = userProjects.filter((p) => p.status === 'analyzing' || p.extractionStatus === 'extracting').length;

    const avgProgress = totalProjects > 0
      ? Math.round((userProjects.reduce((sum, p) => sum + (p.overallProgress || 0), 0) / totalProjects) * 10) / 10
      : 0;

    // Aggregate requirements breakdown
    const requirements = await Requirement.find({ project: { $in: projectIds } });
    const verifiedCount = requirements.filter((r) => r.status === 'verified').length;
    const partialCount = requirements.filter((r) => r.status === 'partial').length;
    const notFoundCount = requirements.filter((r) => r.status === 'not_found').length;
    const needsReviewCount = requirements.filter((r) => r.status === 'needs_review').length;
    const pendingCount = requirements.filter((r) => r.status === 'pending').length;

    // Recent reports for AI insights & progress trend
    const recentReports = await AnalysisReport.find({ project: { $in: projectIds }, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(6);

    const latestInsights = [];
    for (const r of recentReports) {
      if (r.aiAnalysis && Array.isArray(r.aiAnalysis.recommendedActions)) {
        for (const act of r.aiAnalysis.recommendedActions.slice(0, 2)) {
          latestInsights.push({
            title: act.title,
            description: act.description,
            priority: act.priority,
            reportId: r._id.toString(),
          });
        }
      }
    }

    const progressTrend = recentReports.map((r, idx) => ({
      date: new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      progress: r.progressPercentage || 0,
    })).reverse();

    return res.status(200).json({
      success: true,
      data: {
        totalProjects,
        completedProjects,
        analyzingProjects,
        averageProgress: avgProgress,
        verificationBreakdown: {
          totalRequirements: requirements.length,
          verified: verifiedCount,
          partial: partialCount,
          notFound: notFoundCount,
          needsReview: needsReviewCount,
          pending: pendingCount,
        },
        recentProjects: userProjects.slice(0, 5).map((p) => ({
          id: p._id.toString(),
          name: p.name,
          category: p.category,
          status: p.status,
          overallProgress: p.overallProgress || 0,
          updatedAt: p.updatedAt,
        })),
        progressTrend,
        latestInsights: latestInsights.slice(0, 4),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a requirement to a project
 * POST /api/projects/:id/requirements
 */
export const addRequirementToProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID format' });
    }

    const project = await Project.findOne({ _id: id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { requirementCode, code: altCode, title, description, priority = 'medium', weight = 10 } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Requirement title is required' });
    }

    const reqCount = await Requirement.countDocuments({ project: id });
    const rawCode = requirementCode || altCode;
    const code = rawCode && String(rawCode).trim()
      ? String(rawCode).trim()
      : `REQ-${String(reqCount + 1).padStart(3, '0')}`;

    const newReq = await Requirement.create({
      project: project._id,
      requirementCode: code,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: ['low', 'medium', 'high', 'critical'].includes(priority) ? priority : 'medium',
      weight: Number(weight) >= 0 ? Number(weight) : 10,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Requirement added successfully',
      data: newReq,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing requirement
 * PUT /api/projects/:id/requirements/:reqId
 */
export const updateProjectRequirement = async (req, res, next) => {
  try {
    const { id, reqId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reqId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const project = await Project.findOne({ _id: id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const requirement = await Requirement.findOne({ _id: reqId, project: id });
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    const { title, description, priority, weight, status } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Requirement title cannot be empty' });
      }
      requirement.title = title.trim();
    }
    if (description !== undefined) requirement.description = description.trim();
    if (priority && ['low', 'medium', 'high', 'critical'].includes(priority)) {
      requirement.priority = priority;
    }
    if (weight !== undefined && Number(weight) >= 0) {
      requirement.weight = Number(weight);
    }
    if (status && ['pending', 'verified', 'partial', 'not_found', 'needs_review'].includes(status.toLowerCase())) {
      requirement.status = status.toLowerCase();
    }

    await requirement.save();

    return res.status(200).json({
      success: true,
      message: 'Requirement updated successfully',
      data: requirement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a requirement from a project
 * DELETE /api/projects/:id/requirements/:reqId
 */
export const deleteProjectRequirement = async (req, res, next) => {
  try {
    const { id, reqId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reqId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const project = await Project.findOne({ _id: id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const deleted = await Requirement.findOneAndDelete({ _id: reqId, project: id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createProject,
  getAllProjects,
  getSingleProject,
  updateProject,
  deleteProject,
  getDashboardStats,
  addRequirementToProject,
  updateProjectRequirement,
  deleteProjectRequirement,
};
