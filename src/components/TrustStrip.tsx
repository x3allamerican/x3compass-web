export default function TrustStrip() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
      <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] mb-3">Trusted by motor carriers across</div>
      <div className="flex flex-wrap justify-center gap-6 text-[14px] font-bold text-[var(--fg)] opacity-80">
        <span>Michigan</span><span>Ohio</span><span>Indiana</span><span>Illinois</span><span>Wisconsin</span>
      </div>
    </div>
  );
}
