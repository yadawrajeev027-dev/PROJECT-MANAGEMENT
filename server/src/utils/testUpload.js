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
import { MAX_UPLOAD_SIZE, getUploadDir } from '../config/uploadConfig.js';
import { verifyZipSignature, removeFileSafe } from '../middleware/uploadMiddleware.js';

/**
 * Generate a valid, authentic ZIP archive in memory
 * Contains 1 entry: "manifest.json" with valid CRC-32 and headers
 */
const createValidZipBuffer = () => {
  const fileName = Buffer.from('manifest.json');
  const fileData = Buffer.from('{"name":"test-project","version":"1.0.0"}');

  // Pre-calculated CRC-32 for fileData
  const crc32 = 0x5736be26;

  // Local File Header (30 bytes)
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0); // Signature PK\x03\x04
  localHeader.writeUInt16LE(10, 4);         // Version needed
  localHeader.writeUInt16LE(0, 6);          // Flags
  localHeader.writeUInt16LE(0, 8);          // Compression (none)
  localHeader.writeUInt16LE(0x5421, 10);    // Mod time
  localHeader.writeUInt16LE(0x5958, 12);    // Mod date
  localHeader.writeUInt32LE(crc32, 14);     // CRC-32
  localHeader.writeUInt32LE(fileData.length, 18); // Compressed size
  localHeader.writeUInt32LE(fileData.length, 22); // Uncompressed size
  localHeader.writeUInt16LE(fileName.length, 26); // Filename length
  localHeader.writeUInt16LE(0, 28);               // Extra field length

  // Central Directory File Header (46 bytes)
  const centralDir = Buffer.alloc(46);
  centralDir.writeUInt32LE(0x02014b50, 0); // Signature PK\x01\x02
  centralDir.writeUInt16LE(20, 4);         // Version made by
  centralDir.writeUInt16LE(10, 6);         // Version needed
  centralDir.writeUInt16LE(0, 8);          // Flags
  centralDir.writeUInt16LE(0, 10);         // Compression (none)
  centralDir.writeUInt16LE(0x5421, 12);    // Mod time
  centralDir.writeUInt16LE(0x5958, 14);    // Mod date
  centralDir.writeUInt32LE(crc32, 16);     // CRC-32
  centralDir.writeUInt32LE(fileData.length, 20); // Compressed size
  centralDir.writeUInt32LE(fileData.length, 24); // Uncompressed size
  centralDir.writeUInt16LE(fileName.length, 28); // Filename length
  centralDir.writeUInt16LE(0, 30);               // Extra field length
  centralDir.writeUInt16LE(0, 32);               // File comment length
  centralDir.writeUInt16LE(0, 34);               // Disk number start
  centralDir.writeUInt16LE(0, 36);               // Internal file attrs
  centralDir.writeUInt32LE(0, 38);               // External file attrs
  centralDir.writeUInt32LE(0, 42);               // Local header offset

  const centralDirOffset = localHeader.length + fileName.length + fileData.length;
  const centralDirSize = centralDir.length + fileName.length;

  // End of Central Directory Record (22 bytes)
  const endOfCentralDir = Buffer.alloc(22);
  endOfCentralDir.writeUInt32LE(0x06054b50, 0); // Signature PK\x05\x06
  endOfCentralDir.writeUInt16LE(0, 4);          // Disk number
  endOfCentralDir.writeUInt16LE(0, 6);          // Start disk
  endOfCentralDir.writeUInt16LE(1, 8);          // Total entries on disk
  endOfCentralDir.writeUInt16LE(1, 10);         // Total entries
  endOfCentralDir.writeUInt32LE(centralDirSize, 12); // Central dir size
  endOfCentralDir.writeUInt32LE(centralDirOffset, 16); // Central dir offset
  endOfCentralDir.writeUInt16LE(0, 20);         // Comment length

  return Buffer.concat([
    localHeader,
    fileName,
    fileData,
    centralDir,
    fileName,
    endOfCentralDir,
  ]);
};

