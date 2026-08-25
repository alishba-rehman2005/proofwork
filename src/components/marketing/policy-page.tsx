import { auth } from "@/auth";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

/**
 * Shared layout for the legal pages.
 *
 * The article surface used to be a literal `bg-white`, so in dark mode the
 * near-white --foreground text sat on a white card at 1.09:1 and the whole page
 * was unreadable. Everything here reads from the theme now, and the pages carry
 * the same header and footer as the rest of the public site rather than a lone
 * back link.
 */
export async function PolicyPage({
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
  const session = await auth();

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader signedIn={Boolean(session?.user)} />

      <main className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <article className="mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10 lg:p-12">
          <p className="text-xs font-bold tracking-[.16em] text-primary">{eyebrow}</p>

          <h1 className="mt-3 text-[32px] leading-[1.15] font-bold tracking-[-0.035em] sm:text-[40px]">
            {title}
          </h1>

          <p className="mt-5 text-base leading-7 text-muted">{intro}</p>

          <p className="mt-3 text-sm text-muted">Last updated: August 16, 2026</p>

          <div className="mt-10 space-y-8 border-t border-line pt-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-bold tracking-[-0.02em]">{section.title}</h2>

                <p className="mt-3 text-base leading-7 text-muted">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 border-t border-line pt-6 text-sm text-muted">
            Questions or concerns?{" "}
            <a
              href="https://github.com/alishba-rehman2005/proofwork/issues"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Contact ProofWork securely through GitHub
            </a>
            .
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
