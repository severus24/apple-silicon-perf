import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

class CDP {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.errors = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        message.error ? pending.reject(new Error(JSON.stringify(message.error))) : pending.resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        this.errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        this.errors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
      }
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new CDP(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

async function waitForFile(filePath, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await stat(filePath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error(`Timed out waiting for ${filePath}`);
}

async function waitForReady(cdp) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const ready = await cdp.evaluate(`document.readyState === 'complete' && document.querySelectorAll('#rankBody tr.data-row').length > 0`);
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for the ranking page');
}

let server;
let chrome;
let cdp;
let profileDir;

try {
  const indexHtml = await readFile(path.join(ROOT, 'index.html'));
  server = createServer((request, response) => {
    if (request.url === '/' || request.url === '/index.html') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(indexHtml);
      return;
    }
    response.writeHead(204);
    response.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port: serverPort } = server.address();

  profileDir = await mkdtemp(path.join(tmpdir(), 'apple-silicon-rank-'));
  chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ], { stdio: 'ignore' });

  const activePortFile = path.join(profileDir, 'DevToolsActivePort');
  await waitForFile(activePortFile);
  const [debugPort, browserPath] = (await readFile(activePortFile, 'utf8')).trim().split('\n');
  const targetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' });
  assert.equal(targetResponse.ok, true);
  const target = await targetResponse.json();

  cdp = await CDP.connect(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.navigate', { url: `http://127.0.0.1:${serverPort}/index.html` });
  await waitForReady(cdp);

  const result = await cdp.evaluate(`(() => {
    const clickSub = (label) => {
      const button = [...document.querySelectorAll('#geekModes button')].find((item) => item.textContent.trim() === label);
      if (!button) throw new Error('Geekbench submetric not found: ' + label);
      button.click();
    };
    const topRow = () => {
      const row = document.querySelector('#rankBody tr.data-row');
      return {
        chip: row?.querySelector('.device')?.textContent.trim(),
        score: row?.querySelector('.bar .score')?.textContent.trim()
      };
    };
    const tops = {};
    for (const label of ['单核', '多核', 'OpenCL', 'Metal']) {
      clickSub(label);
      tops[label] = topRow();
    }
    clickSub('单核');
    const clickPrimary = (label) => {
      const button = [...document.querySelectorAll('#metricModes button')].find((item) => item.textContent.trim() === label);
      if (!button) throw new Error('Primary metric not found: ' + label);
      button.click();
    };
    const clickBlenderMode = (label) => {
      const button = [...document.querySelectorAll('#blenderModes button')].find((item) => item.textContent.trim() === label);
      if (!button) throw new Error('Blender mode not found: ' + label);
      button.click();
    };
    clickPrimary('Blender');
    clickBlenderMode('CPU');
    tops['Blender CPU'] = topRow();
    clickBlenderMode('GPU');
    tops['Blender GPU'] = topRow();
    clickBlenderMode('CPU');
    clickPrimary('Geekbench');
    clickSub('单核');

    const targetRow = [...document.querySelectorAll('#rankBody tr.data-row')].find((row) => {
      return row.querySelector('.device')?.textContent.trim() === 'Apple M4 Max';
    });
    if (!targetRow) throw new Error('Apple M4 Max row not found');
    targetRow.click();
    document.querySelector('#openCmp').click();

    const selectedKey = [...compare][0];
    const selected = currentKeyMap.get(selectedKey) || byKey.get(selectedKey);
    const competitionRank = (values, value) => {
      if (value == null) return null;
      return values.filter((item) => item != null).sort((a, b) => b - a).indexOf(value) + 1;
    };
    const geekKeys = ['single', 'multi', 'opencl', 'metal'];
    const expected = [
      ...geekKeys.map((key) => competitionRank(
        ROWS.flatMap((row) => (row.configs || []).map((config) => config[key])),
        selected.geek[key]?.score
      )),
      competitionRank(ROWS.map((row) => row.ai?.[aiMode]?.[aiBackend]), selected.ai?.[aiMode]?.[aiBackend]),
      competitionRank(ROWS.map((row) => row.mlx?.vals?.[mlxBackend]), selected.mlx?.vals?.[mlxBackend]),
      competitionRank(ROWS.map((row) => row.blender?.[blenderMode]?.score), selected.blender?.[blenderMode]?.score)
    ];
    const rows = [...document.querySelectorAll('#cmpBody .cmp-row')];
    const actual = rows.map((row) => {
      const rank = row.querySelector('.cmp-rank')?.textContent.trim();
      return rank === '—' ? null : Number(rank.replace('#', ''));
    });
    return {
      actual,
      expected,
      labels: rows.map((row) => row.querySelector('.cmp-label span:last-child')?.textContent.trim()),
      tops
    };
  })()`);

  assert.deepEqual(result.tops, {
    单核: { chip: 'Apple M6', score: '4,005' },
    多核: { chip: 'Apple M5 Ultra', score: '51,808' },
    OpenCL: { chip: 'Apple M5 Ultra', score: '218,058' },
    Metal: { chip: 'Apple M5 Ultra', score: '344,173' },
    'Blender CPU': { chip: 'Apple M5 Ultra', score: '934.6' },
    'Blender GPU': { chip: 'Apple M5 Ultra', score: '15,326.2' }
  });
  assert.deepEqual(result.labels, ['单核', '多核', 'OpenCL', 'Metal', 'AI 单精度 · GPU', 'MLX · MLX GPU', 'Blender CPU']);
  assert.deepEqual(result.actual, result.expected);
  assert.ok(new Set(result.actual.filter((rank) => rank != null)).size > 1, `Expected distinct ranks, received ${result.actual.join(', ')}`);
  assert.deepEqual(cdp.errors, []);

  console.log(JSON.stringify({ ranks: Object.fromEntries(result.labels.map((label, index) => [label, result.actual[index]])) }, null, 2));
} finally {
  cdp?.close();
  if (chrome && chrome.exitCode == null) {
    const exited = new Promise((resolve) => chrome.once('exit', resolve));
    chrome.kill('SIGTERM');
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 2_000))]);
    if (chrome.exitCode == null) chrome.kill('SIGKILL');
  }
  await new Promise((resolve) => server?.close(resolve));
  if (profileDir) await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
