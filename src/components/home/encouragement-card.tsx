'use client';

interface EncouragementCardProps {
  message: string;
}

export function EncouragementCard({ message }: EncouragementCardProps) {
  return (
    <article className="visual-card animate-fade-in-up overflow-hidden">
      <div className="bg-gradient-to-br from-rose-100 via-amber-50 to-yellow-100 px-6 py-8 text-center">
        <span className="text-3xl block mb-3">🌟</span>
        <p className="text-xs font-medium uppercase tracking-wider text-rose-800/70 mb-2">Parenting Encouragement</p>
        <p className="text-lg font-medium leading-relaxed text-foreground/90">{message}</p>
      </div>
    </article>
  );
}
