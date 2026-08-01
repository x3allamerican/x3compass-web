/* Render family/index.template.html -> family/index.html with all content
 * inlined at build time. Marketing copy must be in the HTML for SEO; nothing
 * here depends on runtime JS. */
import { readFile, writeFile } from "node:fs/promises";
import { render } from "./render-data.mjs";

const tpl = await readFile(new URL("./index.template.html", import.meta.url), "utf8");
const frags = render();

let html = tpl;
let injected = 0;
for (const [id, body] of Object.entries(frags)) {
  const re = new RegExp(`(<(?:div|ul|tbody)[^>]*id="${id}"[^>]*>)(\\s*)(</(?:div|ul|tbody)>)`, "s");
  if (!re.test(html)) { console.error(`  build-index: no empty placeholder for #${id}`); process.exit(1); }
  // NB: replacer MUST be a function. A string replacement treats $1/$2/$3 as
  // capture-group refs, and our content is full of "$14,000", "$2,500",
  // "$3,500" — which silently injected captured tags mid-content and nested
  // the cards inside each other.
  html = html.replace(re, (_m, open, _ws, close) => open + body + close);
  injected++;
}
html = html.replace(/<span class="yr">\d{4}<\/span>/, `<span class="yr">${new Date().getFullYear()}</span>`);
html = html.replace(/\s*<script src="\/assets\/x3data\.js"><\/script>/g, "");

await writeFile(new URL("./index.html", import.meta.url), html, "utf8");
console.log(`  build-index: ${injected} fragments inlined, ${html.length} bytes`);
