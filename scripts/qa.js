const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = process.argv[2];
const OUT = process.argv[3] || '.';
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--no-default-browser-check',
  '--disable-gpu', '--hide-scrollbars', '--user-data-dir=' + path.join(os.tmpdir(), 'cr-mlb-qa'), 'about:blank'
], { stdio: 'ignore' });

let id = 0;
async function main() {
  let targets;
  for (let i = 0; i < 40; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); break; }
    catch { await sleep(250); }
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, (m) => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)));
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const js = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception));
    return r.result.value;
  };
  const shot = async (name, full = false) => {
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
    fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(s.data, 'base64'));
  };
  const tap = async (n = 1, wait = 640) => {
    for (let i = 0; i < n; i++) { await js(`document.getElementById('play').click()`); await sleep(wait); }
  };
  const snapshot = () => js(`(() => {
    const cta = document.getElementById('cta').getBoundingClientRect();
    const cash = document.getElementById('cash');
    return {
      dir: document.documentElement.dir, lang: document.documentElement.lang,
      hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ctaAboveFold: cta.bottom <= innerHeight,
      tag: document.getElementById('tag').textContent,
      tagCls: document.getElementById('tag').className,
      mult: document.getElementById('mult').textContent,
      play: document.getElementById('play').textContent,
      cashHidden: cash.hidden, cashLabel: cash.textContent.trim(),
      done: document.querySelectorAll('.lane.is-done').length,
      scroll: getComputedStyle(document.getElementById('track')).getPropertyValue('--scroll').trim(),
      events: (JSON.parse(localStorage.getItem('cr_mlb_events')||'[]')).map(e=>e.n).join(',')
    };
  })()`);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  const results = [];

  for (const w of [360, 390, 412]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 780, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: PAGE });
    await sleep(700);
    await js(`localStorage.removeItem('cr_mlb_events')`);
    const lanes = await js(`APP_CONFIG.game.bases.length`);

    const initial = await snapshot();
    if (w === 390) { await shot('screen-ar'); await shot('screen-ar-full', true); }

    await js('Math.random = () => 0.99');
    await tap(1, 260);
    await tap(lanes);
    const win = await snapshot();
    if (w === 390) await shot('screen-ar-homerun');

    await js(`localStorage.removeItem('cr_mlb_events')`);
    await tap(1, 260);
    await tap(3);
    const beforeCash = await snapshot();
    await js(`document.getElementById('cash').click()`);
    await sleep(400);
    const cashed = await snapshot();
    if (w === 390) await shot('screen-cashout');

    await js('Math.random = () => 0.0');
    await tap(1, 260);
    await tap(1);
    const lost = await snapshot();

    await js('Math.random = () => 0.99');
    await js(`document.getElementById('lang').click()`);
    await sleep(250);
    await tap(1, 260);
    await tap(3);
    const fr = await snapshot();
    if (w === 390) { await shot('screen-fr'); await shot('screen-fr-full', true); }
    await js(`localStorage.removeItem('cr_lang')`);

    results.push({ w, lanes, initial, win, beforeCash, cashed, lost, fr });
  }

  await send('Page.navigate', { url: PAGE + '?utm_source=fb&utm_campaign=dz_mlb&subid=abc&debug=1' });
  await sleep(600);
  const utm = await js(`({
    href: document.getElementById('cta').getAttribute('href'),
    href2: document.getElementById('cta2').getAttribute('href'),
    overlay: !!document.querySelector('.dbg')
  })`);

  console.log(JSON.stringify({ results, utm }, null, 2));
  ws.close(); chrome.kill();
}
main().catch((e) => { console.error('FAIL', e); chrome.kill(); process.exit(1); });
