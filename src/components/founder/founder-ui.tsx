import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
        {hint ? <p className="text-[10px] text-muted-foreground mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function AlertBanner({
  level,
  title,
  message,
}: {
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
    warning:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    critical:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
  };
  return (
    <div className={`rounded-xl border p-3 text-sm ${styles[level]}`}>
      <p className="font-semibold">{title}</p>
      <p className="text-xs mt-0.5 opacity-90">{message}</p>
    </div>
  );
}

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return <p className="text-sm text-muted-foreground py-12 text-center">{message}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center space-y-2">
      <p className="text-destructive text-sm">{message}</p>
      <p className="text-xs text-muted-foreground">
        Founder access required — set FOUNDER_ADMIN_EMAILS or isAdmin on your account.
      </p>
    </div>
  );
}
