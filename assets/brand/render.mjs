import { chromium } from "playwright";
const b = await chromium.launch();
async function shot(html, out, w, h, scale) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await p.goto("file://" + html);
  await p.waitForTimeout(250);
  await p.screenshot({ path: out, omitBackground: true });
  await p.close();
  console.log("wrote", out);
}
await shot(process.cwd() + "/assets/brand/icon.html", process.cwd() + "/assets/brand/billleash-icon.png", 512, 512, 2);
await shot(process.cwd() + "/assets/brand/wordmark.html", process.cwd() + "/assets/brand/billleash-wordmark.png", 1100, 340, 2);
await b.close();
