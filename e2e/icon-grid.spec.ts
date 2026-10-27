import { test } from "@playwright/test";
import path from "path";

// Generate an HTML grid of all 64 PA icons and screenshot it
test("screenshot all PA icons in a grid", async ({ page }) => {
  const OUTER_SHAPES = [
    "ring", "square", "triangle", "diamond",
    "hexagon", "star", "pentagon", "shield",
  ];
  const INNER_MARKS = [
    "none", "dot", "circle", "hdash",
    "vdash", "diag", "x", "tri",
  ];

  const OUTER_PATHS: Record<string, string> = {
    ring:     "M16 4 a12 12 0 1 0 0.01 0",
    square:   "M5 5 h22 v22 h-22 z",
    triangle: "M16 3 L30 28 L2 28 z",
    diamond:  "M16 2 L30 16 L16 30 L2 16 z",
    hexagon:  "M16 3 L27.9 9.5 L27.9 22.5 L16 29 L4.1 22.5 L4.1 9.5 z",
    star:     "M16 2 L19.1 11.1 L28.5 11.1 L21.2 16.8 L23.8 26.2 L16 20.8 L8.2 26.2 L10.8 16.8 L3.5 11.1 L12.9 11.1 z",
    pentagon: "M16 3 L28.4 11.9 L23.6 26.5 L8.4 26.5 L3.6 11.9 z",
    shield:   "M16 3 L28 8 V18 Q28 28 16 30 Q4 28 4 18 V8 z",
  };

  function markSvg(mark: string): string {
    switch (mark) {
      case "dot":    return `<circle cx="16" cy="16" r="3.5" fill="#7c5af3"/>`;
      case "circle": return `<circle cx="16" cy="16" r="5" fill="none" stroke="#7c5af3" stroke-width="1.5"/>`;
      case "hdash":  return `<line x1="10" y1="16" x2="22" y2="16" stroke="#7c5af3" stroke-width="1.5" stroke-linecap="round"/>`;
      case "vdash":  return `<line x1="16" y1="10" x2="16" y2="22" stroke="#7c5af3" stroke-width="1.5" stroke-linecap="round"/>`;
      case "diag":   return `<line x1="10" y1="10" x2="22" y2="22" stroke="#7c5af3" stroke-width="1.5" stroke-linecap="round"/>`;
      case "x":      return `<line x1="10" y1="10" x2="22" y2="22" stroke="#7c5af3" stroke-width="1.5" stroke-linecap="round"/><line x1="10" y1="22" x2="22" y2="10" stroke="#7c5af3" stroke-width="1.5" stroke-linecap="round"/>`;
      case "tri":    return `<polygon points="16,10 22,21 10,21" fill="none" stroke="#7c5af3" stroke-width="1.5" stroke-linejoin="round"/>`;
      default:       return "";
    }
  }

  const icons = OUTER_SHAPES.flatMap((shape) =>
    INNER_MARKS.map((mark) => {
      const outerPath = OUTER_PATHS[shape]!;
      const id = `${shape}-${mark}`;
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
            <path d="${outerPath}" stroke="#7c5af3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            ${markSvg(mark)}
          </svg>
          <span style="font-size:9px;color:#666;text-align:center">${id}</span>
        </div>`;
    })
  );

  const html = `<!DOCTYPE html><html><body style="
    background:#1a1a2e;
    display:grid;
    grid-template-columns:repeat(8,90px);
    gap:12px;
    padding:20px;
    font-family:monospace;
  ">${icons.join("")}</body></html>`;

  await page.setContent(html);
  const outPath = path.resolve(
    __dirname,
    "..",
    "icon-grid.png"
  );
  await page.screenshot({ path: outPath, fullPage: true });
});
