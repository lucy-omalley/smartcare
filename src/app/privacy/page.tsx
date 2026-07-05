import Link from "next/link";
import { HomeNav } from "@/components/nav/home-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy | Parenfy Public Beta",
  description: "How Parenfy handles your data during Public Beta.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1 container max-w-3xl px-4 py-12 md:py-16">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Public Beta</p>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground leading-relaxed">
              Last updated: July 2026. Parenfy (&quot;we&quot;, &quot;us&quot;) is an AI parenting companion in Public Beta.
            </p>
          </div>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">What Parenfy provides</h2>
            <p>
              Parenfy offers general parenting support — daily plans, MumBot AI guidance, activities, stories,
              meals, language practice, and optional parent connection features. It is{" "}
              <strong className="text-foreground">not</strong> medical, developmental, legal, or emergency advice.
              Always use your judgement and seek professional help when needed.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Account details (name, email) when you sign up</li>
              <li>Child profile information you choose to provide (nickname, age range, interests, goals)</li>
              <li>Usage analytics to improve the product (pages viewed, features used, errors)</li>
              <li>Feedback you submit voluntarily</li>
              <li>MumBot conversations stored to provide continuity (not used for public display)</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Connect &amp; location privacy</h2>
            <p>
              Connect shows <strong className="text-foreground">broad area</strong> (e.g. neighbourhood name),
              time windows, activity type, and general child age range — never your exact home address or live GPS
              location unless you voluntarily share exact meetup details in a private context.
            </p>
            <p>
              Child full names, private contact details, and exact addresses are not shown publicly in Connect.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Child data</h2>
            <p>
              Please handle child-related information carefully. We store what you enter to personalise your
              experience. Avoid sharing sensitive health information in free-text fields.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Analytics &amp; session replay</h2>
            <p>
              We use PostHog for product analytics. Sensitive fields (passwords, private notes, conversation text)
              are masked. Session replay may be enabled with input masking during Public Beta.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
            <p>
              You may request access to or deletion of your data by contacting us. You can delete memories and
              update your profile at any time within the app.
            </p>
          </section>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link href="/contact">
              <Button variant="outline" className="rounded-xl">Contact us</Button>
            </Link>
            <Link href="/terms">
              <Button variant="ghost" className="rounded-xl">Terms of Service</Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
