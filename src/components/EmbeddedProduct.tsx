import AppShell from "@/components/AppShell";

/** Frames a standalone X3 product's /app dashboard inside the Compass shell.
 *  The product apps send CSP frame-ancestors allowing *.x3compass.com. */
export default function EmbeddedProduct({ title, crumbs, src }: { title: string; crumbs: string; src: string }) {
  return (
    <AppShell title={title} crumbs={crumbs}>
      <div className="w-full" style={{ height: "calc(100vh - 128px)", minHeight: 640 }}>
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0 rounded-xl bg-white"
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="origin"
        />
      </div>
    </AppShell>
  );
}
