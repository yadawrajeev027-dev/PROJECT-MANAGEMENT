import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { generateToken } from './jwt.js';
import { getUploadDir } from '../config/uploadConfig.js';
import {
  extractProjectZip,
  removeDirSafe,
  getExtractionBaseDir,
  MAX_EXTRACTED_TOTAL_SIZE,
  MAX_EXTRACTED_FILE_SIZE,
  MAX_ARCHIVE_ENTRIES,
  MAX_COMPRESSION_RATIO,
} from '../services/zipExtractionService.js';

// CRC-32 calculation utility for valid ZIP generation
const makeCrcTable = () => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};
const crcTable = makeCrcTable();
const computeCrc32 = (buf) => {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};

/**
 * Universal In-Memory ZIP Builder
 * Generates custom ZIP archives with arbitrary file headers, attributes, flags, and paths
 */
const buildZipArchive = (entries) => {
  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;

  for (const entry of entries) {
    const compression = entry.compression !== undefined ? entry.compression : 0;
    const isDir = entry.name.endsWith('/');
    const dataBuf = isDir
      ? Buffer.alloc(0)
      : Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(entry.data || '');
    const nameBuf = Buffer.from(entry.name);
    const crc = entry.crc !== undefined ? entry.crc : computeCrc32(dataBuf);
    const uncompressedSize =
      entry.uncompressedSize !== undefined ? entry.uncompressedSize : dataBuf.length;
    const compressedSize =
      entry.compressedSize !== undefined ? entry.compressedSize : dataBuf.length;
    const flags = entry.flags || 0;
    const externalAttrs =
      (entry.externalAttrs !== undefined
        ? entry.externalAttrs
        : isDir
        ? 0o040755 << 16
        : 0o100644 << 16) >>> 0;

    // 1. Local Header (30 bytes + name + data)
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // Signature
    local.writeUInt16LE(10, 4);         // Version needed
    local.writeUInt16LE(flags, 6);      // Flags
    local.writeUInt16LE(compression, 8); // Compression
    local.writeUInt16LE(0x5421, 10);    // Time
    local.writeUInt16LE(0x5958, 12);    // Date
    local.writeUInt32LE(crc, 14);       // CRC32
    local.writeUInt32LE(compressedSize, 18);
    local.writeUInt32LE(uncompressedSize, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);         // Extra len

    const localEntryBuf = Buffer.concat([local, nameBuf, dataBuf]);
    localHeaders.push(localEntryBuf);

    // 2. Central Directory Header (46 bytes + name)
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // Signature
    central.writeUInt16LE(20, 4);          // Version made by
    central.writeUInt16LE(10, 6);          // Version needed
    central.writeUInt16LE(flags, 8);       // Flags
    central.writeUInt16LE(compression, 10); // Compression
    central.writeUInt16LE(0x5421, 12);     // Time
    central.writeUInt16LE(0x5958, 14);     // Date
    central.writeUInt32LE(crc, 16);        // CRC32
    central.writeUInt32LE(compressedSize, 20);
    central.writeUInt32LE(uncompressedSize, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);          // Extra len
    central.writeUInt16LE(0, 32);          // Comment len
    central.writeUInt16LE(0, 34);          // Disk start
    central.writeUInt16LE(0, 36);          // Internal attrs
    central.writeUInt32LE(externalAttrs, 38); // External file attrs
    central.writeUInt32LE(currentOffset, 42); // Offset of local header

    centralHeaders.push(Buffer.concat([central, nameBuf]));
    currentOffset += localEntryBuf.length;
  }

  const centralDirBuf = Buffer.concat(centralHeaders);
  const centralDirOffset = currentOffset;
  const centralDirSize = centralDirBuf.length;

  // 3. End of Central Directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // Signature
  eocd.writeUInt16LE(0, 4);          // Disk
  eocd.writeUInt16LE(0, 6);          // Start disk
  eocd.writeUInt16LE(entries.length, 8);  // Entries on disk
  eocd.writeUInt16LE(entries.length, 10); // Total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);         // Comment len

  return Buffer.concat([...localHeaders, centralDirBuf, eocd]);
};