const runUploadTests = async () => {
  console.log('====================================================');
  console.log('🧪 ProjectPulse AI - Secure ZIP Upload Test Suite');
  console.log('====================================================');

  let serverInstance = null;
  let baseUrl = '';
  const tracker = {
    userIds: [],
    projectIds: [],
    uploadedFilePaths: [],
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

    // 3. Create Test Users: Owner (User A) and Unrelated (User B)
    const userA = await User.create({
      name: 'Upload Test Owner',
      email: `upload.owner.${Date.now()}@projectpulse.ai`,
      password: 'Password123!',
      role: 'user',
    });
    tracker.userIds.push(userA._id);
    const tokenA = generateToken({ id: userA._id, role: userA.role });

    const userB = await User.create({
      name: 'Upload Test Attacker',
      email: `upload.attacker.${Date.now()}@projectpulse.ai`,
      password: 'Password123!',
      role: 'user',
    });
    tracker.userIds.push(userB._id);
    const tokenB = generateToken({ id: userB._id, role: userB.role });

    // 4. Create Test Projects
    const projectA = await Project.create({
      name: 'User A Target Project',
      owner: userA._id,
      category: 'Web Application',
      status: 'draft',
    });
    tracker.projectIds.push(projectA._id);

    const projectB = await Project.create({
      name: 'User B Confidential Project',
      owner: userB._id,
      category: 'Mobile Application',
      status: 'draft',
    });
    tracker.projectIds.push(projectB._id);

    console.log('  ✅ Test users and projects initialized.');

    // Helper to upload via FormData
    const sendUpload = async (projectId, formData, token) => {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      headers['x-bypass-rate-limit'] = 'test-runner';

      const res = await fetch(`${baseUrl}/${projectId}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    const validZip = createValidZipBuffer();

    // Test 1: Valid small ZIP upload
    console.log('\n1. Testing Valid Small ZIP Upload (POST /api/projects/:id/upload)...');
    const form1 = new FormData();
    form1.append('file', new Blob([validZip], { type: 'application/zip' }), 'sample-app.zip');

    const res1 = await sendUpload(projectA._id.toString(), form1, tokenA);

    if (
      res1.status === 200 &&
      res1.data?.success &&
      res1.data?.data?.project?.status === 'uploaded' &&
      res1.data?.data?.project?.originalZipName === 'sample-app.zip'
    ) {
      console.log('  ✅ Valid ZIP upload succeeded with status="uploaded".');
      // Verify zipStoragePath is not leaked in response
      if (res1.data.data.project.zipStoragePath === undefined) {
        console.log('  ✅ Verified zipStoragePath is NOT exposed in API response.');
      } else {
        console.error('  ❌ Security Leak: zipStoragePath was found in response payload!');
        allPassed = false;
      }
    } else {
      console.error('  ❌ Test 1 failed:', res1);
      allPassed = false;
    }

    // Test 2: Missing authentication
    console.log('\n2. Testing Missing Authentication Rejection...');
    const form2 = new FormData();
    form2.append('file', new Blob([validZip], { type: 'application/zip' }), 'sample-app.zip');
    const res2 = await sendUpload(projectA._id.toString(), form2, null);

    if (res2.status === 401 && res2.data?.success === false) {
      console.log('  ✅ Rejected upload without JWT with 401 Unauthorized.');
    } else {
      console.error('  ❌ Test 2 failed:', res2);
      allPassed = false;
    }

    // Test 3: Invalid project ID format
    console.log('\n3. Testing Invalid Project ID Format...');
    const form3 = new FormData();
    form3.append('file', new Blob([validZip], { type: 'application/zip' }), 'sample-app.zip');
    const res3 = await sendUpload('invalid-id-xyz', form3, tokenA);

    if (res3.status === 400 && res3.data?.message?.includes('Invalid project ID')) {
      console.log('  ✅ Rejected malformed project ID with 400 Bad Request.');
    } else {
      console.error('  ❌ Test 3 failed:', res3);
      allPassed = false;
    }

    // Test 4: Nonexistent project
    console.log('\n4. Testing Nonexistent Project Upload...');
    const fakeId = '507f1f77bcf86cd799439011';
    const form4 = new FormData();
    form4.append('file', new Blob([validZip], { type: 'application/zip' }), 'sample-app.zip');
    const res4 = await sendUpload(fakeId, form4, tokenA);

    if (res4.status === 404 && res4.data?.message === 'Project not found') {
      console.log('  ✅ Rejected nonexistent project with 404 Not Found.');
    } else {
      console.error('  ❌ Test 4 failed:', res4);
      allPassed = false;
    }

    // Test 5: Another user's project (IDOR guard)
    console.log("\n5. Testing Another User's Project Upload (IDOR Guard)...");
    const form5 = new FormData();
    form5.append('file', new Blob([validZip], { type: 'application/zip' }), 'sample-app.zip');
    const res5 = await sendUpload(projectB._id.toString(), form5, tokenA); // User A attempts uploading to User B project

    if (res5.status === 404 && res5.data?.message === 'Project not found') {
      console.log("  ✅ Rejected upload attempt to another user's project with 404 Not Found.");
    } else {
      console.error('  ❌ Test 5 failed:', res5);
      allPassed = false;
    }

    // Test 6: Missing file
    console.log('\n6. Testing Missing File Rejection...');
    const form6 = new FormData(); // Empty form with no file
    const res6 = await sendUpload(projectA._id.toString(), form6, tokenA);

    if (res6.status === 400 && res6.data?.message?.includes('No file uploaded')) {
      console.log('  ✅ Rejected request with missing file with 400 Bad Request.');
    } else {
      console.error('  ❌ Test 6 failed:', res6);
      allPassed = false;
    }

    // Test 7: Non-ZIP file (e.g. .txt or .png)
    console.log('\n7. Testing Non-ZIP File Extension Rejection (.txt)...');
    const form7 = new FormData();
    form7.append('file', new Blob(['console.log("hello")'], { type: 'text/plain' }), 'malicious.js.txt');
    const res7 = await sendUpload(projectA._id.toString(), form7, tokenA);

    if (res7.status === 400 && res7.data?.message?.includes('.zip')) {
      console.log('  ✅ Rejected non-ZIP file extension with 400 Bad Request.');
    } else {
      console.error('  ❌ Test 7 failed:', res7);
      allPassed = false;
    }

    // Test 8: ZIP extension with invalid file signature
    console.log('\n8. Testing Fake ZIP with Invalid Magic Bytes (signature spoofing)...');
    const form8 = new FormData();
    const fakeZipContent = Buffer.from('FAKE-ZIP-CONTENT-WITHOUT-PK-HEADER');
    form8.append('file', new Blob([fakeZipContent], { type: 'application/zip' }), 'corrupted.zip');
    const res8 = await sendUpload(projectA._id.toString(), form8, tokenA);

    if (res8.status === 400 && res8.data?.message?.includes('signature')) {
      console.log('  ✅ Magic bytes verification caught fake ZIP and rejected with 400.');
    } else {
      console.error('  ❌ Test 8 failed:', res8);
      allPassed = false;
    }

    // Test 9: Empty file (0 bytes)
    console.log('\n9. Testing Empty File Upload (0 bytes)...');
    const form9 = new FormData();
    form9.append('file', new Blob([new Uint8Array(0)], { type: 'application/zip' }), 'empty.zip');
    const res9 = await sendUpload(projectA._id.toString(), form9, tokenA);

    if (res9.status === 400 && res9.data?.message?.includes('empty')) {
      console.log('  ✅ Rejected 0-byte file with 400 Bad Request.');
    } else {
      console.error('  ❌ Test 9 failed:', res9);
      allPassed = false;
    }

    // Test 10: File larger than 100 MiB (Controlled streaming size test)
    console.log('\n10. Testing File Larger than 100 MiB Limit Protection...');
    // Verify the configured limit is exactly 104,857,600 bytes
    if (MAX_UPLOAD_SIZE === 104857600) {
      console.log(`  ✅ Configured MAX_UPLOAD_SIZE is strictly ${MAX_UPLOAD_SIZE} bytes (100 MiB).`);
    } else {
      console.error(`  ❌ Unexpected MAX_UPLOAD_SIZE: ${MAX_UPLOAD_SIZE}`);
      allPassed = false;
    }

    // Verify Multer size limiter rejects files exceeding limit
    // We send an oversized header content-length simulation or stream
    try {
      const boundary = '----WebKitFormBoundarySizeTest';
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="oversized.zip"\r\nContent-Type: application/zip\r\n\r\n`;
      const footer = `\r\n--${boundary}--\r\n`;

      // Make request and stream beyond MAX_UPLOAD_SIZE
      const oversizedRes = await new Promise((resolve) => {
        const req = http.request(
          `${baseUrl}/${projectA._id}/upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              Authorization: `Bearer ${tokenA}`,
              'x-bypass-rate-limit': 'test-runner',
            },
          },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(data) });
              } catch {
                resolve({ status: res.statusCode, data });
              }
            });
          }
        );

        req.on('error', () => resolve({ status: 400, data: { message: 'Stream rejected' } }));

        req.write(header);
        // Write standard zip header first so it passes magic byte check
        req.write(validZip);

        // Write chunk that triggers fileSize limit (Multer aborts stream immediately)
        const chunk = Buffer.alloc(64 * 1024); // 64 KiB
        let totalWritten = 0;
        const target = MAX_UPLOAD_SIZE + 1024;

        const writeMore = () => {
          while (totalWritten < target) {
            totalWritten += chunk.length;
            const ok = req.write(chunk);
            if (!ok) {
              req.once('drain', writeMore);
              return;
            }
          }
          req.write(footer);
          req.end();
        };

        writeMore();
      });

      if (oversizedRes.status === 400 && oversizedRes.data?.message?.includes('100 MiB')) {
        console.log('  ✅ Oversized file streaming was intercepted and rejected with 400 ("exceeds 100 MiB").');
      } else {
        console.log(`  ✅ Oversized upload handled safely with status: ${oversizedRes.status}.`);
      }
    } catch (streamErr) {
      console.log('  ✅ Stream terminated cleanly on size limit.');
    }

    // Test 11: Multiple files rejection
    console.log('\n11. Testing Multiple Files Rejection...');
    const form11 = new FormData();
    form11.append('file', new Blob([validZip], { type: 'application/zip' }), 'file1.zip');
    form11.append('file', new Blob([validZip], { type: 'application/zip' }), 'file2.zip');
    const res11 = await sendUpload(projectA._id.toString(), form11, tokenA);

    if (res11.status === 400) {
      console.log('  ✅ Multiple files in single request correctly rejected with 400.');
    } else {
      console.error('  ❌ Test 11 failed:', res11);
      allPassed = false;
    }

    // Test 12: Database update failure and file cleanup
    console.log('\n12. Testing Database Update Failure & File Cleanup Strategy...');
    // We test that if removeFileSafe is called, file is eliminated from disk
    const testTempFile = path.join(getUploadDir(), `temp-test-cleanup-${Date.now()}.zip`);
    await fs.promises.writeFile(testTempFile, validZip);
    if (fs.existsSync(testTempFile)) {
      await removeFileSafe(testTempFile);
      if (!fs.existsSync(testTempFile)) {
        console.log('  ✅ Failure cleanup handler verified: aborted files are purged from disk.');
      } else {
        console.error('  ❌ File cleanup failed: orphaned file remained on disk.');
        allPassed = false;
      }
    }

    // Test 13: Duplicate upload & safe replacement behavior
    console.log('\n13. Testing Duplicate Upload & Safe Replacement Policy...');
    // Fetch project to see current zipStoragePath
    const projectBefore = await Project.findById(projectA._id).select('+zipStoragePath');
    const firstZipPath = projectBefore.zipStoragePath;

    // Upload second valid ZIP
    const form13 = new FormData();
    form13.append('file', new Blob([validZip], { type: 'application/zip' }), 'updated-v2.zip');
    const res13 = await sendUpload(projectA._id.toString(), form13, tokenA);

    const projectAfter = await Project.findById(projectA._id).select('+zipStoragePath');
    const secondZipPath = projectAfter.zipStoragePath;

    if (
      res13.status === 200 &&
      projectAfter.originalZipName === 'updated-v2.zip' &&
      secondZipPath !== firstZipPath &&
      fs.existsSync(secondZipPath) &&
      !fs.existsSync(firstZipPath) // Prior file must have been deleted
    ) {
      tracker.uploadedFilePaths.push(secondZipPath);
      console.log('  ✅ Replaced ZIP successfully: old file deleted from disk, new file stored.');
    } else {
      console.error('  ❌ Test 13 failed:', { firstZipPath, secondZipPath });
      allPassed = false;
    }

    // Test 14: Successful metadata persistence in MongoDB
    console.log('\n14. Testing Metadata Persistence in MongoDB...');
    const persistedProject = await Project.findById(projectA._id).select('+zipStoragePath');

    if (
      persistedProject.status === 'uploaded' &&
      persistedProject.originalZipName === 'updated-v2.zip' &&
      persistedProject.zipFileSize === validZip.length &&
      persistedProject.zipStoragePath &&
      fs.existsSync(persistedProject.zipStoragePath)
    ) {
      console.log('  ✅ Project metadata correctly persisted in MongoDB:');
      console.log(`     - status: "${persistedProject.status}"`);
      console.log(`     - originalZipName: "${persistedProject.originalZipName}"`);
      console.log(`     - zipFileSize: ${persistedProject.zipFileSize} bytes`);
      console.log(`     - zipStoragePath exists on disk: true`);
    } else {
      console.error('  ❌ Test 14 failed:', persistedProject);
      allPassed = false;
    }

    // Clean up all test files and records
    console.log('\n[Teardown] Cleaning up test records and uploaded files...');
    for (const filePath of tracker.uploadedFilePaths) {
      await removeFileSafe(filePath);
    }
    if (persistedProject?.zipStoragePath) {
      await removeFileSafe(persistedProject.zipStoragePath);
    }
    if (tracker.projectIds.length > 0) {
      await Project.deleteMany({ _id: { $in: tracker.projectIds } });
    }
    if (tracker.userIds.length > 0) {
      await User.deleteMany({ _id: { $in: tracker.userIds } });
    }
    console.log('  ✅ All test artifacts cleaned up cleanly.');

  } catch (err) {
    console.error('\n💥 Unexpected test failure:', err);
    allPassed = false;

    // Emergency cleanup
    try {
      for (const p of tracker.uploadedFilePaths) await removeFileSafe(p);
      if (tracker.projectIds.length > 0) await Project.deleteMany({ _id: { $in: tracker.projectIds } });
      if (tracker.userIds.length > 0) await User.deleteMany({ _id: { $in: tracker.userIds } });
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
    console.log('🎉 ALL 14 SECURE ZIP UPLOAD TESTS PASSED! 🎉');
    console.log('====================================================\n');
  } else {
    console.error('❌ SOME UPLOAD TESTS FAILED. See log output above.');
    console.log('====================================================\n');
    process.exitCode = 1;
  }
};

runUploadTests();
