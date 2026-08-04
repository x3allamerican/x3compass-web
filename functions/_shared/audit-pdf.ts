import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type AuditPdfRow = { label: string; value: string | number | boolean | null | undefined };
export type AuditPdfSection = { heading: string; citation?: string; rows: AuditPdfRow[]; emptyMessage?: string };
export type AuditPdfInput = {
  title: string; carrierName: string; usdotNumber?: string | null; generatedAt: string; sections: AuditPdfSection[];
};

const PAGE = { width: 612, height: 792, left: 46, right: 46, top: 52, bottom: 54 };
const CYAN = rgb(0.086, 0.78, 1);
const NAVY = rgb(0.035, 0.09, 0.16);
const MUTED = rgb(0.35, 0.4, 0.46);

function safe(value: unknown): string {
  return String(value ?? "Not documented")
    .replace(/[—–]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/•/g, "*")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const output: string[] = [];
  for (const paragraph of safe(text).split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) { output.push(""); continue; }
    let line = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${line} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
      else { output.push(line); line = word; }
    }
    output.push(line);
  }
  return output;
}

export async function renderAuditPdf(input: AuditPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(safe(input.title));
  pdf.setAuthor("X3 Compass");
  pdf.setSubject("FMCSA audit preparation evidence packet");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  const addPage = () => {
    page = pdf.addPage([PAGE.width, PAGE.height]); pages.push(page);
    page.drawRectangle({ x: 0, y: PAGE.height - 34, width: PAGE.width, height: 34, color: NAVY });
    page.drawText("X3", { x: PAGE.left, y: PAGE.height - 24, size: 15, font: bold, color: CYAN });
    page.drawText("COMPASS", { x: PAGE.left + 27, y: PAGE.height - 23, size: 10, font: bold, color: rgb(1, 1, 1) });
    y = PAGE.height - PAGE.top;
  };
  const ensure = (height: number) => { if (y - height < PAGE.bottom) addPage(); };
  const lines = (text: string, font: PDFFont, size: number, color = NAVY, indent = 0, leading = size + 3) => {
    const wrapped = wrap(text, font, size, PAGE.width - PAGE.left - PAGE.right - indent);
    ensure(wrapped.length * leading + 2);
    for (const line of wrapped) { page.drawText(line, { x: PAGE.left + indent, y, size, font, color }); y -= leading; }
  };

  addPage();
  lines(input.title, bold, 20, NAVY, 0, 24);
  y -= 3;
  lines(`${input.carrierName}${input.usdotNumber ? ` | USDOT ${input.usdotNumber}` : " | USDOT not documented"}`, bold, 10, MUTED);
  lines(`Generated ${safe(input.generatedAt)} | Evidence summary - not a compliance determination`, regular, 9, MUTED);
  y -= 10;

  for (const section of input.sections) {
    ensure(42);
    page.drawRectangle({ x: PAGE.left, y: y - 5, width: PAGE.width - PAGE.left - PAGE.right, height: 20, color: rgb(0.91, 0.97, 0.99) });
    page.drawText(safe(section.heading), { x: PAGE.left + 7, y, size: 12, font: bold, color: NAVY });
    y -= 25;
    if (section.citation) { lines(section.citation, regular, 8, MUTED); y -= 3; }
    if (section.rows.length === 0) {
      lines(section.emptyMessage || "No source records returned.", regular, 10, MUTED, 7);
      y -= 10;
      continue;
    }
    for (const row of section.rows) {
      const value = row.value === null || row.value === undefined || row.value === "" ? "Not documented" : String(row.value);
      lines(`${row.label}: ${value}`, regular, 9, NAVY, 7, 12);
      y -= 2;
    }
    y -= 9;
  }

  for (let index = 0; index < pages.length; index++) {
    const current = pages[index];
    current.drawLine({ start: { x: PAGE.left, y: 37 }, end: { x: PAGE.width - PAGE.right, y: 37 }, thickness: 0.5, color: rgb(0.8, 0.82, 0.84) });
    current.drawText("Decision support only. Verify source records and scope with a qualified reviewer.", { x: PAGE.left, y: 23, size: 7, font: regular, color: MUTED });
    current.drawText(`Page ${index + 1} of ${pages.length}`, { x: PAGE.width - PAGE.right - 58, y: 23, size: 7, font: regular, color: MUTED });
  }
  return pdf.save();
}
