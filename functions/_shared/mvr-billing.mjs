export const MVR_MONTHLY_VENDOR_CENTS = 250;
export const MVR_MONTHLY_RETAIL_CENTS = 500;
export const MVR_TRIGGER_VENDOR_CENTS = 950;
export const MVR_TRIGGER_RETAIL_CENTS = 950;

export function mvrChargeSummary({ activeMonitors, triggeredReports }) {
  if (!Number.isInteger(activeMonitors) || activeMonitors < 0) throw new TypeError("activeMonitors must be a non-negative integer");
  if (!Number.isInteger(triggeredReports) || triggeredReports < 0) throw new TypeError("triggeredReports must be a non-negative integer");
  const monthlyVendorCents = activeMonitors * MVR_MONTHLY_VENDOR_CENTS;
  const monthlyRetailCents = activeMonitors * MVR_MONTHLY_RETAIL_CENTS;
  const triggeredVendorCents = triggeredReports * MVR_TRIGGER_VENDOR_CENTS;
  const triggeredRetailCents = triggeredReports * MVR_TRIGGER_RETAIL_CENTS;
  return {
    monthlyVendorCents,
    monthlyRetailCents,
    triggeredVendorCents,
    triggeredRetailCents,
    vendorTotalCents: monthlyVendorCents + triggeredVendorCents,
    retailTotalCents: monthlyRetailCents + triggeredRetailCents,
    marginCents: monthlyRetailCents + triggeredRetailCents - monthlyVendorCents - triggeredVendorCents,
  };
}
