"use client";

export function StarsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-8 right-4 text-4xl opacity-70 animate-pulse">🌙</div>
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/80 animate-pulse"
          style={{
            width: `${(i % 3) + 1}px`,
            height: `${(i % 3) + 1}px`,
            top: `${(i * 17) % 100}%`,
            left: `${(i * 23 + 7) % 100}%`,
            animationDelay: `${(i % 5) * 0.4}s`,
            opacity: 0.3 + (i % 4) * 0.15,
          }}
        />
      ))}
    </div>
  );
}