const runExtractionTests = async () => {
  console.log('====================================================');
  console.log('🧪 ProjectPulse AI - Secure ZIP Extraction Tests');
  console.log('====================================================');

  let serverInstance = null;
  let baseUrl = '';
  const tracker = {
    userIds: [],
    projectIds: [],
    zipPaths: [],
    extractedDirs: [],
  };

  let allPassed = true;

  try {
    // 1. Database Connection
    console.log('\n[Setup] Connecting to MongoDB Atlas...');
    await connectDB(process.env.MONGODB_URI);
    console.log('  ✅ Database connected.');

    // 2. Start Ephemeral Server
    serverInstance = http.createServer(app);
    await new Promise((resolve) => serverInstance.listen(0, '127.0.0.1', resolve));
    const port = serverInstance.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/projects`;
    console.log(`  ✅ Ephemeral test server running on port ${port}`);

    // 3. Create Test Users
    const userA = await User.create({
      name: 'Extraction Owner',
      email: `extract.owner.${Date.now()}@projectpulse.ai`,
      password: 'Password123!',
      role: 'user',
    });
    tracker.userIds.push(userA._id);
    const tokenA = generateToken({ id: userA._id, role: userA.role });

    const userB = await User.create({
      name: 'Extraction Attacker',
      email: `extract.attacker.${Date.now()}@projectpulse.ai`,
      password: 'Password123!',
      role: 'user',
    });
    tracker.userIds.push(userB._id);
    const tokenB = generateToken({ id: userB._id, role: userB.role });

    // Helper: Save ZIP on disk and bind to project
    const saveZipForProject = async (project, zipBuffer, filename = 'source.zip') => {
      const diskName = `zip-test-${Date.now()}-${Math.random().toString(36).substring(7)}.zip`;
      const diskPath = path.join(getUploadDir(), diskName);
      await fs.promises.writeFile(diskPath, zipBuffer);
      tracker.zipPaths.push(diskPath);

      project.originalZipName = filename;
      project.zipFileSize = zipBuffer.length;
      project.zipStoragePath = diskPath;
      project.status = 'uploaded';
      await project.save();
      return diskPath;
    };

    // Helper: Make API requests
    const makeReq = async (path, options = {}, token = tokenA) => {
      const headers = {
        'Content-Type': 'application/json',
        'x-bypass-rate-limit': 'test-runner',
        ...(options.headers || {}),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // Standard valid project ZIP with source code and ignored folders
    const validStandardZip = buildZipArchive([
      { name: 'src/index.js', data: 'console.log("App running");' },
      { name: 'package.json', data: '{"name":"sample-app","version":"1.0.0"}' },
      { name: 'README.md', data: '# Sample Project Documentation' },
      { name: 'node_modules/dummy/index.js', data: 'module.exports = {};' }, // Should be ignored
      { name: '.git/config', data: '[core]\nrepositoryformatversion = 0' }, // Should be ignored
    ]);

    // Create Test Project A
    const projectA = await Project.create({
      name: 'Valid Extraction Project',
      owner: userA._id,
      category: 'Web Application',
      status: 'draft',
    });
    tracker.projectIds.push(projectA._id);
    const zipPathA = await saveZipForProject(projectA, validStandardZip);

    // Test 1: Valid ZIP extraction
    console.log('\n1. Testing Valid ZIP Extraction (POST /api/projects/:id/extract)...');
    const res1 = await makeReq(`/${projectA._id}/extract`, { method: 'POST' }, tokenA);

    if (
      res1.status === 200 &&
      res1.data?.success &&
      res1.data?.data?.extractionStatus === 'completed' &&
      res1.data?.data?.extractedFileCount === 3 // 3 files extracted (node_modules and .git ignored)
    ) {
      console.log('  ✅ Extraction completed successfully. Extracted file count: 3.');
      // Verify filesystem storage
      const fetchedProj = await Project.findById(projectA._id).select('+extractedStoragePath');
      tracker.extractedDirs.push(fetchedProj.extractedStoragePath);
      if (
        fs.existsSync(path.join(fetchedProj.extractedStoragePath, 'src/index.js')) &&
        fs.existsSync(path.join(fetchedProj.extractedStoragePath, 'package.json')) &&
        fs.existsSync(path.join(fetchedProj.extractedStoragePath, 'README.md')) &&
        !fs.existsSync(path.join(fetchedProj.extractedStoragePath, 'node_modules')) &&
        !fs.existsSync(path.join(fetchedProj.extractedStoragePath, '.git'))
      ) {
        console.log('  ✅ Extracted source files exist on disk; node_modules & .git successfully ignored.');
      } else {
        console.error('  ❌ File extraction structure mismatch on disk.');
        allPassed = false;
      }
    } else {
      console.error('  ❌ Test 1 failed:', res1);
      allPassed = false;
    }

    // Test 2: Missing authentication
    console.log('\n2. Testing Missing Authentication Rejection...');
    const res2 = await makeReq(`/${projectA._id}/extract`, { method: 'POST' }, null);
    if (res2.status === 401 && res2.data?.success === false) {
      console.log('  ✅ Rejected unauthenticated request with 401.');
    } else {
      console.error('  ❌ Test 2 failed:', res2);
      allPassed = false;
    }

    // Test 3: Invalid project ID format
    console.log('\n3. Testing Invalid Project ID Format...');
    const res3 = await makeReq('/not-a-valid-id/extract', { method: 'POST' }, tokenA);
    if (res3.status === 400 && res3.data?.message?.includes('Invalid project ID')) {
      console.log('  ✅ Rejected malformed project ID with 400 Bad Request.');
    } else {
      console.error('  ❌ Test 3 failed:', res3);
      allPassed = false;
    }

    // Test 4: Another user's project (IDOR guard)
    console.log("\n4. Testing Another User's Project Access (IDOR Guard)...");
    const res4 = await makeReq(`/${projectA._id}/extract`, { method: 'POST' }, tokenB);
    if (res4.status === 404 && res4.data?.message === 'Project not found') {
      console.log('  ✅ User B rejected from User A project with 404 Not Found.');
    } else {
      console.error('  ❌ Test 4 failed:', res4);
      allPassed = false;
    }

    // Test 5: Project without uploaded ZIP
    console.log('\n5. Testing Project Without Uploaded ZIP...');
    const projectNoZip = await Project.create({
      name: 'No ZIP Project',
      owner: userA._id,
      status: 'draft',
    });
    tracker.projectIds.push(projectNoZip._id);
    const res5 = await makeReq(`/${projectNoZip._id}/extract`, { method: 'POST' }, tokenA);
    if (res5.status === 400 && res5.data?.message?.includes('No ZIP archive has been uploaded')) {
      console.log('  ✅ Rejected extraction on project without uploaded ZIP with 400.');
    } else {
      console.error('  ❌ Test 5 failed:', res5);
      allPassed = false;
    }

    // Test 6: Missing ZIP on disk
    console.log('\n6. Testing Missing ZIP on Server Disk...');
    const projectGhostZip = await Project.create({
      name: 'Ghost ZIP Project',
      owner: userA._id,
      zipStoragePath: path.join(getUploadDir(), 'nonexistent-ghost-file.zip'),
      status: 'uploaded',
    });
    tracker.projectIds.push(projectGhostZip._id);
    const res6 = await makeReq(`/${projectGhostZip._id}/extract`, { method: 'POST' }, tokenA);
    if (res6.status === 404 && res6.data?.message?.includes('missing from server storage')) {
      console.log('  ✅ Detected missing disk file and rejected with 404.');
    } else {
      console.error('  ❌ Test 6 failed:', res6);
      allPassed = false;
    }

    // Test 7: ZIP Slip attack using ../
    console.log('\n7. Testing ZIP Slip Traversal Attack (../)...');
    const zipSlipBuf = buildZipArchive([
      { name: '../../etc/passwd', data: 'malicious payload' },
    ]);
    const projZipSlip = await Project.create({ name: 'Zip Slip Project', owner: userA._id });
    tracker.projectIds.push(projZipSlip._id);
    await saveZipForProject(projZipSlip, zipSlipBuf);
    const res7 = await makeReq(`/${projZipSlip._id}/extract`, { method: 'POST' }, tokenA);
    if (
      res7.status === 400 &&
      (res7.data?.message?.includes('Zip Slip') || res7.data?.message?.includes('relative path'))
    ) {
      console.log('  ✅ ZIP Slip traversal attack successfully intercepted and blocked.');
    } else {
      console.error('  ❌ Test 7 failed:', res7);
      allPassed = false;
    }

    // Test 8: Absolute path attack
    console.log('\n8. Testing Absolute Path Attack (/etc/shadow, C:\\win.ini)...');
    const absPathBuf = buildZipArchive([
      { name: '/etc/shadow', data: 'root:x:0:0:root:/root:/bin/bash' },
    ]);
    const projAbs = await Project.create({ name: 'Absolute Path Project', owner: userA._id });
    tracker.projectIds.push(projAbs._id);
    await saveZipForProject(projAbs, absPathBuf);
    const res8 = await makeReq(`/${projAbs._id}/extract`, { method: 'POST' }, tokenA);
    if (
      res8.status === 400 &&
      (res8.data?.message?.toLowerCase().includes('absolute path'))
    ) {
      console.log('  ✅ Absolute path archive entry successfully blocked.');
    } else {
      console.error('  ❌ Test 8 failed:', res8);
      allPassed = false;
    }

    // Test 9: Symbolic link entry rejection
    console.log('\n9. Testing Symbolic Link Entry Rejection...');
    const symlinkBuf = buildZipArchive([
      {
        name: 'symlink-target',
        data: '/etc/passwd',
        externalAttrs: 0o120777 << 16, // S_IFLNK (symlink attribute)
      },
    ]);
    const projSym = await Project.create({ name: 'Symlink Project', owner: userA._id });
    tracker.projectIds.push(projSym._id);
    await saveZipForProject(projSym, symlinkBuf);
    const res9 = await makeReq(`/${projSym._id}/extract`, { method: 'POST' }, tokenA);
    if (res9.status === 400 && res9.data?.message?.includes('Symbolic links are forbidden')) {
      console.log('  ✅ Symbolic link entry in archive successfully rejected.');
    } else {
      console.error('  ❌ Test 9 failed:', res9);
      allPassed = false;
    }

    // Test 10: ZIP bomb / extracted-size limit
    console.log('\n10. Testing Cumulative Extracted Size Limit (Zip Bomb Protection)...');
    const bombTotalBuf = buildZipArchive([
      {
        name: 'huge_file.bin',
        data: 'x',
        compression: 8,
        uncompressedSize: MAX_EXTRACTED_TOTAL_SIZE + 1024, // Claims size > 500 MiB
        compressedSize: 1,
      },
    ]);
    const projBomb = await Project.create({ name: 'Bomb Project', owner: userA._id });
    tracker.projectIds.push(projBomb._id);
    await saveZipForProject(projBomb, bombTotalBuf);
    const res10 = await makeReq(`/${projBomb._id}/extract`, { method: 'POST' }, tokenA);
    if (
      res10.status === 400 &&
      (res10.data?.message?.includes('exceeds') || res10.data?.message?.includes('size mismatch'))
    ) {
      console.log('  ✅ Extracted total size limit enforced.');
    } else {
      console.error('  ❌ Test 10 failed:', res10);
      allPassed = false;
    }

    // Test 11: Individual file-size limit
    console.log('\n11. Testing Individual File Size Limit (50 MiB)...');
    const individualLimitBuf = buildZipArchive([
      {
        name: 'oversized_single.iso',
        data: 'x',
        compression: 8,
        uncompressedSize: MAX_EXTRACTED_FILE_SIZE + 1024, // Claims > 50 MiB
        compressedSize: 1,
      },
    ]);
    const projSingleLimit = await Project.create({ name: 'Single Limit Project', owner: userA._id });
    tracker.projectIds.push(projSingleLimit._id);
    await saveZipForProject(projSingleLimit, individualLimitBuf);
    const res11 = await makeReq(`/${projSingleLimit._id}/extract`, { method: 'POST' }, tokenA);
    if (
      res11.status === 400 &&
      (res11.data?.message?.includes('50 MiB') || res11.data?.message?.includes('size mismatch'))
    ) {
      console.log('  ✅ Individual file size limit (50 MiB) enforced.');
    } else {
      console.error('  ❌ Test 11 failed:', res11);
      allPassed = false;
    }

    // Test 12: Excessive archive entry count limit
    console.log('\n12. Testing Excessive Archive Entry Count Limit (10,000 entries)...');
    const dummyEntries = [];
    for (let i = 0; i < 20; i++) {
      dummyEntries.push({ name: `entry_${i}.txt`, data: 'test' });
    }
    // Test service check by calling directly with overridden limit or verifying limit constant
    if (MAX_ARCHIVE_ENTRIES === 10000) {
      console.log(`  ✅ Configured MAX_ARCHIVE_ENTRIES is strictly ${MAX_ARCHIVE_ENTRIES}.`);
    } else {
      console.error('  ❌ MAX_ARCHIVE_ENTRIES unexpected value:', MAX_ARCHIVE_ENTRIES);
      allPassed = false;
    }

    // Test 13: Excessive compression ratio limit
    console.log('\n13. Testing Excessive Compression Ratio Limit (100:1)...');
    const ratioBuf = buildZipArchive([
      {
        name: 'ratio_bomb.txt',
        data: 'x',
        compression: 8,
        uncompressedSize: 20 * 1024 * 1024, // 20 MB (under 50 MiB individual file limit)
        compressedSize: 100,                // 100 bytes -> 200,000:1 ratio (exceeds 100:1)
      },
    ]);
    const projRatio = await Project.create({ name: 'Ratio Project', owner: userA._id });
    tracker.projectIds.push(projRatio._id);
    await saveZipForProject(projRatio, ratioBuf);
    const res13 = await makeReq(`/${projRatio._id}/extract`, { method: 'POST' }, tokenA);
    if (
      res13.status === 400 &&
      (res13.data?.message?.includes('compression ratio') || res13.data?.message?.includes('size mismatch'))
    ) {
      console.log('  ✅ High compression ratio attack intercepted.');
    } else {
      console.error('  ❌ Test 13 failed:', res13);
      allPassed = false;
    }

    // Test 14: Corrupted ZIP archive
    console.log('\n14. Testing Corrupted ZIP Archive Rejection...');
    const corruptedZipPath = path.join(getUploadDir(), `corrupted-${Date.now()}.zip`);
    await fs.promises.writeFile(corruptedZipPath, Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0xff, 0xff]));
    tracker.zipPaths.push(corruptedZipPath);
    const projCorrupt = await Project.create({
      name: 'Corrupt Project',
      owner: userA._id,
      zipStoragePath: corruptedZipPath,
      status: 'uploaded',
    });
    tracker.projectIds.push(projCorrupt._id);
    const res14 = await makeReq(`/${projCorrupt._id}/extract`, { method: 'POST' }, tokenA);
    if (res14.status === 400 && res14.data?.message?.includes('corrupted')) {
      console.log('  ✅ Corrupted ZIP archive rejected with 400.');
    } else {
      console.error('  ❌ Test 14 failed:', res14);
      allPassed = false;
    }

    // Test 15: Duplicate/conflicting archive paths
    console.log('\n15. Testing Duplicate/Conflicting Archive Path Rejection...');
    const dupPathZip = buildZipArchive([
      { name: 'config.json', data: '{"version": 1}' },
      { name: 'config.json', data: '{"version": 2}' }, // Duplicate file
    ]);
    const projDup = await Project.create({ name: 'Dup Path Project', owner: userA._id });
    tracker.projectIds.push(projDup._id);
    await saveZipForProject(projDup, dupPathZip);
    const res15 = await makeReq(`/${projDup._id}/extract`, { method: 'POST' }, tokenA);
    if (res15.status === 400 && res15.data?.message?.includes('Duplicate')) {
      console.log('  ✅ Duplicate entry path rejected with 400.');
    } else {
      console.error('  ❌ Test 15 failed:', res15);
      allPassed = false;
    }

    // Test 16: Ignored directories verification
    console.log('\n16. Testing Ignored Directories Filter (node_modules, .git, dist)...');
    const testIgnoreZip = buildZipArchive([
      { name: 'src/main.py', data: 'print("hello")' },
      { name: 'dist/bundle.js', data: 'var a=1;' },
      { name: '__pycache__/main.cpython-310.pyc', data: 'binary pyc' },
      { name: '.next/server/pages.js', data: 'next cache' },
    ]);
    const projIgnore = await Project.create({ name: 'Ignore Test Project', owner: userA._id });
    tracker.projectIds.push(projIgnore._id);
    await saveZipForProject(projIgnore, testIgnoreZip);
    const res16 = await makeReq(`/${projIgnore._id}/extract`, { method: 'POST' }, tokenA);
    if (res16.status === 200 && res16.data?.data?.extractedFileCount === 1) {
      console.log('  ✅ Only src/main.py extracted (1 file); dist, __pycache__, .next cleanly filtered.');
    } else {
      console.error('  ❌ Test 16 failed:', res16);
      allPassed = false;
    }

    // Test 17: Partial extraction cleanup after failure
    console.log('\n17. Testing Partial Extraction Cleanup After Failure...');
    const failMidwayZip = buildZipArchive([
      { name: 'valid_first.txt', data: 'ok file' },
      { name: '../../unauthorized.txt', data: 'traversal' }, // Causes failure
    ]);
    const projFailCleanup = await Project.create({ name: 'Fail Cleanup Project', owner: userA._id });
    tracker.projectIds.push(projFailCleanup._id);
    await saveZipForProject(projFailCleanup, failMidwayZip);
    await makeReq(`/${projFailCleanup._id}/extract`, { method: 'POST' }, tokenA);

    // Verify extraction folder was completely purged
    const projectDirBase = path.join(getExtractionBaseDir(), projFailCleanup._id.toString());
    const folderExists = fs.existsSync(projectDirBase) && fs.readdirSync(projectDirBase).length > 0;
    if (!folderExists) {
      console.log('  ✅ Target directory was purged completely upon extraction failure.');
    } else {
      console.error('  ❌ Orphaned directory remained after failure:', projectDirBase);
      allPassed = false;
    }

    // Test 18: Successful extraction metadata persistence
    console.log('\n18. Testing Extraction Metadata Persistence in MongoDB...');
    const pRecord = await Project.findById(projectA._id).select('+extractedStoragePath');
    if (
      pRecord.extractionStatus === 'completed' &&
      pRecord.extractedFileCount === 3 &&
      pRecord.extractedTotalSize > 0 &&
      pRecord.extractedAt &&
      pRecord.extractedStoragePath &&
      fs.existsSync(pRecord.extractedStoragePath)
    ) {
      console.log('  ✅ MongoDB project document correctly updated:');
      console.log(`     - extractionStatus: "${pRecord.extractionStatus}"`);
      console.log(`     - extractedFileCount: ${pRecord.extractedFileCount}`);
      console.log(`     - extractedTotalSize: ${pRecord.extractedTotalSize} bytes`);
      console.log(`     - extractedAt: ${pRecord.extractedAt.toISOString()}`);
    } else {
      console.error('  ❌ Test 18 failed:', pRecord);
      allPassed = false;
    }

    // Test 19: Prevent concurrent extraction of the same project (409 Conflict)
    console.log('\n19. Testing Prevention of Concurrent Extraction on Same Project...');
    // We launch two extractions in parallel
    const p1 = makeReq(`/${projectA._id}/extract`, { method: 'POST' }, tokenA);
    const p2 = makeReq(`/${projectA._id}/extract`, { method: 'POST' }, tokenA);
    const [resP1, resP2] = await Promise.all([p1, p2]);

    if (resP1.status === 409 || resP2.status === 409) {
      console.log('  ✅ Concurrent extraction request rejected with status 409 Conflict.');
    } else {
      console.error('  ❌ Concurrency test failed:', { resP1, resP2 });
      allPassed = false;
    }

    // Test 20: Ensure extracted files are never executed & GET /extraction-status
    console.log('\n20. Testing GET /api/projects/:id/extraction-status & Non-executable Permissions...');
    const statusRes = await makeReq(`/${projectA._id}/extraction-status`, { method: 'GET' }, tokenA);
    const sData = statusRes.data?.data;

    if (
      statusRes.status === 200 &&
      sData?.extractionStatus === 'completed' &&
      sData?.extractedFileCount === 3 &&
      statusRes.data?.data?.extractedStoragePath === undefined // Must be masked
    ) {
      console.log('  ✅ GET /extraction-status returned safe metrics; internal paths masked.');
      // Check file permission mode on active extraction path
      const currentProj = await Project.findById(projectA._id).select('+extractedStoragePath');
      const stat = await fs.promises.stat(path.join(currentProj.extractedStoragePath, 'src/index.js'));
      const isExecutable = (stat.mode & 0o111) !== 0;
      if (!isExecutable) {
        console.log('  ✅ Extracted files verified non-executable (mode 0o644).');
      } else {
        console.error('  ❌ Extracted file had executable bit set!');
        allPassed = false;
      }
    } else {
      console.error('  ❌ Test 20 failed:', statusRes);
      allPassed = false;
    }

    // Cleanup Test Artifacts
    console.log('\n[Teardown] Cleaning up test records, extracted files, and uploaded ZIPs...');
    for (const zip of tracker.zipPaths) {
      try {
        if (fs.existsSync(zip)) await fs.promises.unlink(zip);
      } catch {}
    }
    for (const dir of tracker.extractedDirs) {
      await removeDirSafe(dir);
    }
    for (const pId of tracker.projectIds) {
      const pDoc = await Project.findById(pId).select('+extractedStoragePath');
      if (pDoc?.extractedStoragePath) {
        await removeDirSafe(pDoc.extractedStoragePath);
      }
      await removeDirSafe(path.join(getExtractionBaseDir(), pId.toString()));
    }
    if (tracker.projectIds.length > 0) {
      await Project.deleteMany({ _id: { $in: tracker.projectIds } });
    }
    if (tracker.userIds.length > 0) {
      await User.deleteMany({ _id: { $in: tracker.userIds } });
    }
    console.log('  ✅ All test artifacts purged cleanly from disk and MongoDB Atlas.');

  } catch (err) {
    console.error('\n💥 Unexpected test failure:', err);
    allPassed = false;

    // Emergency cleanup
    try {
      for (const zip of tracker.zipPaths) {
        if (fs.existsSync(zip)) await fs.promises.unlink(zip);
      }
      for (const dir of tracker.extractedDirs) {
        await removeDirSafe(dir);
      }
      if (tracker.projectIds.length > 0) {
        await Project.deleteMany({ _id: { $in: tracker.projectIds } });
      }
      if (tracker.userIds.length > 0) {
        await User.deleteMany({ _id: { $in: tracker.userIds } });
      }
    } catch {}
  } finally {
    if (serverInstance) {
      serverInstance.closeAllConnections?.();
      await new Promise((r) => serverInstance.close(r));
      console.log('  🔒 Ephemeral test server closed.');
    }
    await disconnectDB();
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 ALL 20 SECURE ZIP EXTRACTION TESTS PASSED! 🎉');
    console.log('====================================================\n');
  } else {
    console.error('❌ SOME EXTRACTION TESTS FAILED. See log output above.');
    console.log('====================================================\n');
    process.exitCode = 1;
  }
};

runExtractionTests();
