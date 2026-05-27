/**
 * pdf-lib helper · stamp the X3 Compass letterhead onto an existing PDF
 *
 * Stack 2 of the PDF strategy (research task #307):
 *   - Stack 1 (Cloudflare Browser Rendering) generates NEW branded PDFs from
 *     HTML templates · /api/pdf/render
 *   - Stack 2 (this file) takes an EXISTING PDF (PHMSA template a carrier
 *     uploaded, a Checkr report, a 3rd-party manifest) and overlays the X3
 *     band on every page · /api/pdf/stamp
 *   - Both endpoints write to compass_pdf_generated audit ledger
 *
 * Why pdf-lib not Browser Rendering for this case:
 *   Browser Rendering only takes HTML/URL inputs · can't accept an existing
 *   PDF and modify it. pdf-lib parses an existing PDF buffer + lets us draw
 *   overlays per page. Runs natively in Cloudflare Pages Functions, no
 *   Browser Rendering call required, no per-render cost.
 *
 * Known constraint (workers-sdk issue #8140): @pdf-lib/fontkit is broken on
 * Cloudflare Workers, so we cannot embed custom fonts. We stick to the 14
 * built-in Standard Fonts via PDFDocument.embedFont(StandardFonts.X). Those
 * cover the wordmark + page-number footer just fine.
 *
 * Logo rendering: we embed the same base64 PNG used by the Browser Rendering
 * headerTemplate · same pixel logo, same brand colors.
 *
 * Same visual language as buildHeaderTemplate():
 *   - Dark navy band (#0A1929) along the top of every page
 *   - White X3 logo + 'X3 COMPASS' wordmark
 *   - Cyan accent line (#16C7FF) below the band
 *   - Subtle footer with brand line + 'Page X of Y'
 */

import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { X3_LOGO_PNG_BASE64 } from "./pdfTemplates/logo";

export type StampOptions = {
  /** Optional subtitle shown in the band right side · e.g. 'Hazmat audit · §172' */
  subtitle?: string;
  /** Footer brand line · defaults to 'X3 Compass · DOT compliance brain' */
  footerBrand?: string;
  /** Skip the bottom footer entirely · useful when the source PDF already has one */
  skipFooter?: boolean;
};

const BAND_HEIGHT = 56;   // pt · roughly matches the 1.55in HTML band when accounting for the body shift
const FOOTER_HEIGHT = 24; // pt

// Brand colors as rgb() · pdf-lib expects 0-1 floats
const NAVY_TOP    = rgb(0.039, 0.098, 0.161); // #0A1929
const NAVY_BOTTOM = rgb(0.055, 0.141, 0.220); // #0E2438 (we approximate the gradient with a single fill · pdf-lib doesn't natively gradient)
const CYAN        = rgb(0.086, 0.780, 1.000); // #16C7FF
const WHITE       = rgb(1, 1, 1);
const MUTED       = rgb(0.580, 0.639, 0.722); // #94A3B8 · for date / footer page number

/* ============================================================
   Logo embedding · base64 → Uint8Array → embedded PNG
   Lazy-loaded so we don't pay the cost when stamping isn't used
   ============================================================ */

function base64ToBytes(b64: string): Uint8Array {
  // Workers runtime supports atob but it returns a binary string · convert to bytes
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ============================================================
   PUBLIC · stamp the X3 band on an existing PDF buffer
   ============================================================ */

export async function stampPdf(
  sourceBuffer: ArrayBuffer | Uint8Array,
  opts: StampOptions = {}
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });

  // Embed logo + fonts once · reused across pages
  const logoBytes = base64ToBytes(X3_LOGO_PNG_BASE64);
  const logo = await pdf.embedPng(logoBytes);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);

  const totalPages = pdf.getPageCount();
  const today = new Date().toLocaleDateString("en-US", { dateStyle: "long" });

  pdf.getPages().forEach((page, idx) => {
    stampPage(page, {
      logo,
      helvBold,
      helv,
      pageNumber: idx + 1,
      totalPages,
      today,
      subtitle: opts.subtitle,
      footerBrand: opts.footerBrand || "X3 Compass · DOT compliance brain · x3compass.com",
      skipFooter: opts.skipFooter || false,
    });
  });

  // Save with object stream compression for smaller output
  return await pdf.save({ useObjectStreams: true, addDefaultPage: false });
}

/* ============================================================
   PUBLIC · merge multiple PDFs into one branded packet
   Each input PDF is COPIED page-by-page into a new document, then
   we stamp the band on every page so the resulting packet feels
   like a single X3-branded document.
   ============================================================ */

export type MergeSource =
  | { kind: "buffer"; buffer: ArrayBuffer | Uint8Array; label?: string }
  | { kind: "base64"; base64: string; label?: string };

