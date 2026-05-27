import Link from "next/link";
export default function Related({ items = [] }: { items?: { href: string; title: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">Related</div>
      <ul className="space-y-2">{items.map((it) => (<li key={it.href}><Link href={it.href} className="text-[14px] text-[var(--accent)] hover:underline">{it.title}</Link></li>))}</ul>
    </div>
  );
}
