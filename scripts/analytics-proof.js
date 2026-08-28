const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = process.argv[3], PORT = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
  '--disable-gpu', '--hide-scrollbars', '--user-data-dir=' + path.join(os.tmpdir(), 'cr-mlb-proof'), 'about:blank'], { stdio: 'ignore' });
let id = 0;
async function main() {
  let t;
  for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; } catch { await sleep(250); } }
  const ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  const pend = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, (m) => m.error ? rej(new Error(m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.value;

  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 780, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: process.argv[2] + '?lang=fr&utm_source=facebook&utm_campaign=dz_mlb_aug&debug=1' });
  await sleep(800);
  await ev('Math.random = () => 0.99');
  await ev(`document.getElementById('play').click()`); await sleep(260);

  for (let i = 0; i < 3; i++) { await ev(`document.getElementById('play').click()`); await sleep(640); }
  await ev(`document.getElementById('cash').click()`); await sleep(450);

  await ev(`document.getElementById('cta').addEventListener('click', e => e.preventDefault(), true);
            document.getElementById('cta').click();`);
  await sleep(300);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT + '/analytics-proof.png', Buffer.from(shot.data, 'base64'));
  console.log(await ev(`JSON.stringify(JSON.parse(localStorage.getItem('cr_mlb_events')).map(e=>e.n+':'+JSON.stringify(e.p)),null,1)`));
  ws.close(); chrome.kill();
}
main().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
