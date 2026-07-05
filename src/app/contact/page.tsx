import Link from "next/link";
import { HomeNav } from "@/components/nav/home-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Contact | Parenfy Public Beta",
  description: "Get in touch with the Parenfy team during Public Beta.",
};

const SUPPORT_EMAIL = "hello@parenfy.com";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1 container max-w-3xl px-4 py-12 md:py-16">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Public Beta</p>
            <h1 className="text-3xl font-bold tracking-tight">Contact &amp; Support</h1>
            <p className="text-muted-foreground leading-relaxed">
              We read every message during Public Beta. Your feedback directly shapes Parenfy.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-5 space-y-3">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Email support</h2>
              <p className="text-sm text-muted-foreground">
                Account issues, data deletion requests, or general questions.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Parenfy%20Public%20Beta%20Support`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
            <div className="rounded-2xl border p-5 space-y-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">In-app feedback</h2>
              <p className="text-sm text-muted-foreground">
                Signed-in users can tap the Feedback button on Today, MumBot, Connect, or Profile.
              </p>
              <Link href="/auth/signin">
                <Button size="sm" variant="outline" className="rounded-xl">
                  Sign in to send feedback
                </Button>
              </Link>
            </div>
          </div>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Data deletion requests</h2>
            <p>
              Email us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              from the address linked to your account. We will confirm deletion of your profile and associated data.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-lg font-semibold text-foreground">Emergency</h2>
            <p>
              Parenfy is not an emergency service. If you or your child need urgent medical help, contact your local
              emergency services immediately.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