export type MergeOptions = StampOptions & {
  /** Optional cover page · if provided, prepended before all source pages */
  cover?: {
    title: string;
    subtitle?: string;
    meta?: string[]; // lines of key/value text under the title
  };
  /** Whether to stamp the X3 band on every page · defaults to true */
  stamp?: boolean;
};

export async function mergePdfs(
  sources: MergeSource[],
  opts: MergeOptions = {}
): Promise<Uint8Array> {
  const stamp = opts.stamp !== false;
  const out = await PDFDocument.create();
  const helvBold = await out.embedFont(StandardFonts.HelveticaBold);
  const helv = await out.embedFont(StandardFonts.Helvetica);
  const logoBytes = base64ToBytes(X3_LOGO_PNG_BASE64);
  const logo = await out.embedPng(logoBytes);
  const today = new Date().toLocaleDateString("en-US", { dateStyle: "long" });

  // Optional cover page first
  if (opts.cover) {
    const cover = out.addPage([612, 792]); // US Letter
    drawCoverContent(cover, {
      logo,
      helvBold,
      helv,
      title: opts.cover.title,
      subtitle: opts.cover.subtitle,
      meta: opts.cover.meta || [],
      today,
    });
  }

  // Copy each source PDF's pages into our output document
  for (const src of sources) {
    const bytes = src.kind === "base64" ? base64ToBytes(src.base64) : new Uint8Array(src.buffer as ArrayBuffer);
    const srcPdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const copied = await out.copyPages(srcPdf, srcPdf.getPageIndices());
    copied.forEach((p) => out.addPage(p));
  }

  // Stamp every page (including the cover, if any · the cover already has the
  // band-style header drawn manually, but the stamp will be a thin reinforcement).
  if (stamp) {
    const totalPages = out.getPageCount();
    out.getPages().forEach((page, idx) => {
      stampPage(page, {
        logo,
        helvBold,
        helv,
        pageNumber: idx + 1,
        totalPages,
        today,
        subtitle: opts.subtitle,
        footerBrand: opts.footerBrand || "X3 Compass · DOT compliance brain · x3compass.com",
        skipFooter: opts.skipFooter || false,
        // The cover page already has a full hero band · skip our overlay on it
        skipBand: idx === 0 && !!opts.cover,
      });
    });
  }

  return await out.save({ useObjectStreams: true, addDefaultPage: false });
}

/* ============================================================
   INTERNAL · single-page stamp routine
   pdf-lib draws bottom-up (origin at bottom-left), so y-coordinates
   for the header band are calculated from page height
   ============================================================ */

type StampPageCtx = {
  logo: Awaited<ReturnType<PDFDocument["embedPng"]>>;
  helvBold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  helv: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  pageNumber: number;
  totalPages: number;
  today: string;
  subtitle?: string;
  footerBrand: string;
  skipFooter: boolean;
  skipBand?: boolean;
};

function stampPage(page: PDFPage, ctx: StampPageCtx) {
  const { width, height } = page.getSize();
  const padding = 32; // pt, ~0.44 in side margins

  if (!ctx.skipBand) {
    // ---- 1. The dark navy band along the very top ----
    page.drawRectangle({
      x: 0,
      y: height - BAND_HEIGHT,
      width,
      height: BAND_HEIGHT,
      color: NAVY_TOP,
    });
    // Thin diagonal of NAVY_BOTTOM to fake the gradient subtly
    page.drawRectangle({
      x: width / 2,
      y: height - BAND_HEIGHT,
      width: width / 2,
      height: BAND_HEIGHT,
      color: NAVY_BOTTOM,
      opacity: 0.5,
    });

    // ---- 2. Cyan accent stripe directly below the band ----
    page.drawRectangle({
      x: 0,
      y: height - BAND_HEIGHT - 2,
      width,
      height: 2,
      color: CYAN,
    });

    // ---- 3. Logo + 'X3 Compass' wordmark, left-aligned ----
    const logoHeight = 32;
    const logoDims = ctx.logo.scale(logoHeight / ctx.logo.height);
    const logoY = height - BAND_HEIGHT / 2 - logoDims.height / 2;
    page.drawImage(ctx.logo, {
      x: padding,
      y: logoY,
      width: logoDims.width,
      height: logoDims.height,
    });

    const wordmark = "X3 Compass";
    const wordmarkSize = 16;
    page.drawText(wordmark, {
      x: padding + logoDims.width + 10,
      y: height - BAND_HEIGHT / 2 - wordmarkSize / 3,
      size: wordmarkSize,
      font: ctx.helvBold,
      color: WHITE,
    });

    // ---- 4. Subtitle (cyan, uppercase) center-right · only if provided ----
    if (ctx.subtitle) {
      const subSize = 9;
      const subWidth = ctx.helvBold.widthOfTextAtSize(ctx.subtitle.toUpperCase(), subSize);
      page.drawText(ctx.subtitle.toUpperCase(), {
        x: width - padding - subWidth - 140, // leave 140pt for the date on the far right
        y: height - BAND_HEIGHT / 2 - subSize / 3,
        size: subSize,
        font: ctx.helvBold,
        color: CYAN,
      });
    }

    // ---- 5. Date, right-aligned ----
    const dateSize = 9;
    const dateWidth = ctx.helv.widthOfTextAtSize(ctx.today, dateSize);
    page.drawText(ctx.today, {
      x: width - padding - dateWidth,
      y: height - BAND_HEIGHT / 2 - dateSize / 3,
      size: dateSize,
      font: ctx.helv,
      color: MUTED,
    });
  }

  if (!ctx.skipFooter) {
    // ---- 6. Footer · thin grey line + brand + page X of Y ----
    page.drawRectangle({
      x: padding,
      y: FOOTER_HEIGHT + 2,
      width: width - padding * 2,
      height: 0.5,
      color: rgb(0.796, 0.835, 0.882), // #CBD5E1
    });
    const footerSize = 8;
    page.drawText(ctx.footerBrand, {
      x: padding,
      y: FOOTER_HEIGHT - 8,
      size: footerSize,
      font: ctx.helv,
      color: MUTED,
    });
    const pageLabel = `Page ${ctx.pageNumber} of ${ctx.totalPages}`;
    const pageLabelWidth = ctx.helv.widthOfTextAtSize(pageLabel, footerSize);
    page.drawText(pageLabel, {
      x: width - padding - pageLabelWidth,
      y: FOOTER_HEIGHT - 8,
      size: footerSize,
      font: ctx.helv,
      color: MUTED,
    });
  }
}

