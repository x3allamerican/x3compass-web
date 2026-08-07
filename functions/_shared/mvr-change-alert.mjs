function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function shouldSendMvrChangeAlert(createdRows) {
  return Array.isArray(createdRows) && createdRows.length === 1 && Boolean(createdRows[0]?.id);
}

export function mvrChangeAlert({ carrierName, result, violationsCount, reportId, siteUrl }) {
  const base = String(siteUrl || "https://x3compass.com").replace(/\/$/, "");
  const count = Number.isInteger(violationsCount) ? violationsCount : null;
  const detail = count === null
    ? "The provider did not return a violation count."
    : `${count} reported violation record${count === 1 ? "" : "s"}.`;
  const safeCarrier = escapeHtml(carrierName || "Your fleet");
  const safeResult = escapeHtml(result || "updated");
  const safeReport = reportId ? `<p><strong>Provider report:</strong> ${escapeHtml(reportId)}</p>` : "";
  return {
    subject: `${carrierName || "Your fleet"} · MVR change detected`,
    html: `<h1>MVR change detected</h1><p>X3 Compass received a continuous MVR update for <strong>${safeCarrier}</strong>.</p><p><strong>Result:</strong> ${safeResult}<br><strong>Records:</strong> ${escapeHtml(detail)}</p>${safeReport}<p><a href="${base}/mvr">Review the MVR workspace →</a></p><p>This alert is decision support. Review the source report before taking action.</p>`,
    text: `MVR change detected for ${carrierName || "your fleet"}. Result: ${result || "updated"}. ${detail} Review: ${base}/mvr`,
  };
}
