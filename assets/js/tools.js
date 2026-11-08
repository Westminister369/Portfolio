// Single source of truth for tool logos (hero, marquee, toolbox).
// `slug` → vector glyph from icons.js (drawn in `color`); `img` → official raster/SVG icon.
import { ICONS } from "./icons.js";

export const TOOLS = [
  // AI
  { name: "Claude", cat: "ai", slug: "claude", color: "#D97757" },
  { name: "GPT-6", cat: "ai", slug: "openai", color: "#111111" },
  { name: "Copilot", cat: "ai", img: "assets/img/logos/tool-copilot.svg" },
  { name: "Google AI Studio", cat: "ai", slug: "googlegemini", color: "#8E75B2" },
  { name: "Google Colab", cat: "ai", slug: "googlecolab", color: "#F9AB00" },
  { name: "Labelbox", cat: "ai", img: "assets/img/logos/labelbox.webp" },
  { name: "V7 Labs", cat: "ai", img: "assets/img/logos/tool-v7.webp" },
  // Growth
  { name: "Clay", cat: "growth", img: "assets/img/logos/tool-clay.webp" },
  { name: "Instantly", cat: "growth", img: "assets/img/logos/tool-instantly.webp" },
  { name: "Waalaxy", cat: "growth", img: "assets/img/logos/tool-waalaxy.webp" },
  { name: "LinkedIn", cat: "growth", slug: "linkedin", color: "#0A66C2" },
  { name: "YouTube", cat: "growth", slug: "youtube", color: "#FF0000" },
  { name: "WordPress", cat: "growth", slug: "wordpress", color: "#21759B" },
  { name: "Sanity", cat: "growth", slug: "sanity", color: "#F03E2F" },
  { name: "Rank Math", cat: "growth", img: "assets/img/logos/tool-rankmath.webp" },
  { name: "Search Console", cat: "growth", slug: "googlesearchconsole", color: "#458CF5" },
  { name: "Semrush", cat: "growth", slug: "semrush", color: "#FF642D" },
  // Ops & data
  { name: "n8n", cat: "ops", slug: "n8n", color: "#EA4B71" },
  { name: "Power Automate", cat: "ops", slug: "powerautomate", color: "#0066FF" },
  { name: "GA4", cat: "ops", slug: "googleanalytics", color: "#E37400" },
  { name: "Looker Studio", cat: "ops", slug: "looker", color: "#4285F4" },
  { name: "Zoho CRM", cat: "ops", slug: "zoho", color: "#E42527" },
  { name: "Notion", cat: "ops", slug: "notion", color: "#111111" },
  { name: "Airtable", cat: "ops", slug: "airtable", color: "#18BFFF" },
  { name: "Google Sheets", cat: "ops", slug: "googlesheets", color: "#34A853" },
  { name: "Excel · M365", cat: "ops", slug: "microsoftexcel", color: "#217346" },
  { name: "Slack", cat: "ops", slug: "slack", color: "#4A154B" },
  { name: "GitHub", cat: "ops", slug: "github", color: "#181717" },
  // Design
  { name: "Google Stitch", cat: "design", img: "assets/img/logos/tool-stitch.webp" },
  { name: "Canva", cat: "design", slug: "canva", color: "#00C4CC" },
  { name: "Adobe CC", cat: "design", slug: "adobe", color: "#FF0000" },
  { name: "Figma", cat: "design", slug: "figma", color: "#F24E1E" },
  { name: "Miro", cat: "design", slug: "miro", color: "#E6B800" },
];

/** Markup for a tool's logo in its original colours. */
export function logoHTML(t) {
  if (t.img) return `<img src="${t.img}" alt="" width="64" height="64" loading="lazy" decoding="async">`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:${t.color}"><path d="${ICONS[t.slug].p}"/></svg>`;
}
