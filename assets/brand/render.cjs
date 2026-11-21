const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  async function shot(html, out, w, h, scale) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await p.goto("file://" + html);
    await p.waitForTimeout(250);
    await p.screenshot({ path: out, omitBackground: true });
    await p.close();
    console.log("wrote", out);
  }
  const d = process.cwd() + "/assets/brand/";
  await shot(d + "icon.html", d + "billleash-icon.png", 512, 512, 2);
  await shot(d + "wordmark.html", d + "billleash-wordmark.png", 1100, 340, 2);
  await b.close();
})();
