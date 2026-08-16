import { redirect } from "next/navigation";

export default function PostersLegacyRedirect({ params }: { params: { path?: string[] } }) {
  const suffix = params.path?.length ? `/${params.path.join("/")}` : "";
  redirect(`/routine-designer${suffix}`);
}
