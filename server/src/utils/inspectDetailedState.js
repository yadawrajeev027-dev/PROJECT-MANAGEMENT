import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

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

async function inspectAll() {
  await connectDB(process.env.MONGODB_URI);

  const projects = await Project.find().select('+zipStoragePath +extractedStoragePath');
  console.log(`=== Total Projects in DB: ${projects.length} ===\n`);

  for (const p of projects) {
    console.log(`-----------------------------------------------`);
    console.log(`Project: "${p.name}" (ID: ${p._id})`);
    console.log(`  status: ${p.status}`);
    console.log(`  overallProgress: ${p.overallProgress}`);
    console.log(`  progressStatus: ${p.progressStatus}`);
    console.log(`  verificationCoverage: ${p.verificationCoverage}`);
    console.log(`  latestReport: ${p.latestReport}`);
    console.log(`  owner: ${p.owner}`);

    const reqs = await Requirement.find({ project: p._id });
    console.log(`  Requirements count: ${reqs.length}`);
    for (const r of reqs) {
      console.log(`    - Requirement ID: ${r._id}`);
      console.log(`      title: "${r.title}"`);
      console.log(`      code: "${r.requirementCode}"`);
      console.log(`      status: "${r.status}"`);
      console.log(`      weight: ${r.weight} (type: ${typeof r.weight})`);
      console.log(`      project: ${r.project}`);
      console.log(`      confidence: ${r.confidence}`);
      console.log(`      evidence count: ${r.evidence?.length}`);
    }

    const reports = await AnalysisReport.find({ project: p._id });
    console.log(`  AnalysisReports count: ${reports.length}`);
    for (const rep of reports) {
      console.log(`    - Report ID: ${rep._id}`);
      console.log(`      status: ${rep.status}`);
      console.log(`      progressPercentage: ${rep.progressPercentage}`);
      console.log(`      progressMetrics:`, JSON.stringify(rep.progressMetrics));
    }
  }

  // Also check if there are any orphaned requirements
  const allReqs = await Requirement.find();
  const projectIds = new Set(projects.map(p => p._id.toString()));
  const orphaned = allReqs.filter(r => !projectIds.has(r.project.toString()));
  console.log(`\n=== Total Requirements: ${allReqs.length}, Orphaned: ${orphaned.length} ===`);
  for (const o of orphaned) {
    console.log(`Orphaned req: ${o.title}, project ref: ${o.project}`);
  }

  await disconnectDB();
}

inspectAll();
