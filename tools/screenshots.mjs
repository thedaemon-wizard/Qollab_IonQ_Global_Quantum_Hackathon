// README screenshots of the local harness (tools/devserver). Requires Node.js and puppeteer
// (not part of the project); run it from a folder where puppeteer is installed:
//   node screenshots.mjs <repo>/docs/img
// Start the harness first: python tools/devserver/server.py
import puppeteer from 'puppeteer';

const out = process.argv[2] || 'docs/img';
const base = 'http://127.0.0.1:8765/tools/devserver/dev.html';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/bin/google-chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 760, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await page.goto(base, { waitUntil: 'networkidle0' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = (i) => page.evaluate((k) => document.querySelectorAll('.nav-btn')[k].click(), i);
await wait(2500);
await page.screenshot({ path: `${out}/screen_overview.png` });

await nav(1);
await wait(2000);
await page.evaluate(() => document.getElementById('lab-run').click());
await wait(9000);
await page.evaluate(() => { document.getElementById('lab-run-card').scrollIntoView(); window.scrollBy(0, -60); }); // keep the toolbar below the sticky header
await wait(500);
await page.screenshot({ path: `${out}/screen_lab.png` });
await page.evaluate(() => document.getElementById('lab-ladder').scrollIntoView());
await wait(500);
await page.screenshot({ path: `${out}/screen_ladder.png` });

await nav(3);
await wait(5000);
await page.screenshot({ path: `${out}/screen_realdata.png` });

await nav(4);
await wait(3000);
await page.evaluate(() => document.getElementById('rep-run').click());
await wait(6000);
await page.screenshot({ path: `${out}/screen_repeater.png` });

await nav(5);
await wait(7000);
await page.screenshot({ path: `${out}/screen_space.png` });

await nav(6);
await wait(3000);
await page.evaluate(() => document.getElementById('circ-drawing').scrollIntoView({ block: 'center' }));
await wait(500);
await page.screenshot({ path: `${out}/screen_circuits.png` });
await browser.close();
console.log('done');
