/**
 * Generates docs/icons.png — a grid of all 64 Paired Associates icons.
 * Run with: node scripts/gen-icons-png.mjs
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const OUTER_SHAPES = ["ring", "square", "triangle", "diamond", "hexagon", "star", "pentagon", "shield"];
const INNER_MARKS = ["none", "dot", "circle", "hdash", "vdash", "diag", "x", "tri"];

const OUTER_PATHS = {
  ring:     "M16 4 a12 12 0 1 0 0.01 0",
  square:   "M5 5 h22 v22 h-22 z",
  triangle: "M16 3 L30 28 L2 28 z",
  diamond:  "M16 2 L30 16 L16 30 L2 16 z",
  hexagon:  "M16 3 L27.9 9.5 L27.9 22.5 L16 29 L4.1 22.5 L4.1 9.5 z",
  star:     "M16 2 L19.1 11.1 L28.5 11.1 L21.2 16.8 L23.8 26.2 L16 20.8 L8.2 26.2 L10.8 16.8 L3.5 11.1 L12.9 11.1 z",
  pentagon: "M16 3 L28.4 11.9 L23.6 26.5 L8.4 26.5 L3.6 11.9 z",
  shield:   "M16 3 L28 8 V18 Q28 28 16 30 Q4 28 4 18 V8 z",
};

function markSVG(mark) {
  switch (mark) {
    case "none": return "";
    case "dot":  return `<circle cx="16" cy="16" r="3.5" fill="currentColor"/>`;
    case "circle": return `<circle cx="16" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    case "hdash": return `<line x1="10" y1="16" x2="22" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
    case "vdash": return `<line x1="16" y1="10" x2="16" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
    case "diag":  return `<line x1="10" y1="10" x2="22" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
    case "x":     return `<line x1="10" y1="10" x2="22" y2="22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                          <line x1="10" y1="22" x2="22" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
    case "tri":   return `<polygon points="16,10 22,21 10,21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`;
    default: return "";
  }
}

function iconSVG(shape, mark) {
  const path = OUTER_PATHS[shape];
  return `<svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="color:#6366f1">
    <path d="${path}" fill="none" stroke="currentColor" stroke-width="1.5"/>
    ${markSVG(mark)}
  </svg>`;
}

// Build an HTML page with all 64 icons in an 8×8 grid
const CELL = 80;
const COLS = 8;
const ROWS = 8;
const PAD = 12;

let cells = "";
let row = 0, col = 0;
for (const shape of OUTER_SHAPES) {
  for (const mark of INNER_MARKS) {
    const _x = PAD + col * CELL;
    const _y = PAD + row * CELL + 20;
    cells += `<div style="display:inline-flex;flex-direction:column;align-items:center;width:${CELL}px;padding:8px 0">
      ${iconSVG(shape, mark)}
      <span style="font-size:9px;color:#888;margin-top:4px;text-align:center;line-height:1.1">${shape}<br/>${mark}</span>
    </div>`;
    col++;
    if (col >= COLS) { col = 0; row++; }
  }
}

const html = `<!DOCTYPE html><html><body style="margin:0;padding:12px;background:#18181b;display:flex;flex-wrap:wrap;width:${COLS * CELL + PAD * 2}px">${cells}</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: COLS * CELL + PAD * 2, height: ROWS * CELL + PAD * 2 + 40 });
  await page.setContent(html);
  await page.waitForTimeout(200);
  const buf = await page.screenshot({ fullPage: true });
  await browser.close();

  mkdirSync(join(ROOT, "docs"), { recursive: true });
  writeFileSync(join(ROOT, "docs", "icons.png"), buf);
  console.log("Saved docs/icons.png");
})();
