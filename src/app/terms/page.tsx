import Link from "next/link";
import { HomeNav } from "@/components/nav/home-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service | Parenfy Public Beta",
  description: "Terms for using Parenfy during Public Beta.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1 container max-w-3xl px-4 py-12 md:py-16">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Public Beta</p>
            <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground leading-relaxed">
              By using Parenfy during Public Beta, you agree to these terms.
            </p>
          </div>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Public Beta</h2>
            <p>
              Parenfy is in Public Beta. Features may change, break temporarily, or be removed. We welcome feedback
              to improve the product. There is no service-level guarantee during beta.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Not professional advice</h2>
            <p>
              Parenfy and MumBot provide general parenting support only. They do not replace paediatricians,
              therapists, educators, lawyers, or emergency services. For medical emergencies, call your local
              emergency number immediately.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Your account</h2>
            <p>
              You are responsible for keeping your login credentials secure. You must provide accurate account
              information and use Parenfy in good faith.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Connect &amp; community</h2>
            <p>
              When meeting other parents, use your judgement. Only share exact meetup details when you feel
              comfortable. Do not share other users&apos; private information. Report or block concerning behaviour
              (moderation tools are being expanded during beta).
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
            <p>
              Do not abuse MumBot, scrape the service, attempt to access others&apos; data, or use Parenfy for
              unlawful purposes. We may suspend accounts that violate these terms.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Limitation of liability</h2>
            <p>
              Parenfy is provided &quot;as is&quot; during Public Beta. To the extent permitted by law, we are not
              liable for decisions you make based on AI-generated content or parent connections made through the app.
            </p>
          </section>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link href="/privacy">
              <Button variant="outline" className="rounded-xl">Privacy Policy</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="rounded-xl">Contact support</Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
