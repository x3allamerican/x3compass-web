/**
 * Single source of truth for pricing.
 * Trust agent flagged that homepage + /pricing listed different features —
 * a buyer reading both walks away distrustful. This module is the canon.
 */

export type Tier = {
  key: "diy" | "dfy" | "enterprise" | "hazmat";
  name: string;
  subtitle?: string;
  price: number | null;     // null = "Talk to us"
  unit: string;
  blurb: string;
  features: string[];
  featured?: boolean;
  cta: { label: string; href: string };
};

export const TIERS: Tier[] = [
  {
    key: "diy", name: "DIY", subtitle: "Compass AI",
    price: 25, unit: "per driver / mo",
    blurb: "AI Safety Director + 300+ FMCSA skills — you operate it.",
    features: [
      "AI brain across 12 compliance domains",
      "300+ CFR-cited skills",
      "DataQ dispute drafter",
      "Driver Qualification File generator",
      "Auto MVR pull cadence",
      "Email support",
    ],
    cta: { label: "Start 7-day free trial", href: "/signup?plan=diy" },
  },
  {
    key: "dfy", name: "DFY", subtitle: "Compass Concierge",
    price: 50, unit: "per driver / mo",
    blurb: "Done-for-you. We operate Compass on your account.",
    features: [
      "Everything in DIY",
      "Dedicated safety advisor",
      "Monthly compliance review call",
      "FMCSA audit prep included",
      "We file MVRs, drug tests, Clearinghouse",
      "Priority Slack + phone support",
      "Same-day DataQ dispute filing",
    ],
    featured: true,
    cta: { label: "Start 7-day free trial", href: "/signup?plan=dfy" },
  },
  {
    key: "enterprise", name: "Enterprise", subtitle: "100+ trucks",
    price: null, unit: "custom",
    blurb: "Multi-yard, integrations, custom SLAs.",
    features: [
      "Everything in DFY",
      "Multi-tenant org structure",
      "SSO + SCIM",
      "Custom integrations",
      "Dedicated CSM + named legal counsel",
      "Custom data residency",
      "MSA + signed BAA",
    ],
    cta: { label: "Talk to us", href: "/partners" },
  },
];

export const HAZMAT_ADDON = {
  name: "Hazmat add-on",
  price: 99,
  unit: "/ mo",
  features: [
    "100+ hazmat-specific skills (Parts 100-180)",
    "Interactive placard wizard with live preview",
    "Shipping paper template builder",
    "Emergency response info (ERG) lookups",
    "Hazardous waste manifest mode",
    "PHMSA registration cross-reference",
  ],
};

export function tierByKey(k: string): Tier | undefined { return TIERS.find(t => t.key === k); }
