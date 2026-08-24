import Link from "next/link";

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-16 text-foreground sm:px-8">
      <article className="mx-auto max-w-3xl rounded-xl border border-line bg-white p-7 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-bold text-[#003bfa]">
          ← Back to ProofWork
        </Link>
        <p className="mt-10 text-xs font-bold tracking-[.16em] text-[#003bfa]">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em]">{title}</h1>
        <p className="mt-5 leading-7 text-muted">{intro}</p>
        <p className="mt-3 text-xs text-faint">Last updated: August 16, 2026</p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-7 text-muted">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 border-t border-line pt-6 text-sm text-muted">
          Questions or concerns?{" "}
          <a
            href="https://github.com/alishba-rehman2005/proofwork/issues"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#003bfa]"
          >
            Contact ProofWork securely through GitHub
          </a>
          .
        </div>
      </article>
    </main>
  );
}
