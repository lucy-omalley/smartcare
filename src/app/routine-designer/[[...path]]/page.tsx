import { redirect } from 'next/navigation';

export default function RoutineDesignerRedirectPage({
  params,
}: {
  params: { path?: string[] };
}) {
  const suffix = params.path?.length ? `/${params.path.join('/')}` : '';
  redirect(`/adventure-journey${suffix}`);
}
