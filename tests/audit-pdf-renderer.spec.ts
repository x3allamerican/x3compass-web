import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { renderAuditPdf } from "../functions/_shared/audit-pdf";

test("renders valid branded PDF bytes and paginates long evidence", async () => {
  const bytes = await renderAuditPdf({
    title: "Driver Qualification File — A very long title that must wrap safely without leaving the printable page",
    carrierName: "X3 Test Carrier",
    usdotNumber: "1234567",
    generatedAt: "2026-08-04T12:00:00.000Z",
    sections: [{
      heading: "Document index",
      citation: "49 CFR 391.51",
      rows: Array.from({ length: 120 }, (_, index) => ({ label: `Evidence ${index + 1}`, value: `Stored record ${index + 1} · ${"document detail ".repeat(8)}` })),
    }],
  });

  expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBeGreaterThan(1);
  expect(bytes.length).toBeGreaterThan(2_000);
});

test("renders explicit missing evidence without requiring rows", async () => {
  const bytes = await renderAuditPdf({
    title: "D&A Program Summary", carrierName: "Empty Carrier", usdotNumber: null,
    generatedAt: "2026-08-04T12:00:00.000Z",
    sections: [{ heading: "Test records", citation: "49 CFR Part 382", rows: [], emptyMessage: "No D&A test records returned." }],
  });
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
});