/* ============================================================
   INTERNAL · cover page draw routine
   ============================================================ */

type CoverCtx = {
  logo: Awaited<ReturnType<PDFDocument["embedPng"]>>;
  helvBold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  helv: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  title: string;
  subtitle?: string;
  meta: string[];
  today: string;
};

function drawCoverContent(page: PDFPage, ctx: CoverCtx) {
  const { width, height } = page.getSize();
  const padding = 56;

  // Top hero band, taller than the per-page stamp band
  const heroHeight = 160;
  page.drawRectangle({ x: 0, y: height - heroHeight, width, height: heroHeight, color: NAVY_TOP });
  page.drawRectangle({ x: 0, y: height - heroHeight - 3, width, height: 3, color: CYAN });

  // Big centered logo + wordmark
  const logoHeight = 72;
  const logoDims = ctx.logo.scale(logoHeight / ctx.logo.height);
  page.drawImage(ctx.logo, {
    x: width / 2 - logoDims.width - 8,
    y: height - heroHeight / 2 - logoDims.height / 2 + 4,
    width: logoDims.width,
    height: logoDims.height,
  });
  const wordmarkSize = 28;
  page.drawText("X3 Compass", {
    x: width / 2 + 8,
    y: height - heroHeight / 2 - wordmarkSize / 3,
    size: wordmarkSize,
    font: ctx.helvBold,
    color: WHITE,
  });

  // Title block, centered, ~1/3 down the page
  const titleSize = 30;
  const titleY = height - heroHeight - 100;
  const titleWidth = ctx.helvBold.widthOfTextAtSize(ctx.title, titleSize);
  page.drawText(ctx.title, {
    x: (width - titleWidth) / 2,
    y: titleY,
    size: titleSize,
    font: ctx.helvBold,
    color: rgb(0.060, 0.090, 0.165), // #0F172A
  });

  if (ctx.subtitle) {
    const subSize = 14;
    const subWidth = ctx.helv.widthOfTextAtSize(ctx.subtitle, subSize);
    page.drawText(ctx.subtitle, {
      x: (width - subWidth) / 2,
      y: titleY - 36,
      size: subSize,
      font: ctx.helv,
      color: rgb(0.278, 0.341, 0.412), // #475569
    });
  }

  // Meta rows centered below title
  const metaSize = 11;
  ctx.meta.forEach((line, i) => {
    const lineWidth = ctx.helv.widthOfTextAtSize(line, metaSize);
    page.drawText(line, {
      x: (width - lineWidth) / 2,
      y: titleY - 80 - i * 18,
      size: metaSize,
      font: ctx.helv,
      color: rgb(0.291, 0.341, 0.412),
    });
  });

  // Generated-on stamp, bottom-center
  const generated = `Generated ${ctx.today}`;
  const genSize = 10;
  const genWidth = ctx.helv.widthOfTextAtSize(generated, genSize);
  page.drawText(generated, {
    x: (width - genWidth) / 2,
    y: padding,
    size: genSize,
    font: ctx.helv,
    color: MUTED,
  });
}
