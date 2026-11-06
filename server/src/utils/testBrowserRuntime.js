import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runBrowserTest() {
  console.log('====================================================');
  console.log('🌐 ProjectPulse AI - Chrome Browser Runtime Workflow');
  console.log('====================================================');

  const userId = '6aecb97fa5ab6741dc38f456'; // Prayash singh
  const userObj = {
    _id: userId,
    id: userId,
    name: 'Prayash singh',
    email: 'prayashsingh411@gmail.com',
    role: 'user'
  };
  const token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '2h' });

  // 1. Launch Chrome
  console.log('\n[Phase 1] Launching Headless Chrome Instance...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.join(__dirname, '../../.chrome-temp-profile')
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const vRes = await fetch('http://127.0.0.1:9222/json/version');
      if (vRes.ok) {
        const vData = await vRes.json();
        wsUrl = vData.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('❌ Could not connect to Chrome debugging port.');
    chromeProcess.kill();
    process.exit(1);
  }

  const newPageRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:5173', { method: 'PUT' });
  const pageData = await newPageRes.json();
  const pageWsUrl = pageData.webSocketDebuggerUrl;

  const ws = new WebSocket(pageWsUrl);
  let idCounter = 1;
  const pendingRequests = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const networkLog = [];
  const consoleLog = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
      return;
    }

    if (data.method === 'Runtime.consoleAPICalled') {
      const text = (data.params.args || []).map((a) => a.value || a.description || '').join(' ');
      consoleLog.push(`[console.${data.params.type}] ${text}`);
    } else if (data.method === 'Network.responseReceived') {
      const res = data.params.response;
      if (res.url.includes('/api/')) {
        networkLog.push(`${res.status} ${res.url}`);
      }
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  // Inject user credentials into localStorage
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('token', ${JSON.stringify(token)});
      localStorage.setItem('user', ${JSON.stringify(JSON.stringify(userObj))});
    `
  });

  // TEST SCENARIO A: Open Project from My Projects
  console.log('\n--- Scenario A: Open Project from My Projects (/projects) ---');
  await send('Page.navigate', { url: 'http://localhost:5173/projects' });
  await new Promise((r) => setTimeout(r, 2500));

  const myProjectsEval = await send('Runtime.evaluate', { expression: `document.body.innerText` });
  const myProjectsText = myProjectsEval.result?.value || '';
  const foundInProjectsList = myProjectsText.includes('Store');
  console.log('   ✅ Project "Store" visible in My Projects listing:', foundInProjectsList);

  // TEST SCENARIO B: Navigate to Project Details / Specification URL
  console.log('\n--- Scenario B: Navigate to Details (/projects/6aecd1b8b4dd6e54c217b0da) ---');
  await send('Page.navigate', { url: 'http://localhost:5173/projects/6aecd1b8b4dd6e54c217b0da' });
  await new Promise((r) => setTimeout(r, 3000));

  const detailsEval = await send('Runtime.evaluate', { expression: `document.body.innerText` });
  const detailsText = detailsEval.result?.value || '';

  const hasNotFound = detailsText.includes('Project Specification Not Found');
  const hasStoreName = detailsText.includes('Store');
  const hasReqCode = detailsText.includes('REQ-001') || detailsText.includes('JWT');
  const hasZipMeta = detailsText.includes('store.zip');

  console.log('   ✅ "Project Specification Not Found" is absent:', !hasNotFound);
  console.log('   ✅ Saved Project Name ("Store") is displayed:', hasStoreName);
  console.log('   ✅ Requirements ("REQ-001" / "JWT") are displayed:', hasReqCode);
  console.log('   ✅ Uploaded ZIP metadata ("store.zip") is displayed:', hasZipMeta);

  // TEST SCENARIO C: Refresh the Page
  console.log('\n--- Scenario C: Browser Page Refresh (Page.reload) ---');
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 3000));

  const reloadEval = await send('Runtime.evaluate', { expression: `document.body.innerText` });
  const reloadText = reloadEval.result?.value || '';

  const reloadHasNotFound = reloadText.includes('Project Specification Not Found');
  const reloadHasStoreName = reloadText.includes('Store');
  const reloadHasReq = reloadText.includes('REQ-001') || reloadText.includes('JWT');
  const reloadHasZip = reloadText.includes('store.zip');

  console.log('   ✅ After Refresh: "Project Specification Not Found" is absent:', !reloadHasNotFound);
  console.log('   ✅ After Refresh: Saved Project Name ("Store") is displayed:', reloadHasStoreName);
  console.log('   ✅ After Refresh: Requirements are displayed:', reloadHasReq);
  console.log('   ✅ After Refresh: Uploaded ZIP metadata is displayed:', reloadHasZip);

  // TEST SCENARIO D: Direct Navigation to Project URL
  console.log('\n--- Scenario D: Direct URL Navigation to /projects/6aecd1b8b4dd6e54c217b0da ---');
  await send('Page.navigate', { url: 'about:blank' });
  await new Promise((r) => setTimeout(r, 500));
  await send('Page.navigate', { url: 'http://localhost:5173/projects/6aecd1b8b4dd6e54c217b0da' });
  await new Promise((r) => setTimeout(r, 3000));

  const directEval = await send('Runtime.evaluate', { expression: `document.body.innerText` });
  const directText = directEval.result?.value || '';

  const directHasNotFound = directText.includes('Project Specification Not Found');
  const directHasStoreName = directText.includes('Store');
  const directHasReq = directText.includes('REQ-001') || directText.includes('JWT');
  const directHasZip = directText.includes('store.zip');

  console.log('   ✅ Direct URL: "Project Specification Not Found" is absent:', !directHasNotFound);
  console.log('   ✅ Direct URL: Saved Project Name ("Store") is displayed:', directHasStoreName);
  console.log('   ✅ Direct URL: Requirements are displayed:', directHasReq);
  console.log('   ✅ Direct URL: Uploaded ZIP metadata is displayed:', directHasZip);

  // Summary
  const allChecks = [
    foundInProjectsList,
    !hasNotFound,
    hasStoreName,
    hasReqCode,
    hasZipMeta,
    !reloadHasNotFound,
    reloadHasStoreName,
    reloadHasReq,
    reloadHasZip,
    !directHasNotFound,
    directHasStoreName,
    directHasReq,
    directHasZip
  ];
  const passedCount = allChecks.filter(Boolean).length;
  const totalCount = allChecks.length;

  console.log('\n====================================================');
  console.log(`Summary: ${passedCount}/${totalCount} Browser Workflow Checks PASSED`);
  console.log('====================================================');

  ws.close();
  chromeProcess.kill();
  process.exit(passedCount === totalCount ? 0 : 1);
}

runBrowserTest().catch(console.error);
