const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function plusDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dqDocumentStatus(document, today = new Date().toISOString().slice(0, 10)) {
  if (!document) return "missing";
  const expiration = document.expires_date;
  if (typeof expiration === "string" && ISO_DATE.test(expiration)) {
    if (expiration < today) return "expired";
    if (expiration <= plusDays(today, 30)) return "expiring";
  }
  return document.status === "complete" ? "complete" : "missing";
}

export function recomputeDqCompleteness({ driverId, requirements, documents, today = new Date().toISOString().slice(0, 10) }) {
  const required = requirements.filter((requirement) => requirement.alwaysRequired);
  const statuses = required.map((requirement) => dqDocumentStatus(documents[`${driverId}::${requirement.key}`], today));
  const expiring30 = statuses.filter((status) => status === "expiring").length;
  const expired = statuses.filter((status) => status === "expired").length;
  const missing = statuses.filter((status) => status === "missing").length;
  const complete = statuses.filter((status) => status === "complete" || status === "expiring").length;
  return {
    complete,
    required: required.length,
    expiring30,
    expired,
    missing,
    percent: required.length ? Math.round((complete / required.length) * 100) : 0,
  };
}
