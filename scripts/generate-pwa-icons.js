import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const iconHTML = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:transparent;">
<div id="icon" style="width:512px;height:512px;background:#0a0a0f;display:flex;align-items:center;justify-content:center;border-radius:20%;">
  <svg viewBox="0 0 100 100" style="width:90%;height:90%">
    <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
    
    <g font-family="Arial Black, Impact, sans-serif" font-weight="900" fill="white">
      <text x="22" y="62" font-size="35">H</text>
      
      <g transform="translate(68, 52)">
        <circle r="18" fill="white" />
        <path d="M-12 -8 Q0 0 -12 8" fill="none" stroke="#c41e3a" stroke-width="2"/>
        <path d="M12 -8 Q0 0 12 8" fill="none" stroke="#c41e3a" stroke-width="2"/>
        <rect x="8" y="10" width="12" height="6" fill="white" transform="rotate(45 8 10)" />
      </g>
    </g>
    
    <rect x="47" y="7" width="6" height="6" fill="white" transform="rotate(45 50 10)"/> <rect x="87" y="47" width="6" height="6" fill="white" transform="rotate(45 90 50)"/> <rect x="47" y="87" width="6" height="6" fill="white" transform="rotate(45 50 90)"/> <rect x="7" y="47" width="6" height="6" fill="white" transform="rotate(45 10 50)"/> </svg>
</div>
</body>
</html></html>
`;

const sizes = [
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'favicon.ico', size: 64 },
];

async function generate() {
  await mkdir(publicDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const { name, size } of sizes) {
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: size / 512 });
    await page.setContent(iconHTML);
    const element = await page.$('#icon');
    await element.screenshot({
      path: join(publicDir, name),
      omitBackground: true,
    });
    console.log(`Generated ${name} (${size}x${size})`);
  }

  await browser.close();
  console.log('Done! Icons saved to public/');
}

generate().catch(console.error);
