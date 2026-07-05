import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container px-4 md:px-6 py-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="space-y-2 max-w-sm">
            <p className="font-semibold">Parenfy</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Parenfy is in Public Beta. We are building it with parents.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <p className="font-medium">Product</p>
              <Link href="/auth/register" className="block text-muted-foreground hover:text-foreground">
                Join Public Beta
              </Link>
              <Link href="/auth/signin" className="block text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Legal &amp; support</p>
              <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/contact" className="block text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-8 pt-6 border-t">
          © {new Date().getFullYear()} Parenfy. General parenting support only — not medical or emergency advice.
        </p>
      </div>
    </footer>
  );
}
