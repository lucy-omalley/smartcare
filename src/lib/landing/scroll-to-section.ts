/** Smooth-scroll to an in-page anchor (e.g. #pricing). Works reliably with Next.js App Router. */
export function scrollToSection(hash: string) {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }
}
