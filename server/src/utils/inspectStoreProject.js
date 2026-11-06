import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import Project from '../models/Project.js';
import Requirement from '../models/Requirement.js';
import AnalysisReport from '../models/AnalysisReport.js';

async function inspect() {
  try {
    await connectDB(process.env.MONGODB_URI);
    console.log('--- Connected to DB ---');

    // Find project with name "Store" or regex /store/i
    const projects = await Project.find({ name: /store/i }).select('+zipStoragePath +extractedStoragePath');
    console.log(`Found ${projects.length} project(s) matching /store/i:`);

    for (const p of projects) {
      console.log('Project details:', {
        id: p._id.toString(),
        name: p.name,
        status: p.status,
        extractionStatus: p.extractionStatus,
        originalZipName: p.originalZipName,
        zipFileSize: p.zipFileSize,
        zipStoragePath: p.zipStoragePath,
        extractedStoragePath: p.extractedStoragePath,
        extractedFileCount: p.extractedFileCount,
        extractedTotalSize: p.extractedTotalSize,
        extractedAt: p.extractedAt,
        extractionError: p.extractionError,
        overallProgress: p.overallProgress,
        progressStatus: p.progressStatus,
        verificationCoverage: p.verificationCoverage,
        latestReport: p.latestReport,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });

      const reqs = await Requirement.find({ project: p._id });
      console.log(`Requirements count: ${reqs.length}`);
      for (const r of reqs) {
        console.log('Requirement:', {
          id: r._id.toString(),
          code: r.code,
          title: r.title,
          status: r.status,
          priority: r.priority,
          weight: r.weight,
          verificationConfidence: r.verificationConfidence,
          astVerified: r.astVerified,
        });
      }

      const reports = await AnalysisReport.find({ project: p._id });
      console.log(`AnalysisReports count: ${reports.length}`);
      for (const rep of reports) {
        console.log('AnalysisReport:', {
          id: rep._id.toString(),
          status: rep.status,
          analysisVersion: rep.analysisVersion,
          startedAt: rep.startedAt,
          completedAt: rep.completedAt,
          errorMessage: rep.errorMessage,
          detectedTechnologies: rep.detectedTechnologies,
          sourceAnalysisSummary: rep.sourceAnalysis ? {
            totalFiles: rep.sourceAnalysis.totalFiles,
            scannedFiles: rep.sourceAnalysis.scannedFiles,
            syntaxErrorCount: rep.sourceAnalysis.syntaxErrorCount,
          } : null,
        });
      }
    }

    if (projects.length === 0) {
      console.log('No project named Store found. Listing all projects:');
      const allProjects = await Project.find().select('+zipStoragePath +extractedStoragePath').limit(10);
      for (const ap of allProjects) {
        console.log(`- [${ap._id}] ${ap.name} (status: ${ap.status}, extractionStatus: ${ap.extractionStatus}, zip: ${ap.originalZipName})`);
      }
    }

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Inspection error:', err);
    process.exit(1);
  }
}

inspect();
