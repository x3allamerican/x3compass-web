import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills · 67,750+ CFR-cited compliance skills",
  description: "Every X3 Compass skill, every CFR citation, every category. Search by topic, by part, or by tier. Open-source on GitHub.",
  openGraph: {
    title: "X3 Compass Skills · 67,750+ CFR-cited compliance skills",
    description: "Browse the full skills catalog: 100 design skills, 100 hazmat skills, 100 FMCSA core skills. All open-source.",
    type: "website",
  },
};

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
