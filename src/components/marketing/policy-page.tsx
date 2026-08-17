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
    <main className="min-h-screen bg-[#f5f7fa] px-5 py-16 text-[#102039] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-xl border border-[#dce3eb] bg-white p-7 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-bold text-[#13755f]">
          ← Back to ProofWork
        </Link>
        <p className="mt-10 text-xs font-bold tracking-[.16em] text-[#13755f]">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-.04em]">{title}</h1>
        <p className="mt-5 leading-7 text-[#627187]">{intro}</p>
        <p className="mt-3 text-xs text-[#8a98a9]">Last updated: August 16, 2026</p>
        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-7 text-[#627187]">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 border-t border-[#e1e7ed] pt-6 text-sm text-[#627187]">
          Questions or concerns?{" "}
          <a
            href="https://github.com/alishba-rehman2005/proofwork/issues"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#13755f]"
          >
            Contact ProofWork securely through GitHub
          </a>
          .
        </div>
      </article>
    </main>
  );
}
